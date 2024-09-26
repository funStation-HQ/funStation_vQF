// This is a demo task to demonstrate the workflow of a Raffle.

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { getBytesSelector } from "./utils";
import { getEmittedArgument } from "../tests/helpers/utils";
import { AssetVault__factory,
    Events__factory,
    FairHub,
    MockAirnodeRrpV0__factory,
    MockNFT__factory,
    Raffle__factory,
    VaultDepositRouter,
    VaultFactory,
    WinnerAirnode__factory,
    RaffleBeacon__factory } from "../typechain";

async function main ()
{
    const [ deployer, participant, creator, additional, 
        external, extra ] = await ethers.getSigners();
    const eventsLib = await new Events__factory(deployer).deploy();
    
    const raffleLogic = await new Raffle__factory(deployer).deploy();
    const raffleBeacon = await new RaffleBeacon__factory(deployer).deploy(
        raffleLogic.address
    );
    const fairHub = await upgrades.deployProxy(
        await ethers.getContractFactory("FairHub"),
        [raffleBeacon.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as FairHub;
    await fairHub.deployed();

    console.log(`\
    ============================================================\n\
    Contracts currently deployed: \n\n\
    Raffle<Logic>: ${raffleLogic.address}\n\
    RaffleBeacon<Proxy>: ${raffleBeacon.address}\n\
    FairHub<UUPS>: ${fairHub.address}\n\n\
    About to create first proxy for Raffle to interact with...\n\
    ============================================================\n`
    );

    const currentTime = await time.latest() + 60;
    const creatorHub = fairHub.connect(creator);
    await (await creatorHub.createRaffle(
        currentTime,
        currentTime + 60, // One additional minute
        1,
        {
            hash: ethers.utils.randomBytes(32),
            hash_function: 18,
            size: 32
        }
    )).wait();
    const raffleAddress = await fairHub.getRaffleAddress(1);
    const raffleContract = await ethers.getContractAt(
        "Raffle",
        raffleAddress
    );
    const raffle = raffleContract.connect(creator);
    console.log(`\
    ============================================================\n\
    Raffle created @ ${raffle.address}
    With the following parameters:\n\n\
    raffleId: 1\n\
    creatorAddress: ${creator.address}\n\
    winnerNumber: 1\n\
    startTime: ${currentTime}\n\
    endTime: ${currentTime + 3}\n\n\
    About to deploy remaining contracts...\n\
    ============================================================\n`
    );

    const mockRrpV0 = await new MockAirnodeRrpV0__factory(deployer).deploy();
    const winnerAirnode = await new WinnerAirnode__factory(deployer).deploy(
        mockRrpV0.address
    );
    await winnerAirnode.setRequestParameters(
        external.address,
        deployer.address,
        additional.address
    );

    const qrngData: {
        [index: string]: string
    } = require("../qrng.json");

    await winnerAirnode.addNewEndpoint(
        qrngData["endpointIdUint256"],
        "getIndividualWinner(bytes32,bytes)"
    );
    await winnerAirnode.addNewEndpoint(
        qrngData["endpointIdUint256Array"],
        "getMultipleWinners(bytes32,bytes)"
    );

    const assetVaultLogic = await new AssetVault__factory(deployer).deploy();

    const vaultFactory = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultFactory"), 
        [assetVaultLogic.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultFactory;
    await vaultFactory.deployed();

    const depositRouter = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultDepositRouter"),
        [vaultFactory.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultDepositRouter;
    await depositRouter.deployed();

    const mockNft = await new MockNFT__factory(deployer).deploy(
        "Mock NFT",
        "MOCk"
    );

    console.log(`\
    ============================================================\n\
    Pending contracts: \n\n\
    MockRrpV0<Protocol>: ${mockRrpV0.address}\n\
    WinnerAirnode<Requester>: ${winnerAirnode.address}\n\
    AssetVault<Logic>: ${assetVaultLogic.address}\n\
    VaultFactory<UUPS>: ${vaultFactory.address}\n\
    VaultDepositRouter<UUPS>: ${depositRouter.address}\n\
    MockNFT: ${mockNft.address}\n\n\
    About to \`open\` raffle and initialize workflow...\n\
    ============================================================\n`
    );

    await mockNft.mint(creator.address, 1);
    const creatorNFt = mockNft.connect(creator);
    await creatorNFt.approve(depositRouter.address, 1);
    console.log(`\
    Minting tokenId \`1\` and approving for VaultDepositRouter to transfer it...\n`
    );
    
    await raffle.open(
        vaultFactory.address,
        depositRouter.address,
        [mockNft.address],
        [1]
    );
    console.log(`\
    Raffle is open! Waiting for participants...\n`
    );

    await raffle.enter(participant.address);
    console.log(`\
    Participant with address ${participant.address} just enter!\n`
    );
    await raffle.enter(extra.address);
    console.log(`\
    Participant with address ${extra.address} just enter!\n`
    );

    await raffle.setRequester(winnerAirnode.address);

    await time.increase(120);    // To match ending time

    const txClose = await ( await raffle.close() ).wait();
    const requestId = getEmittedArgument(
        txClose,
        eventsLib,
        "NewWinnerRequest",
        0
    ) as string[];
    
    console.log(`\
    Raffle has been close! The RequestId generated is ${requestId[0]}`
    );

    const expectedData = ethers.utils.randomBytes(32);
    const currentAirnode = await winnerAirnode.airnode();
    await (await mockRrpV0.fulfill(
        requestId[0],
        currentAirnode,
        winnerAirnode.address,
        getBytesSelector("getIndividualWinner(bytes32,bytes)"),
        expectedData,
        []
    )).wait();

    await (await raffle.finish()).wait();
    console.log(`\
    Raffle has been terminated! The winners have been picked...\n`);

    const winner = await raffle.winners(0);
    console.log(`\
    And the winner is: ${winner}\n`);

    console.log(`\
    Done with the workflow!`
    );
}

main();
