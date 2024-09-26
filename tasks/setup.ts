// Task to parametrized deployed contracts.

import { task } from "hardhat/config";
import { getPrivateKey, 
    getProviderURL, loadJsonFile,
    getAirnodeRrpV0Contract, getDerivedSponsorAddress,
    getQrngData, StringIndexToString,
    getRoleId, deriveSelector
} from "../scripts/utils";

const airnodeSponsorFunding: StringIndexToString = {
    "arbitrum": "0.008",
    "optimism": "0.001",
    "polygon": "10",
    "sepolia": "0.025"
}

task(
    "setup",
    "Setups any configuration in the deployed contracts",
    async (_, hre) => 
    {
    
    const addresses = loadJsonFile(
        `addresses/${hre.network.name}.json`
    ) as StringIndexToString;
    const provider = new hre.ethers.providers.JsonRpcProvider(
        getProviderURL(hre.network.name)
    );
    const wallet = new hre.ethers.Wallet(
        getPrivateKey(),
        provider
    );
    const qrngData = getQrngData(hre.network.config.chainId as number);

    const winnerAirnode = await hre.ethers.getContractAt(
        "WinnerAirnode",
        addresses["winnerAirnode"],
        wallet
    );
    const airnodeRrpV0 = getAirnodeRrpV0Contract(
        hre.network.config.chainId as number,
        wallet
    );

    const value = airnodeSponsorFunding[hre.network.name];
    if (qrngData != null) {
        const sponsorWallet = await getDerivedSponsorAddress(
            qrngData["xpub"],
            qrngData["airnode"],
            wallet.address
        ); 

        console.log("Setting up WinnerAirnode parameters...\n");
        await (
            await winnerAirnode.addNewEndpoint(
                qrngData["endpointIdUint256"],
                "getIndividualWinner(bytes32,bytes)"
            )
        ).wait();
        await(
            await winnerAirnode.addNewEndpoint(
                qrngData["endpointIdUint256Array"],
                "getMultipleWinners(bytes32,bytes)"
            )
        ).wait();
        await (
            await winnerAirnode.setRequestParameters(
                qrngData["airnode"],
                sponsorWallet,
                wallet.address
            )
        ).wait();
        await (
            await airnodeRrpV0.setSponsorshipStatus(
                winnerAirnode.address,
                true
            )
        ).wait();
        await (
            await wallet.sendTransaction({
                to: sponsorWallet,
                value: hre.ethers.utils.parseEther(value),
            })
        ).wait();
    }
    console.log("Done setting up WinnerAirnode parameters...\n");

    console.log("Setting up Vault Module parameters...\n");
    const vaultFactory = await hre.ethers.getContractAt(
        "VaultFactory",
        addresses["vaultFactoryProxy"],
        wallet
    );
    await (
        await vaultFactory.setDistributor(
            addresses["distributor"]
        )
    ).wait();

    console.log("Done setting up Vault Module parameters...\n");

    console.log("Seeting up ACL module parameters...\n");
    const accessManager = await hre.ethers.getContractAt(
        "AccessManager",
        addresses["accessManagerProxy"],
        wallet
    );
    const fairHub = await hre.ethers.getContractAt(
        "FairHub",
        addresses["fairHubProxy"],
        wallet
    );

    const managerRole = getRoleId("MANAGER_ROLE");
    await (
        await accessManager.grantRole(
            managerRole,
            wallet.address
        )
    ).wait();

    const targetFunctionsNames = [
        "setWinnerAirnodeAddress",
        "setVaultFactoryAddress",
        "setDepositRouterAddress",
        "setDApiManagerAddress",
        "setTreasuryAddress",
        "setRaffleCut",
        "setCancelationFee",
        "setYoloRaffleCut",
        "setYoloRaffleDuration",
        "setOwner",
        "pauseRaffles",
        "unpauseRaffles",
        "createYoloRaffle"
    ];
    const targetFunctionsSelectors = targetFunctionsNames.map(
        name => deriveSelector(
            fairHub.interface.getFunction(
                // @ts-ignore
                name
            )
        )
    );

    await (
        await accessManager.setTargetFunctionRole(
            fairHub.address,
            targetFunctionsSelectors,
            managerRole
        )
    ).wait();

    console.log("Done setting up ACL Module parameters...\n");

    console.log("Setting up FairHub parameters...\n");

    await (
        await fairHub.setWinnerAirnodeAddress(
            winnerAirnode.address
        )
    ).wait();

    await (
        await fairHub.setDApiManagerAddress(
            addresses['dApiManagerProxy']
        )
    ).wait();

    await (
        await fairHub.setVaultFactoryAddress(
            addresses["vaultFactoryProxy"]
        )
    ).wait();

    await (
        await fairHub.setDepositRouterAddress(
            addresses["vaultDepositRouterProxy"]
        )
    ).wait();

    await (
        await fairHub.setRaffleCut(
            5
        )
    ).wait();

    await (
        await fairHub.setYoloRaffleCut(
            5
        )
    ).wait();

    await (
        await fairHub.setCancelationFee(
            hre.ethers.utils.parseEther("0.01")
        )
    ).wait();

    await (
        await fairHub.setYoloRaffleDuration(
            // 60 seconds * 60 minutes = 1 hour
            60 * 60
        )
    ).wait();

    await (
        await fairHub.setTreasuryAddress(
            wallet.address
        )
    ).wait();
    console.log("Done setting up FairHub parameters...\n");
});
