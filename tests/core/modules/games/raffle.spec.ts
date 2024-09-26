// Test specification for `Raffle` contract,
// including the deployment, parametrization, functionalities and behavior.

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Raffle } from "../../../../typechain";
import { raffleSetup } from "../../../helpers/fixtures";
import { RaffleFixture } from "../../../helpers/types";
import { 
    RaffleStatus,
    TokenType,
    RaffleType
} from "../../../helpers/dataTypes";
import { matchEvent } from "../../../helpers/utils";
import { shouldBehaveLikeRaffle,
    shouldBehaveLikeYoloRaffle
} from "./raffle.behavior";


async function raffleErc20Setup(): Promise<RaffleFixture> {
    const data = await loadFixture(raffleSetup); 

    const currentTime = await time.latest() + 60;
    const ticketPrice = ethers.utils.parseEther("1.0");
    const creatorHub = data.fairHub.connect(data.creator);
    
    await (await creatorHub.createRaffle(
        currentTime,
        currentTime + 300,
        1,
        ticketPrice,
        ethers.utils.parseEther("2.0"),
        {
            hash: ethers.utils.randomBytes(32),
            hash_function: 18,
            size: 32
        },
        TokenType.ERC20,
        data.mockErc20.address
    )).wait();

    const raffleAddress = await creatorHub.getRaffleAddress(2);
    const raffleContract = await ethers.getContractAt(
        "Raffle",
        raffleAddress
    ) as Raffle;
    const raffle = raffleContract.connect(data.creator);

    // Delayed time when creating the raffle.
    // This increase will allow to inmediatly open the raffle.
    await time.increase(60);
    
    data['raffle'] = raffle;
    return data
}

async function raffleDApiSetup(): Promise<RaffleFixture> {
    const data = await loadFixture(raffleSetup); 

    const currentTime = await time.latest() + 60;
    const ticketPrice = ethers.utils.parseEther("5.0"); // This is in USD scale to WEI.
    const creatorHub = data.fairHub.connect(data.creator);
    
    await (await creatorHub.createRaffle(
        currentTime,
        currentTime + 300,
        1,
        ticketPrice,
        ethers.utils.parseEther("15.0"),  // Balance also in scaled USD.
        {
            hash: ethers.utils.randomBytes(32),
            hash_function: 18,
            size: 32
        },
        TokenType.dApi,
        data.mockErc20.address
    )).wait();

    const raffleAddress = await creatorHub.getRaffleAddress(2);
    const raffleContract = await ethers.getContractAt(
        "Raffle",
        raffleAddress
    ) as Raffle;
    const raffle = raffleContract.connect(data.creator);

    // Delayed time when creating the raffle.
    // This increase will allow to inmediatly open the raffle.
    await time.increase(60);
    
    data['raffle'] = raffle;
    data['rafflePrice'] = ticketPrice;
    return data;
}

async function yoloRaffleNativeSetup(): Promise<RaffleFixture> {
    const data = await loadFixture(raffleSetup);

    const ticketPrice = data['rafflePrice'];
    const fairHub = data.fairHub.connect(data.deployer);

    await (await fairHub.createYoloRaffle(
        ticketPrice,
        TokenType.Native,
        ethers.constants.AddressZero
    )).wait();

    const raffleAddress = await fairHub.getYoloRaffleAddress(1);
    const raffleContract = await ethers.getContractAt(
        "Raffle",
        raffleAddress
    ) as Raffle;
    const raffle = raffleContract.connect(data.deployer);

    data['raffle'] = raffle;
    return data;
}


