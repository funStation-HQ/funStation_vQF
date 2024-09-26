// Test expected behavior from the `Raffle` contract core functions.

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { 
    getBytesSelector,
    mulDiv
} from "../../../../scripts/utils";
import { RaffleFixture } from "../../../helpers/types";
import {
    getEmittedArgument,
    getVaultId, matchEvent,
} from "../../../helpers/utils";
import {
    RaffleStatus,
    CancelationReason,
    RaffleType
} from "../../../helpers/dataTypes";
import type { BigNumber } from "ethers";

export async function shouldBehaveLikeRaffle(
    fixtureSetup: () => Promise<RaffleFixture>,
    fixtureErc20Setup: () => Promise<RaffleFixture>,
    fixtureDApiSetup: () => Promise<RaffleFixture>
) {
    context("Successful calls", () => {
        context("Native Raffle", () => {
            context("One winner, token, and beneficiary", () => {
                it("open", async () => {
                    const { raffle, creator, vaultFactory, mockNft,
                        depositRouter }  = await loadFixture(fixtureSetup);

                    // On production we assume the raffle creator already owns an NFT.
                    // For testing purposes we will mint the NFT in here.
                    await mockNft.mint(creator.address, 1);

                    // Verify correct balances for the creator address NFTs.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(creator.address);
                    expect(await mockNft.getApproved(1))
                        .to.equal(ethers.constants.AddressZero);

                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    // Without the approval, the raffle contract will not be able to
                    // transfer the NFT to the vault.
                    expect(await mockNft.getApproved(1))
                        .to.equal(depositRouter.address);

                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    // Verify the new raffle storage variables.
                    const prizesVaultAddress = await vaultFactory.instanceAtIndex(0);
                    const ticketsVaultAddress = await vaultFactory.instanceAtIndex(1);
                    expect(await raffle.prizesVaultAddress())
                        .to.equal(prizesVaultAddress);
                    expect(await raffle.prizesVaultId())
                        .to.equal(getVaultId(prizesVaultAddress));
                    expect(await raffle.ticketsVaultAddress())
                        .to.equal(ticketsVaultAddress);
                    expect(await raffle.ticketsVaultId())
                        .to.equal(getVaultId(ticketsVaultAddress));
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);
                    expect(await raffle.tokens(0))
                        .to.equal(mockNft.address);
                    expect(await raffle.ids(0))
                        .to.equal(1);

                    // Verify that the NFT was transfered to the Vault.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(prizesVaultAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(prizesVaultAddress);

                    expect(await ethers.provider.getBalance(ticketsVaultAddress))
                        .to.equal(0);
                });

                it("enter", async () => {
                    const { raffle, creator, participant, extra, mockNft,
                        depositRouter, rafflePrice }  = await loadFixture(fixtureSetup);

                    // Repeat steps from the `open` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();

                    // Now we test the `enter` function.
                    let vaultBalance = await ethers.provider.getBalance(ticketsVaultAddress);

                    // User pays for itself
                    await raffle.connect(
                        participant
                    ).enter(
                        participant.address,
                        1,
                        {
                            value: ethers.utils.parseEther("1")
                        }
                    );
                    vaultBalance = vaultBalance.add(rafflePrice);

                    expect(await raffle.participants(0))
                        .to.equal(participant.address);
                    expect(await raffle.entries(participant.address))
                        .to.equal(1);
                    expect(await raffle.totalParticipants())
                        .to.equal(1);
                    expect(await raffle.totalEntries())
                        .to.equal(1);
                    expect(await ethers.provider.getBalance(ticketsVaultAddress))
                        .to.equal(vaultBalance);

                    // User pays for other wallet.
                    await raffle.connect(
                        participant
                    ).enter(
                        extra.address,
                        2,
                        {
                            value: ethers.utils.parseEther("2")
                        }
                    );
                    vaultBalance = vaultBalance.add(rafflePrice.mul(2));

                    expect(await raffle.participants(1))
                        .to.equal(extra.address);
                    expect(await raffle.entries(extra.address))
                        .to.equal(2);
                    expect(await raffle.totalParticipants())
                        .to.equal(2);
                    expect(await ethers.provider.getBalance(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                });

                it("close", async () => {
                    const { raffle, creator, mockNft, depositRouter,
                        eventsLib, participant, extra, opt,
                        winnerAirnode }  = await loadFixture(fixtureSetup);

                    // Repeat steps from the `enter` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    await raffle.connect(
                        extra
                    ).enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });

                    // We add the beneficiaries to the raffle.
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    );

                    // This is the time we set for the raffle to end.
                    await time.increase(360);

                    // Now we test the `close` function.
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[];

                    // Verify the new raffle storage variables.
                    expect(await raffle.requestId())
                        .to.equal(requestId[0]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Close);
                });

                it("finish", async () => {
                    const { raffle, mockNft,
                        depositRouter, eventsLib,
                        creator, participant, extra,
                        opt, treasury,
                        winnerAirnode, mockRrpV0,
                        fairHub
                    }  = await loadFixture(fixtureSetup);

                    // Repeat steps from the `close` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    let vaultBalance = await ethers.provider.getBalance(
                        ticketsVaultAddress
                    );
                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("1"));
                    await raffle.connect(
                        extra
                    ).enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("2"));
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    );
                    await time.increase(360);
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[];

                    // We emulate the airnode protocol process and response.
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

                    // Prior to closing we verify that the participants don't have the token.
                    expect(await mockNft.balanceOf(participant.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(extra.address))
                        .to.equal(0);
                    // And also the balances from the vaults.
                    expect(await ethers.provider.getBalance(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    const initialCreatorBalance = await ethers.provider.getBalance(
                        creator.address
                    );
                    const beneficiaryBalance = await ethers.provider.getBalance(
                        opt.address
                    );
                    const treasuryBalance = await ethers.provider.getBalance(
                        treasury.address
                    );

                    // Now we test the `finish` function.
                    const txFinish = await (await raffle.finish()).wait();
                    const eventWinnerAddress = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        3
                    ) as Array<Array<String> | undefined>;
                    const eventWinnerIndex = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        2
                    ) as Array<Array<String> | undefined>;

                    const winnerAddressArray = eventWinnerAddress.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const winnerIndexArray = eventWinnerIndex.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const treasuryAmount = vaultBalance.mul(
                        await fairHub.getRaffleCut()
                    ).div(100)
                    const availableAmount = vaultBalance.sub(
                        treasuryAmount
                    );

                    await matchEvent(
                        txFinish,
                        "RaffleFinished",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            winnerIndexArray,
                            winnerAddressArray,
                            availableAmount,
                            treasuryAmount
                        ],
                        raffle.address
                    );

                    // Verify the new raffle storage variables.
                    const winnerAddress = (winnerAddressArray[0] as string);
                    expect(await raffle.winners(0))
                        .to.deep.equal(winnerAddress);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Finish);

                    // Verify that the NFT was transfered to the Vault,
                    // and that ticket pool was transfer to owner.
                    const vaultAddress = await raffle.prizesVaultAddress();
                    expect(await mockNft.balanceOf(vaultAddress))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(winnerAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(winnerAddress);
                    expect(
                        await ethers.provider.getBalance(
                            ticketsVaultAddress
                        )
                    ).to.equal(0);
                    expect(
                        await ethers.provider.getBalance(
                            creator.address
                        )
                    ).to.equal(
                        initialCreatorBalance.add(
                            availableAmount.mul(90).div(100)
                        ).sub(
                            txFinish.gasUsed.mul(
                                txFinish.effectiveGasPrice
                            )
                        )
                    );
                    expect(
                        await ethers.provider.getBalance(
                            opt.address
                        )
                    ).to.equal(
                        beneficiaryBalance.add(
                            availableAmount.mul(10).div(100)
                        )
                    );
                    expect(
                        await ethers.provider.getBalance(
                            treasury.address
                        )
                    ).to.equal(
                        treasuryBalance.add(
                            treasuryAmount
                        )
                    );
                });
            });

            context("Multiple winners & token ids, no beneficiaries", async () => {
                it("open", async () => {
                    const { raffle, creator,
                        mockNft, depositRouter
                    }  = await loadFixture(
                        fixtureSetup
                    );

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);

                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);

                    await raffle.updateWinners(2);

                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );

                    expect(await raffle.tokens(0))
                        .to.equal(mockNft.address);
                    expect(await raffle.ids(0))
                        .to.equal(1);
                    expect(await raffle.tokens(1))
                        .to.equal(mockNft.address);
                    expect(await raffle.ids(1))
                        .to.equal(2);
                });

                it("enter", async () => {
                    const { raffle, creator,
                        participant, extra,
                        mockNft, depositRouter
                    }  = await loadFixture(
                        fixtureSetup
                    );

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );

                    // User pays for itself
                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    expect(await raffle.participants(0))
                        .to.equal(participant.address);

                    // User pays for other user
                    await raffle.connect(
                        participant
                    ).enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });
                    expect(await raffle.participants(1))
                        .to.equal(extra.address);
                });

                it("close", async () => {
                    const { raffle, creator,
                        mockNft,
                        depositRouter, eventsLib,
                        participant, extra,
                        winnerAirnode }  = await loadFixture(fixtureSetup);

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );
                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    await raffle.connect(
                        extra
                    ).enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });
                    await time.increase(360);

                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[];

                    expect(await raffle.requestId())
                        .to.equal(requestId[0]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Close);
                });

                it("finish", async () => {
                    const { raffle, creator, treasury,
                        mockNft, depositRouter, eventsLib,
                        participant, extra,
                        winnerAirnode, mockRrpV0,
                        fairHub
                    }  = await loadFixture(fixtureSetup);

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    let vaultBalance = await ethers.provider.getBalance(
                        ticketsVaultAddress
                    );
                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("1"));
                    await raffle.connect(
                        extra
                    ).enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("2"));
                    await time.increase(360);

                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[];

                    // We emulate the airnode protocol process and response.
                    const expectedData = ethers.utils.defaultAbiCoder.encode(
                        [
                            "bytes32[]"
                        ],
                        [
                            [
                                ethers.utils.randomBytes(32),
                                ethers.utils.randomBytes(32)
                            ]
                        ]
                    );
                    const currentAirnode = await winnerAirnode.airnode();
                    await (
                        await mockRrpV0.fulfill(
                            requestId[0],
                            currentAirnode,
                            winnerAirnode.address,
                            getBytesSelector("getMultipleWinners(bytes32,bytes)"),
                            expectedData,
                            []
                        )
                    ).wait();

                    // Prior to closing we verify that the participants don't have the token.
                    expect(await mockNft.balanceOf(participant.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(extra.address))
                        .to.equal(0);
                    // And also the balances from the vaults.
                    expect(await ethers.provider.getBalance(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    const initialCreatorBalance = await ethers.provider.getBalance(
                        creator.address
                    );
                    const initialTreasuryBalance = await ethers.provider.getBalance(
                        treasury.address
                    );

                    // Now we test the `finish` function.
                    const txFinish = await (await raffle.finish()).wait();
                    const eventWinnerAddress = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        3
                    ) as Array<Array<String> | undefined>;
                    const eventWinnerIndex = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        2
                    ) as Array<Array<String> | undefined>;
                    const winnerAddressesArray = eventWinnerAddress.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const winnerIndexesArray = eventWinnerIndex.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const treasuryAmount = vaultBalance.mul(
                        await fairHub.getRaffleCut()
                    ).div(100)
                    const availableAmount = vaultBalance.sub(
                        treasuryAmount
                    );

                    await matchEvent(
                        txFinish,
                        "RaffleFinished",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            winnerIndexesArray,
                            winnerAddressesArray,
                            availableAmount,
                            treasuryAmount
                        ],
                        raffle.address
                    );

                    // Verify the new raffle storage variables.
                    expect(await raffle.winners(0))
                        .to.deep.equal(winnerAddressesArray[0]);
                    expect(await raffle.winners(1))
                        .to.deep.equal(winnerAddressesArray[1]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Finish);

                    // Verify that the NFTs were transfered to the Vault,
                    // and that the ticket pool was transfered to owner.
                    const vaultAddress = await raffle.prizesVaultAddress();
                    expect(await mockNft.balanceOf(vaultAddress))
                        .to.equal(0);
                    if (winnerAddressesArray[0] == winnerAddressesArray[1]) {
                        expect(
                            await mockNft.balanceOf(
                                winnerAddressesArray[0] as string
                            )
                        ).to.equal(
                            2
                        );
                    } else {
                        expect(await mockNft.balanceOf(
                            winnerAddressesArray[0] as string
                        )
                        ).to.equal(1);
                        expect(await mockNft.balanceOf(
                            winnerAddressesArray[1] as string
                        )
                        ).to.equal(1);
                    }
                    expect(await mockNft.ownerOf(1))
                        .to.equal(winnerAddressesArray[0] as string);
                    expect(await mockNft.ownerOf(2))
                        .to.equal(winnerAddressesArray[1] as string);
                    expect(
                        await ethers.provider.getBalance(
                            ticketsVaultAddress
                        )
                    ).to.equal(0);

                    expect(
                        await ethers.provider.getBalance(
                            treasury.address
                        )
                    ).to.equal(
                        initialTreasuryBalance.add(
                            treasuryAmount
                        )
                    );
                    expect(
                        await ethers.provider.getBalance(
                            creator.address
                        )
                    ).to.equal(
                        initialCreatorBalance.add(
                            availableAmount
                        ).sub(
                            txFinish.gasUsed.mul(
                                txFinish.effectiveGasPrice
                            )
                        )
                    );
                });
            });

            context("cancel", () => {
                it("Raffle Uninitialized", async () => {
                    const {
                        raffle, eventsLib
                    }  = await loadFixture(
                        fixtureSetup
                    );

                    expect(
                        await raffle.status()
                    ).to.equal(
                        RaffleStatus.Uninitialized
                    );

                    const txCancel = await (
                        await raffle.cancel(
                            {
                                value: ethers.utils.parseUnits("1", "gwei")
                            }
                        )
                    ).wait();

                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Canceled);
                    await matchEvent(
                        txCancel,
                        "RaffleCanceled",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            CancelationReason.CreatorDecision
                        ],
                        raffle.address
                    );
                });

                it("Rafle open, no participants", async () => {
                    const {
                        raffle, creator, mockNft,
                        depositRouter, eventsLib
                    }  = await loadFixture(
                        fixtureSetup
                    );

                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    // Verify initial raffle assets.
                    expect(
                        await mockNft.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        0
                    );
                    expect(
                        await mockNft.balanceOf(
                            await raffle.prizesVaultAddress()
                        )
                    ).to.equal(
                        1
                    );
                    expect(
                        await mockNft.ownerOf(
                            1
                        )
                    ).to.equal(
                        await raffle.prizesVaultAddress()
                    );

                    // Verify raffle succesfully open
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);

                    // Call the cancel function
                    const txCancel = await (
                        await raffle.cancel({
                            value: ethers.utils.parseUnits("1", "gwei")
                        })
                    ).wait();

                    // Verify raffle succesfully canceled
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Canceled);

                    await matchEvent(
                        txCancel,
                        "RaffleCanceled",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            CancelationReason.CreatorDecision
                        ],
                        raffle.address
                    );

                    // Verify the NFT was transfered back to the creator.
                    expect(
                        await mockNft.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        1
                    );
                    expect(
                        await mockNft.balanceOf(
                            await raffle.prizesVaultAddress()
                        )
                    ).to.equal(
                        0
                    );
                    expect(
                        await mockNft.ownerOf(
                            1
                        )
                    ).to.equal(
                        creator.address
                    );
                });

                it("Raffle open, with participants", async () => {
                    const {
                        raffle, creator, participant, extra,
                        mockNft, depositRouter, eventsLib
                    }  = await loadFixture(
                        fixtureSetup
                    );

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );

                    await raffle.connect(
                        participant
                    ).enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    const initialParticipantBalance = await ethers.provider.getBalance(
                        participant.address
                    );
                    await raffle.connect(
                        extra
                    ).enter(extra.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    const initialExtraBalance = await ethers.provider.getBalance(
                        extra.address
                    );


                    // Verify raffle succesfully open
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);

                    // Call the cancel function
                    const txCancel = await (
                        await raffle.cancel({
                            value: ethers.utils.parseUnits("1", "gwei")
                        })
                    ).wait();

                    // Verify raffle succesfully canceled
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Canceled);

                    await matchEvent(
                        txCancel,
                        "RaffleCanceled",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            CancelationReason.CreatorDecision
                        ],
                        raffle.address
                    );

                    // Verify the balance was transfered back to the participants.
                    expect(
                        await ethers.provider.getBalance(
                            participant.address
                        )
                    ).to.equal(
                        initialParticipantBalance.add(
                            ethers.utils.parseEther("1")
                        )
                    );
                    expect(
                        await ethers.provider.getBalance(
                            extra.address
                        )
                    ).to.equal(
                        initialExtraBalance.add(
                            ethers.utils.parseEther("1")
                        )
                    );

                    // Verify the NFT was transfered back to the creator.
                    expect(
                        await mockNft.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        2
                    );
                    expect(
                        await mockNft.balanceOf(
                            await raffle.prizesVaultAddress()
                        )
                    ).to.equal(
                        0
                    );
                    expect(
                        await mockNft.ownerOf(
                            1
                        )
                    ).to.equal(
                        creator.address
                    );
                    expect(
                        await mockNft.ownerOf(
                            2
                        )
                    ).to.equal(
                        creator.address
                    );
                });
            });

            context("forceRecover", () => {
                it("Raffle Open", async () => {
                    const { raffle, creator, deployer,
                        mockNft, depositRouter, eventsLib,
                        participant, extra, errorsLib
                    }  = await loadFixture(fixtureSetup);

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    const ticketVault = await ethers.getContractAt(
                        "AssetVault",
                        ticketsVaultAddress
                    );
                    const prizeVaultAddress = await raffle.prizesVaultAddress();
                    const prizeVault = await ethers.getContractAt(
                        "AssetVault",
                        prizeVaultAddress
                    );

                    await raffle.enter(participant.address, 1, {
                        value: ethers.utils.parseEther("1")
                    });
                    await raffle.enter(extra.address, 2, {
                        value: ethers.utils.parseEther("2")
                    });

                    // Verify vaults status
                    expect(
                        await ticketVault.withdrawEnabled()
                    ).to.equal(
                        false
                    );
                    expect(
                        await ticketVault.owner()
                    ).to.equal(
                        raffle.address
                    );
                    expect(
                        await prizeVault.withdrawEnabled()
                    ).to.equal(
                        false
                    );
                    expect(
                        await prizeVault.owner()
                    ).to.equal(
                        raffle.address
                    );

                    // Execute the forceRecover function
                    const txForceRecover = await (
                        await raffle.forceRecover()
                    ).wait();

                    await matchEvent(
                        txForceRecover,
                        "RaffleCanceled",
                        eventsLib,
                        [
                            1,
                            RaffleType.Traditional,
                            CancelationReason.ForcedCancelation
                        ],
                        raffle.address
                    );

                    // Verify new vaults status
                    expect(
                        await ticketVault.withdrawEnabled()
                    ).to.equal(
                        false
                    );
                    expect(
                        await ticketVault.owner()
                    ).to.equal(
                        deployer.address
                    );
                    expect(
                        await prizeVault.withdrawEnabled()
                    ).to.equal(
                        false
                    );
                    expect(
                        await prizeVault.owner()
                    ).to.equal(
                        deployer.address
                    );

                    // Test new ownership
                    await expect(
                        ticketVault.connect(
                            creator
                        ).enableWithdraw()
                    ).to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    );
                    await expect(
                        ticketVault.connect(
                            deployer
                        ).enableWithdraw()
                    ).to.not.be.reverted;
                    await expect(
                        prizeVault.connect(
                            creator
                        ).enableWithdraw()
                    ).to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    );
                    await expect(
                        prizeVault.connect(
                            deployer
                        )
                    ).to.not.be.reverted;
                });
            });
        });

        context("ERC20 Raffle", () => {
            context("One winner, token, and beneficiary", () => {
                it("open", async () => {
                    const { raffle, creator, vaultFactory, mockNft, mockErc20,
                        depositRouter }  = await loadFixture(fixtureErc20Setup);

                    await mockNft.mint(creator.address, 1);

                    // Verify correct balances for the creator address NFTs.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(creator.address);
                    expect(await mockNft.getApproved(1))
                        .to.equal(ethers.constants.AddressZero);

                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    // Without the approval, the raffle contract will not be able to
                    // transfer the NFT to the vault.
                    expect(await mockNft.getApproved(1))
                        .to.equal(depositRouter.address);

                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    // Verify the new raffle storage variables.
                    const prizesVaultAddress = await vaultFactory.instanceAtIndex(0);
                    const ticketsVaultAddress = await vaultFactory.instanceAtIndex(1);
                    expect(await raffle.prizesVaultAddress())
                        .to.equal(prizesVaultAddress);
                    expect(await raffle.prizesVaultId())
                        .to.equal(getVaultId(prizesVaultAddress));
                    expect(await raffle.ticketsVaultAddress())
                        .to.equal(ticketsVaultAddress);
                    expect(await raffle.ticketsVaultId())
                        .to.equal(getVaultId(ticketsVaultAddress));
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);
                    expect(await raffle.tokens(0))
                        .to.equal(mockNft.address);
                    expect(await raffle.ids(0))
                        .to.equal(1);

                    // Verify that the NFT was transfered to the Vault.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(prizesVaultAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(prizesVaultAddress);

                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(0);
                });

                it("enter", async () => {
                    const { raffle, creator, participant,
                        extra, mockNft, mockErc20,
                        depositRouter, rafflePrice
                    }  = await loadFixture(fixtureErc20Setup);

                    // Repeat steps from the `open` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();

                    // We fund the wallets with ERC20 tokens for testing purposes.
                    // On production we assume wallets already have the tokens.
                    await mockErc20.transfer(
                        participant.address,
                        ethers.utils.parseEther("3.0")
                    );

                    // Now we test the `enter` function.
                    let vaultBalance = await mockErc20.balanceOf(ticketsVaultAddress);

                    // Participant pays for itself.
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    vaultBalance = vaultBalance.add(rafflePrice);

                    expect(await raffle.participants(0))
                        .to.equal(participant.address);
                    expect(await raffle.entries(participant.address))
                        .to.equal(1);
                    expect(await raffle.totalParticipants())
                        .to.equal(1);
                    expect(await raffle.totalEntries())
                        .to.equal(1);
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    
                    // Participant pays for extra.
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await raffle.connect(participant).enter(
                        extra.address,
                        2
                    );
                    vaultBalance = vaultBalance.add(rafflePrice.mul(2));

                    expect(await raffle.participants(1))
                        .to.equal(extra.address);
                    expect(await raffle.entries(extra.address))
                        .to.equal(2);
                    expect(await raffle.totalParticipants())
                        .to.equal(2);
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                });

                it("close", async () => {
                    const { raffle, creator, mockNft, mockErc20, depositRouter,
                        eventsLib, participant, extra, opt, winnerAirnode
                    }  = await loadFixture(fixtureErc20Setup)
                    // Repeat steps from the `enter` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    await mockErc20.transfer(
                        participant.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    )
                    // We add the beneficiaries to the raffle.
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    )
                    // This is the time we set for the raffle to end.
                    await time.increase(360)
                    // Now we test the `close` function.
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[]
                    // Verify the new raffle storage variables.
                    expect(await raffle.requestId())
                        .to.equal(requestId[0]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Close);
                });
        
                it("finish", async () => {
                    const { raffle, creator, mockNft, mockErc20,
                        depositRouter, eventsLib, participant, extra,
                        opt, winnerAirnode, mockRrpV0, fairHub
                    }  = await loadFixture(fixtureErc20Setup)
                    // Repeat steps from the `close` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    await mockErc20.transfer(
                        participant.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ethers.utils.parseEther("2.0")
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    let vaultBalance = await mockErc20.balanceOf(
                        ticketsVaultAddress
                    );
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("1"));
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    );
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("2"));
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    );
                    await time.increase(360);
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[]
                    // We emulate the airnode protocol process and response.
                    const expectedData = ethers.utils.randomBytes(32);
                    const currentAirnode = await winnerAirnode.airnode();
                    await (await mockRrpV0.fulfill(
                        requestId[0],
                        currentAirnode,
                        winnerAirnode.address,
                        getBytesSelector("getIndividualWinner(bytes32,bytes)"),
                        expectedData,
                        []
                    )).wait()
                    // Prior to closing we verify that the participants don't have the token.
                    expect(await mockNft.balanceOf(participant.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(extra.address))
                        .to.equal(0);
                    // And also the balances from the vaults.
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    const beneficiaryBalance = await mockErc20.balanceOf(
                        opt.address
                    )
                    // Now we test the `finish` function.
                    const txFinish = await (await raffle.finish()).wait();
                    const eventWinnerAddress = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        3
                    ) as Array<Array<String> | undefined>;
                    const eventWinnerIndex = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        2
                    ) as Array<Array<String> | undefined>;
                    const winnerAddressArray = eventWinnerAddress.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const winnerIndexArray = eventWinnerIndex.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const treasuryAmount = vaultBalance.mul(
                        await fairHub.getRaffleCut()
                    ).div(100)
                    const availableAmount = vaultBalance.sub(
                        treasuryAmount
                    )
                    await matchEvent(
                        txFinish,
                        "RaffleFinished",
                        eventsLib,
                        [
                            2,
                            RaffleType.Traditional,
                            winnerIndexArray,
                            winnerAddressArray,
                            availableAmount,
                            treasuryAmount
                        ],
                        raffle.address
                    )
                    // Verify the new raffle storage variables.
                    const winnerAddress = (winnerAddressArray[0] as string);
                    expect(await raffle.winners(0))
                        .to.equal(winnerAddress);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Finish)
                    // Verify that the NFT was transfered to the Vault,
                    // and that ticket pool was transfer to owner.
                    const vaultAddress = await raffle.prizesVaultAddress();
                    expect(await mockNft.balanceOf(vaultAddress))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(winnerAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(winnerAddress);
                    expect(
                        await mockErc20.balanceOf(
                            ticketsVaultAddress
                        )
                    ).to.equal(0);

                    expect(
                        await mockErc20.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        availableAmount.mul(90).div(100)
                    );
                    expect(
                        await mockErc20.balanceOf(
                            opt.address
                        )
                    ).to.equal(
                        beneficiaryBalance.add(
                            availableAmount.mul(10).div(100)
                        )
                    );
                });
            });

            context("Multiple winners & token ids, no beneficiaries", () => {
                it("finish", async () => {
                    const { raffle, creator,
                        mockNft, mockErc20,
                        depositRouter, eventsLib,
                        participant, extra,
                        treasury, winnerAirnode,
                        mockRrpV0, fairHub
                    }  = await loadFixture(fixtureErc20Setup);

                    // Fund all the necessary wallets for the scenario.
                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );
                    await mockErc20.transfer(
                        participant.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ethers.utils.parseEther("2.0")
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    let vaultBalance = await mockErc20.balanceOf(
                        ticketsVaultAddress
                    );
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("1"));
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    );
                    vaultBalance = vaultBalance.add(ethers.utils.parseEther("2"));

                    await time.increase(360);
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[];

                    // We emulate the airnode protocol process and response.
                    const expectedData = ethers.utils.defaultAbiCoder.encode(
                        [
                            "bytes32[]"
                        ],
                        [
                            [
                                ethers.utils.randomBytes(32),
                                ethers.utils.randomBytes(32)
                            ]
                        ]
                    );
                    const currentAirnode = await winnerAirnode.airnode();
                    await (
                        await mockRrpV0.fulfill(
                            requestId[0],
                            currentAirnode,
                            winnerAirnode.address,
                            getBytesSelector("getMultipleWinners(bytes32,bytes)"),
                            expectedData,
                            []
                        )
                    ).wait()
                    // Prior to closing we verify that the participants don't have the token.
                    expect(await mockNft.balanceOf(participant.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(extra.address))
                        .to.equal(0);
                    // And also the balances from the vaults.
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance)
                    // Now we test the `finish` function.
                    const txFinish = await (await raffle.finish()).wait();
                    const eventWinnerAddress = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        3
                    ) as Array<Array<String> | undefined>;
                    const eventWinnerIndex = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        2
                    ) as Array<Array<String> | undefined>;
                    const winnerAddressesArray = eventWinnerAddress.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const winnerIndexesArray = eventWinnerIndex.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const treasuryAmount = vaultBalance.mul(
                        await fairHub.getRaffleCut()
                    ).div(100)
                    const availableAmount = vaultBalance.sub(
                        treasuryAmount
                    )
                    await matchEvent(
                        txFinish,
                        "RaffleFinished",
                        eventsLib,
                        [
                            2,
                            RaffleType.Traditional,
                            winnerIndexesArray,
                            winnerAddressesArray,
                            availableAmount,
                            treasuryAmount
                        ],
                        raffle.address
                    )
                    // Verify the new raffle storage variables.
                    expect(await raffle.winners(0))
                        .to.deep.equal(winnerAddressesArray[0]);
                    expect(await raffle.winners(1))
                        .to.deep.equal(winnerAddressesArray[1]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Finish)
                    // Verify that the NFT was transfered to the Vault,
                    // and that ticket pool was transfer to owner.
                    const vaultAddress = await raffle.prizesVaultAddress();
                    expect(await mockNft.balanceOf(vaultAddress))
                        .to.equal(0);
                    if (winnerAddressesArray[0] == winnerAddressesArray[1]) {
                        expect(
                            await mockNft.balanceOf(
                                winnerAddressesArray[0] as string
                            )
                        ).to.equal(
                            2
                        );
                    } else {
                        expect(await mockNft.balanceOf(
                            winnerAddressesArray[0] as string
                        )
                        ).to.equal(1);
                        expect(await mockNft.balanceOf(
                            winnerAddressesArray[1] as string
                        )
                        ).to.equal(1);
                    }
                    expect(await mockNft.ownerOf(1))
                        .to.equal(winnerAddressesArray[0] as string);
                    expect(await mockNft.ownerOf(2))
                        .to.equal(winnerAddressesArray[1] as string);
                    expect(
                        await mockErc20.balanceOf(
                            ticketsVaultAddress
                        )
                    ).to.equal(0)
                    expect(
                        await mockErc20.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        availableAmount
                    );
                    expect(
                        await mockErc20.balanceOf(
                            treasury.address
                        )
                    ).to.equal(
                        treasuryAmount
                    );
                });
            });

            context("cancel", () => {
                it("Raffle open, with participants", async () => {
                    const {
                        raffle, creator,
                        participant, extra,
                        mockNft, mockErc20,
                        depositRouter, eventsLib
                    }  = await loadFixture(
                        fixtureErc20Setup
                    );

                    await mockNft.mint(creator.address, 1);
                    await mockNft.mint(creator.address, 2);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await creatorNft.approve(depositRouter.address, 2);
                    await raffle.updateWinners(2);
                    await raffle.open(
                        [mockNft.address, mockNft.address],
                        [1, 2]
                    );

                    await mockErc20.transfer(
                        participant.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ethers.utils.parseEther("2.0")
                    );

                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("1.0")
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ethers.utils.parseEther("2.0")
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    );

                    // Verify raffle succesfully open
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);

                    // Call the cancel function
                    const txCancel = await (
                        await raffle.cancel({
                            value: ethers.utils.parseUnits("1", "gwei")
                        })
                    ).wait();

                    // Verify raffle succesfully canceled
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Canceled);

                    await matchEvent(
                        txCancel,
                        "RaffleCanceled",
                        eventsLib,
                        [
                            2,
                            RaffleType.Traditional,
                            CancelationReason.CreatorDecision
                        ],
                        raffle.address
                    );

                    // Verify the balance was transfered back to the participants.
                    expect(
                        await mockErc20.balanceOf(
                            participant.address
                        )
                    ).to.equal(
                        ethers.utils.parseEther("1")
                    );
                    expect(
                        await mockErc20.balanceOf(
                            extra.address
                        )
                    ).to.equal(
                        ethers.utils.parseEther("2")
                    );

                    // Verify the NFT was transfered back to the creator.
                    expect(
                        await mockNft.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        2
                    );
                    expect(
                        await mockNft.balanceOf(
                            await raffle.prizesVaultAddress()
                        )
                    ).to.equal(
                        0
                    );
                    expect(
                        await mockNft.ownerOf(
                            1
                        )
                    ).to.equal(
                        creator.address
                    );
                    expect(
                        await mockNft.ownerOf(
                            2
                        )
                    ).to.equal(
                        creator.address
                    );
                });
            });
        });

        context("dApi Raffle", () => {
            context("One winner, token, and beneficiary", () => {
                it("open", async () => {
                    const { 
                        raffle, creator, vaultFactory,
                        mockNft, mockErc20,
                        depositRouter, winnerAirnode
                    }  = await loadFixture(
                        fixtureDApiSetup
                    );

                    // On production we assume the raffle creator already owns an NFT.
                    // For testing purposes we will mint the NFT in here.
                    await mockNft.mint(
                        creator.address,
                        1
                    );

                    // Verify correct balances for the creator address NFTs.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(creator.address);
                    expect(await mockNft.getApproved(1))
                        .to.equal(ethers.constants.AddressZero);

                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);

                    // Without the approval, the raffle contract will not be able to
                    // transfer the NFT to the vault.
                    expect(await mockNft.getApproved(1))
                        .to.equal(depositRouter.address);

                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    // Verify the new raffle storage variables.
                    const prizesVaultAddress = await vaultFactory.instanceAtIndex(0);
                    const ticketsVaultAddress = await vaultFactory.instanceAtIndex(1);
                    expect (
                        await raffle.winnerRequester()
                    ).to.equal(
                        winnerAirnode.address
                    );
                    expect(await raffle.prizesVaultAddress())
                        .to.equal(prizesVaultAddress);
                    expect(await raffle.prizesVaultId())
                        .to.equal(getVaultId(prizesVaultAddress));
                    expect(await raffle.ticketsVaultAddress())
                        .to.equal(ticketsVaultAddress);
                    expect(await raffle.ticketsVaultId())
                        .to.equal(getVaultId(ticketsVaultAddress));
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Open);
                    expect(await raffle.tokens(0))
                        .to.equal(mockNft.address);
                    expect(await raffle.ids(0))
                        .to.equal(1);
                    
                    // Verify that the NFT was transfered to the Vault.
                    expect(await mockNft.balanceOf(creator.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(prizesVaultAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(prizesVaultAddress);

                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(0);
                });

                it("enter", async () => {
                    const {
                        raffle, creator, participant,
                        extra, mockNft, mockErc20,
                        depositRouter, rafflePrice,
                        dapiProxy
                    }  = await loadFixture(fixtureDApiSetup);

                    // Repeat steps from the `open` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );

                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();

                    // We fund the wallets with ERC20 tokens for testing purposes.
                    // On production we assume wallets already have the tokens.
                    const tokenProxyValue = dapiProxy.value as BigNumber;
                    const requiredAmountxTicket = mulDiv(
                        rafflePrice,
                        ethers.utils.parseEther("1"),
                        tokenProxyValue
                    );
    
                    await mockErc20.transfer(
                        participant.address,
                        requiredAmountxTicket
                    );

                    // Now we test the `enter` function.
                    let vaultBalance = await mockErc20.balanceOf(ticketsVaultAddress);

                    // Participant pays for itself.
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        requiredAmountxTicket
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    vaultBalance = vaultBalance.add(requiredAmountxTicket);

                    expect(await raffle.participants(0))
                        .to.equal(participant.address);
                    expect(await raffle.entries(participant.address))
                        .to.equal(1);
                    expect(await raffle.totalParticipants())
                        .to.equal(1);
                    expect(await raffle.totalEntries())
                        .to.equal(1);
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    
                    // Participant pays for extra.
                    const ticketsForExtra = requiredAmountxTicket.mul(2);
                    await mockErc20.transfer(
                        participant.address,
                        ticketsForExtra
                    );

                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        ticketsForExtra
                    );
                    await raffle.connect(participant).enter(
                        extra.address,
                        2
                    );
                    vaultBalance = vaultBalance.add(ticketsForExtra);

                    expect(await raffle.participants(1))
                        .to.equal(extra.address);
                    expect(await raffle.entries(extra.address))
                        .to.equal(2);
                    expect(await raffle.totalParticipants())
                        .to.equal(2);
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                });

                it("close", async () => {
                    const {
                        raffle, creator,
                        mockNft, mockErc20,
                        depositRouter, eventsLib,
                        dapiProxy, rafflePrice,
                        participant, extra, opt
                    }  = await loadFixture(fixtureDApiSetup)
                    // Repeat steps from the `enter` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    const tokenProxyValue = dapiProxy.value as BigNumber;
                    const requiredAmountxTicket = mulDiv(
                        rafflePrice,
                        ethers.utils.parseEther("1"),
                        tokenProxyValue
                    );
                    const ticketsForExtra = requiredAmountxTicket.mul(2);
                    await mockErc20.transfer(
                        participant.address,
                        requiredAmountxTicket
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ticketsForExtra
                    );
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        requiredAmountxTicket
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ticketsForExtra
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    )
                    // We add the beneficiaries to the raffle.
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    )
                    // This is the time we set for the raffle to end.
                    await time.increase(360)
                    // Now we test the `close` function.
                    const txClose = await (await raffle.close()).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[]
                    // Verify the new raffle storage variables.
                    expect(await raffle.requestId())
                        .to.equal(requestId[0]);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Close);
                });

                it("finish", async () => {
                    const {
                        raffle, creator,
                        mockNft, mockErc20,
                        depositRouter, eventsLib,
                        participant, extra, opt,
                        winnerAirnode, mockRrpV0,
                        fairHub, dapiProxy, rafflePrice
                    }  = await loadFixture(fixtureDApiSetup)
                    // Repeat steps from the `close` test, so we can continue the workflow.
                    await mockNft.mint(creator.address, 1);
                    const creatorNft = mockNft.connect(creator);
                    await creatorNft.approve(depositRouter.address, 1);
                    await raffle.open(
                        [mockNft.address],
                        [1]
                    );
                    const tokenProxyValue = dapiProxy.value as BigNumber;
                    const requiredAmountxTicket = mulDiv(
                        rafflePrice,
                        ethers.utils.parseEther("1"),
                        tokenProxyValue
                    );
                    const ticketsForExtra = requiredAmountxTicket.mul(2);
                    await mockErc20.transfer(
                        participant.address,
                        requiredAmountxTicket
                    );
                    await mockErc20.transfer(
                        extra.address,
                        ticketsForExtra
                    );
                    const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                    let vaultBalance = await mockErc20.balanceOf(
                        ticketsVaultAddress
                    );
                    await mockErc20.connect(participant).approve(
                        depositRouter.address,
                        requiredAmountxTicket
                    );
                    await raffle.connect(participant).enter(
                        participant.address,
                        1
                    );
                    vaultBalance = vaultBalance.add(
                        requiredAmountxTicket
                    );
                    await mockErc20.connect(extra).approve(
                        depositRouter.address,
                        ticketsForExtra
                    );
                    await raffle.connect(extra).enter(
                        extra.address,
                        2
                    );
                    vaultBalance = vaultBalance.add(
                        ticketsForExtra    
                    );
                    await raffle.setBeneficiaries(
                        [opt.address],
                        [10]
                    );
                    await time.increase(360);
                    const txClose = await (
                        await raffle.close()
                    ).wait();
                    const requestId = getEmittedArgument(
                        txClose,
                        eventsLib,
                        "NewWinnerRequest",
                        0
                    ) as string[]
                    // We emulate the airnode protocol process and response.
                    const expectedData = ethers.utils.randomBytes(32);
                    const currentAirnode = await winnerAirnode.airnode();
                    await (
                        await mockRrpV0.fulfill(
                            requestId[0],
                            currentAirnode,
                            winnerAirnode.address,
                            getBytesSelector(
                                "getIndividualWinner(bytes32,bytes)"
                            ),
                            expectedData,
                            []
                        )
                    ).wait()
                    // Prior to closing we verify that the participants don't have the token.
                    expect(await mockNft.balanceOf(participant.address))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(extra.address))
                        .to.equal(0);
                    // And also the balances from the vaults.
                    expect(await mockErc20.balanceOf(ticketsVaultAddress))
                        .to.equal(vaultBalance);
                    const beneficiaryBalance = await mockErc20.balanceOf(
                        opt.address
                    )
                    // Now we test the `finish` function.
                    const txFinish = await (
                        await raffle.finish()
                    ).wait();
                    const eventWinnerAddress = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        3
                    ) as Array<Array<String> | undefined>;
                    const eventWinnerIndex = getEmittedArgument(
                        txFinish,
                        eventsLib,
                        "RaffleFinished",
                        2
                    ) as Array<Array<String> | undefined>;
                    const winnerAddressArray = eventWinnerAddress.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const winnerIndexArray = eventWinnerIndex.filter(arg => {
                        if (arg !== undefined) {
                            return arg
                        }
                    })[0] as String[];
                    const treasuryAmount = vaultBalance.mul(
                        await fairHub.getRaffleCut()
                    ).div(100)
                    const availableAmount = vaultBalance.sub(
                        treasuryAmount
                    )
                    await matchEvent(
                        txFinish,
                        "RaffleFinished",
                        eventsLib,
                        [
                            2,
                            RaffleType.Traditional,
                            winnerIndexArray,
                            winnerAddressArray,
                            availableAmount,
                            treasuryAmount
                        ],
                        raffle.address
                    )
                    // Verify the new raffle storage variables.
                    const winnerAddress = (winnerAddressArray[0] as string);
                    expect(await raffle.winners(0))
                        .to.equal(winnerAddress);
                    expect(await raffle.status())
                        .to.equal(RaffleStatus.Finish)
                    // Verify that the NFT was transfered to the Vault,
                    // and that ticket pool was transfer to owner.
                    const vaultAddress = await raffle.prizesVaultAddress();
                    expect(await mockNft.balanceOf(vaultAddress))
                        .to.equal(0);
                    expect(await mockNft.balanceOf(winnerAddress))
                        .to.equal(1);
                    expect(await mockNft.ownerOf(1))
                        .to.equal(winnerAddress);
                    expect(
                        await mockErc20.balanceOf(
                            ticketsVaultAddress
                        )
                    ).to.equal(0);

                    expect(
                        await mockErc20.balanceOf(
                            creator.address
                        )
                    ).to.equal(
                        availableAmount.mul(90).div(100)
                    );
                    expect(
                        await mockErc20.balanceOf(
                            opt.address
                        )
                    ).to.equal(
                        beneficiaryBalance.add(
                            availableAmount.mul(10).div(100)
                        )
                    );
                });
            });
        });
    });
}