describe("Raffle Tests", () => {
    describe("Parameters Test", () => {
        context("Raffle related", () => {
            it("Should return initial parameters", async () => {
                const { creator, raffle,
                    raffleStart, fairHub
                } = await loadFixture(raffleSetup);

                expect ( await raffle.raffleId() )
                    .to.equal(1);
                expect ( await raffle.creatorAddress() )
                    .to.equal(creator.address);
                expect ( await raffle.winnerNumber() )
                    .to.equal(1);
                expect ( await raffle.startTime() )
                    .to.equal(raffleStart);
                expect ( await raffle.expectedEndTime() )
                    .to.equal(raffleStart + 300);
                expect ( await raffle.ticketPrice() )
                    .to.equal(ethers.utils.parseEther("1.0"));
                expect ( await raffle.requiredBalance() )
                    .to.equal(ethers.utils.parseEther("2.0"));
                expect ( await raffle.status() )
                    .to.equal(RaffleStatus.Uninitialized);
                const metadata = await raffle.metadata();
                expect( metadata.hash_function )
                    .to.equal(18);
                expect ( metadata.size )
                    .to.equal(32);
                expect ( await raffle.fairHub() )
                    .to.equal(fairHub.address);
            });

            it("Should update winners", async () => {
                const { raffle } = await loadFixture(raffleSetup);

                expect ( await raffle.winnerNumber() )
                    .to.equal(1);
                await raffle.updateWinners(2);
                expect ( await raffle.winnerNumber() )
                    .to.equal(2);
            });

            it("Should fail updating winners", async () => {
                const { raffle,
                    errorsLib } = await loadFixture(raffleSetup);

                await expect ( raffle.updateWinners(0) )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "InvalidWinnerNumber"
                    );

                // Pending to add `RaffleAlreadyOpen` error case.
            });

            // Pending to add `updateMetadata` scenarios.
        });

        context("Beneficiaries related", () => {
            context("setBeneficiaries", () => {
                it("Success scenario", async () => {
                    const {
                        raffle, eventsLib,
                        participant, extra,
                    } = await loadFixture(
                        raffleSetup
                    );

                    // Set beneficiaries.
                    const txSetBeneficiaries = await (
                        await raffle.setBeneficiaries(
                            [participant.address, extra.address],
                            [5, 10]
                        )
                    ).wait();

                    // Check event.
                    await matchEvent(
                        txSetBeneficiaries,
                        "SetRaffleBeneficiaries",
                        eventsLib,
                        [
                            [participant.address, extra.address],
                            [5, 10],
                            await raffle.raffleId(),
                            RaffleType.Traditional
                        ],
                        raffle.address
                    );

                    // Validate raffle storage.
                    expect ( await raffle.beneficiaries(0) )
                        .to.equal(participant.address);
                    expect ( await raffle.beneficiaries(1) )
                        .to.equal(extra.address);
                });

                context("Failure scenarios", () => {
                    it("ZeroAddress", async () => {
                        const {
                            raffle, errorsLib
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.setBeneficiaries(
                                [ethers.constants.AddressZero],
                                [5]
                            )
                        ).to.be.revertedWithCustomError(
                                errorsLib,
                                "ZeroAddress"
                            );
                    });

                    it("BatLengthMismatch", async () => {
                        const {
                            raffle, errorsLib,
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.setBeneficiaries(
                                [ethers.Wallet.createRandom().address],
                                [5, 10]
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "BatchLengthMismatch"
                        );
                    });

                    it("InvalidParameter share already set", async () => {
                        const {
                            raffle, errorsLib,
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.setBeneficiaries(
                                [ethers.Wallet.createRandom().address],
                                [0]
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "InvalidParameter"
                        );
                    });

                    it("ParameterAlreadySet", async () => {
                        const { 
                            raffle, errorsLib, participant
                        } = await loadFixture(
                            raffleSetup
                        );

                        await raffle.setBeneficiaries(
                            [participant.address],
                            [1]
                        );

                        await expect (
                            raffle.setBeneficiaries(
                                [participant.address],
                                [1]
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "ParameterAlreadySet"
                        );
                    });

                    it("InvalidParameter totalShare over 100", async () => {
                        const {
                            raffle, errorsLib,
                            participant, extra
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.setBeneficiaries(
                                [participant.address, extra.address],
                                [50, 60]
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "InvalidParameter"
                        );
                    });
                });
            });

            context("updateBeneficiary", () => {
                it("Success scenario", async () => {
                    const {
                        raffle, eventsLib,
                        participant, extra,
                    } = await loadFixture(
                        raffleSetup
                    );

                    // Set beneficiaries.
                    await raffle.setBeneficiaries(
                        [participant.address, extra.address],
                        [5, 10]
                    );

                    // Update beneficiary.
                    const txUpdateBeneficiary = await (
                        await raffle.updateBeneficiary(
                            participant.address,
                            10
                        )
                    ).wait();

                    // Check event.
                    await matchEvent(
                        txUpdateBeneficiary,
                        "UpdateRaffleBeneficiary",
                        eventsLib,
                        [
                            participant.address,
                            5,
                            10,
                            await raffle.raffleId(),
                            RaffleType.Traditional
                        ],
                        raffle.address
                    );

                    // Validate raffle storage.
                    expect ( await raffle.beneficiaries(0) )
                        .to.equal(participant.address);
                });

                context("Failure scenarios", () => {
                    it("ZeroAddress", async () => {
                        const {
                            raffle, errorsLib
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.updateBeneficiary(
                                ethers.constants.AddressZero,
                                5
                            )
                        ).to.be.revertedWithCustomError(
                                errorsLib,
                                "ZeroAddress"
                            );
                    });

                    it("InvalidParameter share is zero", async () => {
                        const {
                            raffle, errorsLib,
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.updateBeneficiary(
                                ethers.Wallet.createRandom().address,
                                0
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "InvalidParameter"
                        );
                    });

                    it("ParameterNotSet", async () => {
                        const {
                            raffle, errorsLib, participant
                        } = await loadFixture(
                            raffleSetup
                        );

                        await expect (
                            raffle.updateBeneficiary(
                                participant.address,
                                10
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "ParameterNotSet"
                        );
                    });

                    it("InvalidParameter share over 100", async () => {
                        const {
                            raffle, errorsLib,
                            participant, extra
                        } = await loadFixture(
                            raffleSetup
                        );

                        await raffle.setBeneficiaries(
                            [participant.address, extra.address],
                            [60, 40]
                        );

                        await expect (
                            raffle.updateBeneficiary(
                                participant.address,
                                65
                            )
                        ).to.be.revertedWithCustomError(
                            errorsLib,
                            "InvalidParameter"
                        );
                    });
                });
            });
        });
    });

    describe("Behavior Tests", () => {
        describe("Traditional Raffle", async () => {
            await shouldBehaveLikeRaffle(
                raffleSetup,
                raffleErc20Setup,
                raffleDApiSetup
            );
        });
        describe("Yolo Raffle", async () => {
            await shouldBehaveLikeYoloRaffle(
                yoloRaffleNativeSetup
            );
        });
    });
});