export async function shouldBehaveLikeYoloRaffle(
    fixtureYoloSetup: () => Promise<RaffleFixture>
) {
    context("Successful calls", () => {
        context("Native Raffle", () => {
            it("enter", async () => {
                const {
                    raffle, participant,
                    extra, rafflePrice
                }  = await loadFixture(fixtureYoloSetup);

                const ticketsVaultAddress = await raffle.ticketsVaultAddress();

                // Now we test the `enter` function.
                let vaultBalance = await ethers.provider.getBalance(ticketsVaultAddress);

                // User pays for itself
                await raffle.connect(
                    participant
                ).enter(
                    participant.address,
                    1,
                    {
                        value: rafflePrice
                    }
                );
                vaultBalance = vaultBalance.add(rafflePrice);

                expect(await raffle.participants(0))
                        .to.equal(participant.address);
                expect(await raffle.entries(participant.address))
                    .to.equal(1);
                expect(await raffle.totalParticipants())
                    .to.equal(1);
                expect(await raffle.totalEntries())
                    .to.equal(1);
                expect(await ethers.provider.getBalance(ticketsVaultAddress))
                    .to.equal(vaultBalance);
                
                // User pays for other wallet.
                await raffle.connect(
                    participant
                ).enter(
                    extra.address,
                    2,
                    {
                        value: rafflePrice.mul(2)
                    }
                );
                vaultBalance = vaultBalance.add(rafflePrice.mul(2));

                expect(await raffle.participants(1))
                    .to.equal(extra.address);
                expect(await raffle.entries(extra.address))
                    .to.equal(2);
                expect(await raffle.totalParticipants())
                    .to.equal(2);
                expect(await ethers.provider.getBalance(ticketsVaultAddress))
                    .to.equal(vaultBalance);
            });

            it("close", async () => {
                const {
                    raffle, participant,
                    extra, rafflePrice,
                    eventsLib
                }  = await loadFixture(fixtureYoloSetup);

                // Repeat steps from the `enter` test, so we can continue the workflow.
                await raffle.connect(
                    participant
                ).enter(
                    participant.address,
                    1,
                    {
                        value: rafflePrice
                    }
                );
                await raffle.connect(
                    participant
                ).enter(
                    extra.address,
                    2,
                    {
                        value: rafflePrice.mul(2)
                    }
                );
                // This is the time we set for the raffle to end.
                await time.increase(60 * 60);

                // Now we test the `close` function.
                const txClose = await (await raffle.close()).wait();
                const requestId = getEmittedArgument(
                    txClose,
                    eventsLib,
                    "NewWinnerRequest",
                    0
                ) as string[];

                // Verify the new raffle storage variables.
                expect(await raffle.requestId())
                    .to.equal(requestId[0]);
                expect(await raffle.status())
                    .to.equal(RaffleStatus.Close);
            });

            it("finish", async () => {
                const {
                    raffle, participant,
                    extra, treasury, rafflePrice,
                    eventsLib, winnerAirnode,
                    mockRrpV0, vaultFactory,
                    fairHub
                }  = await loadFixture(fixtureYoloSetup);
                // Repeat steps from the `close` test, so we can continue the workflow.
                const ticketsVaultAddress = await raffle.ticketsVaultAddress();
                let vaultBalance = await ethers.provider.getBalance(
                    ticketsVaultAddress
                );
                await raffle.connect(
                    participant
                ).enter(
                    participant.address,
                    1,
                    {
                        value: rafflePrice
                    }
                );
                vaultBalance = vaultBalance.add(rafflePrice);
                await raffle.connect(
                    participant
                ).enter(
                    extra.address,
                    2,
                    {
                        value: rafflePrice.mul(2)
                    }
                );
                vaultBalance = vaultBalance.add(rafflePrice.mul(2));
                await time.increase(60 * 60);
                const txClose = await (await raffle.close()).wait();
                const requestId = getEmittedArgument(
                    txClose,
                    eventsLib,
                    "NewWinnerRequest",
                    0
                ) as string[];

                // We emulate the airnode protocol process and response.
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

                // Prior to closing we verify that the participants don't have the token.
                const piggyVaultId = await raffle.ids(0);
                const piggyVaultAddress = await vaultFactory.instanceAt(piggyVaultId);
                const prizeVault = await raffle.prizesVaultAddress();
                expect ( 
                    await vaultFactory.ownerOf(
                        piggyVaultId
                    )
                ).to.equal(
                    prizeVault
                );
                expect (
                    await vaultFactory.balanceOf(
                        participant.address
                    )
                ).to.equal(
                    0
                );
                expect (
                    await vaultFactory.balanceOf(
                        extra.address
                    )
                ).to.equal(
                    0
                );
                // And also the balances from the vaults.
                expect(
                    await ethers.provider.getBalance(
                        ticketsVaultAddress
                    )
                ).to.equal(
                    vaultBalance
                );
                const treasuryBalance = await ethers.provider.getBalance(
                    treasury.address
                );

                // Now we test the `finish` function.
                const txFinish = await (
                    await raffle.finish()
                ).wait();
                const eventWinnerAddress = getEmittedArgument(
                    txFinish,
                    eventsLib,
                    "RaffleFinished",
                    3
                ) as Array<Array<String> | undefined>;
                const eventWinnerIndex = getEmittedArgument(
                    txFinish,
                    eventsLib,
                    "RaffleFinished",
                    2
                ) as Array<Array<String> | undefined>;

                const winnerAddressArray = eventWinnerAddress.filter(arg => {
                    if (arg !== undefined) {
                        return arg
                    }
                })[0] as String[];
                const winnerIndexArray = eventWinnerIndex.filter(arg => {
                    if (arg !== undefined) {
                        return arg
                    }
                })[0] as String[];
                const treasuryAmount = vaultBalance.mul(
                    await fairHub.getYoloRaffleCut()
                ).div(100)
                const availableAmount = vaultBalance.sub(
                    treasuryAmount
                );

                await matchEvent(
                    txFinish,
                    "RaffleFinished",
                    eventsLib,
                    [
                        1,
                        RaffleType.Yolo,
                        winnerIndexArray,
                        winnerAddressArray,
                        availableAmount,
                        treasuryAmount
                    ],
                    raffle.address
                );

                // Verify the new raffle storage variables.
                const winnerAddress = (winnerAddressArray[0] as string);
                expect(await raffle.winners(0))
                    .to.deep.equal(winnerAddress);
                expect(await raffle.status())
                    .to.equal(RaffleStatus.Finish);
                
                // Verify that the NFT was transfered to the Vault,
                // and that ticket pool was transfer to owner.
                const vaultAddress = await raffle.prizesVaultAddress();
                expect(
                    await vaultFactory.balanceOf(
                        vaultAddress
                    )
                ).to.equal(0);
                expect(
                    await vaultFactory.balanceOf(
                        winnerAddress
                    )
                ).to.equal(
                    1
                );
                expect(
                    await vaultFactory.ownerOf(
                        piggyVaultId
                    )
                ).to.equal(
                    winnerAddress
                );
                expect(
                    await ethers.provider.getBalance(
                        ticketsVaultAddress
                    )
                ).to.equal(0);
                expect(
                    await ethers.provider.getBalance(
                        piggyVaultAddress
                    )
                ).to.equal(
                    availableAmount
                );
                expect(
                    await ethers.provider.getBalance(
                        treasury.address
                    )
                ).to.equal(
                    treasuryBalance.add(
                        treasuryAmount
                    )
                );

                // Finally verify if the winner can withdraw the assets
                // from the piggy vault.
                const winnerPiggyVault = await ethers.getContractAt(
                    "AssetVault",
                    piggyVaultAddress,
                    participant.address == winnerAddress ? participant : extra
                );
                const initialWinnerBalance = await ethers.provider.getBalance(
                    winnerAddress
                );
                expect(
                    await winnerPiggyVault.withdrawEnabled()
                ).to.equal(
                    false
                );
                await winnerPiggyVault.enableWithdraw();
                expect(
                    await winnerPiggyVault.withdrawEnabled()
                ).to.equal(
                    true
                );
                await expect (
                    winnerPiggyVault.withdrawNative(
                        winnerAddress,
                        availableAmount
                    )
                ).to.changeEtherBalances(
                    [winnerAddress, piggyVaultAddress],
                    [availableAmount, availableAmount.mul(-1)]
                );
            });
        });
    });
}
