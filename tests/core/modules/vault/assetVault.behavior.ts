// Test expected behavior from the `AssetVault` contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { VaultSetupFixture } from "../../../helpers/types";
import { matchEvent } from "../../../helpers/utils";
import { TokenType } from "../../../helpers/dataTypes";

export async function shouldBehaveLikeAssetVault (
    fixtureSetup: any,
    fundedFixture: any
) {
    context("Successful calls", () => {
        it("enableWithdraw", async () => {
            const { deployer, 
                assetVault, eventsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);

            expect ( await assetVault.withdrawEnabled() )
                .to.equal(false);

            const txEnable =  await (await assetVault.enableWithdraw()
                ).wait();
            await matchEvent(
                txEnable,
                "WithdrawEnabled",
                eventsLib,
                [deployer.address],
                assetVault.address
            );

            expect ( await assetVault.withdrawEnabled() )
                .to.equal(true);
        });

        context("withdrawERC721", () => {
            it("Single token, single target", async () => {
                const { deployer, assetVault, 
                    mockNft, user,
                    eventsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);

                await mockNft.mint(
                    assetVault.address,
                    1
                );

                expect ( await mockNft.balanceOf(assetVault.address) )
                    .to.equal(1);
                expect ( await mockNft.ownerOf(1) )
                    .to.equal(assetVault.address);
                expect ( await mockNft.balanceOf(user.address) )
                    .to.equal(0);

                await assetVault.enableWithdraw();

                const txWithdraw = await (await assetVault.withdrawERC721(
                    mockNft.address,
                    1,
                    user.address
                )).wait();

                await matchEvent(
                    txWithdraw,
                    "WithdrawERC721",
                    eventsLib,
                    [deployer.address,
                    user.address,
                    mockNft.address,
                    1],
                    assetVault.address
                );

                expect ( await mockNft.balanceOf(assetVault.address) )
                    .to.equal(0);
                expect ( await mockNft.ownerOf(1) )
                    .to.equal(user.address);
                expect ( await mockNft.balanceOf(user.address) )
                    .to.equal(1);
            });

            it("Multiple tokens, single target", async () => {
                const { deployer, assetVault, 
                    mockNft, user,
                    eventsLib }: VaultSetupFixture = await loadFixture(fundedFixture);
                
                const txFirstWithdraw = await (await assetVault.withdrawERC721(
                    mockNft.address,
                    100,
                    user.address
                )).wait();
                const txSecondWithdraw = await (await assetVault.withdrawERC721(
                    mockNft.address,
                    200,
                    user.address
                )).wait();

                await matchEvent(
                    txFirstWithdraw,
                    "WithdrawERC721",
                    eventsLib,
                    [deployer.address,
                    user.address,
                    mockNft.address,
                    100]
                );
                await matchEvent(
                    txSecondWithdraw,
                    "WithdrawERC721",
                    eventsLib,
                    [deployer.address,
                    user.address,
                    mockNft.address,
                    200]
                );
            });

            it("Multiple tokens, multiple targets", async () => {
                const { deployer, assetVault, 
                    mockNft, user,
                    extra, eventsLib }: VaultSetupFixture = await loadFixture(fundedFixture);

                const txFirstWithdraw = await (await assetVault.withdrawERC721(
                    mockNft.address,
                    100,
                    user.address
                )).wait();
                const txSecondWithdraw = await (await assetVault.withdrawERC721(
                    mockNft.address,
                    200,
                    extra.address
                )).wait();

                await matchEvent(
                    txFirstWithdraw,
                    "WithdrawERC721",
                    eventsLib,
                    [deployer.address,
                    user.address,
                    mockNft.address,
                    100]
                );
                await matchEvent(
                    txSecondWithdraw,
                    "WithdrawERC721",
                    eventsLib,
                    [deployer.address,
                    extra.address,
                    mockNft.address,
                    200]
                );
            });
        });

        context("withdrawERC20", () => {
            it("Single token, single target", async () => {
                const { deployer, assetVault, 
                    mockErc20, user,
                    eventsLib }: VaultSetupFixture = await loadFixture(fundedFixture);

                expect ( await mockErc20.balanceOf(assetVault.address) )
                    .to.equal(ethers.utils.parseEther("10.0"));
                expect ( await mockErc20.balanceOf(user.address) )
                    .to.equal(0);

                const txWithdraw = await (await assetVault.withdrawERC20(
                    mockErc20.address,
                    user.address,
                    ethers.utils.parseEther("10.0")
                )).wait();

                await matchEvent(
                    txWithdraw,
                    "WithdrawERC20",
                    eventsLib,
                    [
                        deployer.address,
                        mockErc20.address,
                        user.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    assetVault.address
                );

                expect ( await mockErc20.balanceOf(assetVault.address) )
                    .to.equal(
                        0
                    );
                expect ( await mockErc20.balanceOf(user.address) )
                    .to.equal(
                        ethers.utils.parseEther("10.0")
                    );
            });
        });

        context("withdrawNative", () => {
            it("Should withdraw one user", async () => {
                const {
                    deployer,
                    assetVault, 
                    user,
                    eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );
                const initialBalance = await ethers.provider.getBalance(user.address);
                
                // Validate balance before withdraw.
                expect ( await ethers.provider.getBalance(assetVault.address) )
                    .to.equal(ethers.utils.parseEther("10.0"));

                // Execute withdraw.
                const txWithdraw = await (await assetVault.withdrawNative(
                    user.address,
                    ethers.provider.getBalance(assetVault.address)
                )).wait();
                
                // Validate event.
                await matchEvent(
                    txWithdraw,
                    "WithdrawNative",
                    eventsLib,
                    [
                        deployer.address,
                        user.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    assetVault.address
                );

                // Validate balance after withdraw.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(
                    0
                );
                expect (
                    await ethers.provider.getBalance(
                        user.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("10.0")
                    )
                )
            });

            it("Should withdraw multiple users", async () => {
                const {
                    deployer,
                    assetVault, 
                    user,
                    extra,
                    eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );
                const initialBalance = await ethers.provider.getBalance(user.address);

                // Validate balance before withdraw.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("10.0")
                );
                expect (
                    await ethers.provider.getBalance(
                        extra.address
                    )
                ).to.equal(initialBalance);

                // Execute withdraw.
                const txFirstWithdraw = await (
                    await assetVault.withdrawNative(
                        user.address,
                        ethers.utils.parseEther("5.0")
                    )
                ).wait();
                const txSecondWithdraw = await (
                    await assetVault.withdrawNative(
                        extra.address,
                        ethers.utils.parseEther("5.0")
                    )
                ).wait();

                // Validate events.
                await matchEvent(
                    txFirstWithdraw,
                    "WithdrawNative",
                    eventsLib,
                    [
                        deployer.address,
                        user.address,
                        ethers.utils.parseEther("5.0")
                    ],
                    assetVault.address
                );
                await matchEvent(
                    txSecondWithdraw,
                    "WithdrawNative",
                    eventsLib,
                    [
                        deployer.address,
                        extra.address,
                        ethers.utils.parseEther("5.0")
                    ],
                    assetVault.address
                );

                // Validate balance after withdraw.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(0);
                expect (
                    await ethers.provider.getBalance(
                        user.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("5.0")
                    )
                );
                expect (
                    await ethers.provider.getBalance(
                        extra.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("5.0")
                    )
                );
            });
        });

        context("batchPercentageWithdraw", () => {
            it("Should allow withdrawing native tokens", async () => {
                const {
                    assetVault, distributor, user,
                    extra, eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );
                const initialBalance = await ethers.provider.getBalance(
                    user.address
                );

                // Validate balance before withdraw.
                expect (
                    await ethers.provider.getBalance(assetVault.address)
                ).to.equal(
                    ethers.utils.parseEther("10.0")
                );
                expect (
                    await ethers.provider.getBalance(extra.address)
                ).to.equal(initialBalance);

                // Execute withdraw.
                const txWithdraw = await (
                    await assetVault.batchPercentageWithdraw(
                        [user.address, extra.address],
                        [],
                        [60, 40],
                        TokenType.Native,
                        ethers.constants.AddressZero
                    )
                ).wait();

                // Validate events.
                await matchEvent(
                    txWithdraw,
                    "NativeDistributed",
                    eventsLib,
                    [
                        assetVault.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    distributor.address
                );

                // Validate balance after withdraw.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(0);
                expect (
                    await ethers.provider.getBalance(
                        user.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("6.0")
                    )
                );
                expect (
                    await ethers.provider.getBalance(
                        extra.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("4.0")
                    )
                );
            });

            it("Should allow withdrawing ERC20 tokens", async () => {
                const {
                    assetVault, distributor, mockErc20, user,
                    extra, eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );

                // Validate balance before withdraw.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("10.0")
                );
                expect (
                    await mockErc20.balanceOf(
                        user.address
                    )
                ).to.equal(
                    0
                );
                expect (
                    await mockErc20.balanceOf(
                        extra.address
                    )
                ).to.equal(
                    0
                );

                // Execute withdraw.
                const txWithdraw = await (
                    await assetVault.batchPercentageWithdraw(
                        [],
                        [user.address, extra.address],
                        [60, 40],
                        TokenType.ERC20,
                        mockErc20.address
                    )
                ).wait();

                // Validate events.
                await matchEvent(
                    txWithdraw,
                    "TokensDistributed",
                    eventsLib,
                    [
                        assetVault.address,
                        mockErc20.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    distributor.address
                );

                // Validate balance after withdraw.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(0);
                expect (
                    await mockErc20.balanceOf(
                        user.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("6.0")
                );
                expect (
                    await mockErc20.balanceOf(
                        extra.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("4.0")
                );
            });
        });

        context("batchAmountWithdraw", () => {
            it("Should allow withdrawing native tokens", async () => {
                const {
                    assetVault, distributor, user,
                    extra, eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );
                const initialBalance = await ethers.provider.getBalance(
                    user.address
                );

                // Validate balance before withdraw.
                expect (
                    await ethers.provider.getBalance(assetVault.address)
                ).to.equal(
                    ethers.utils.parseEther("10.0")
                );
                expect (
                    await ethers.provider.getBalance(extra.address)
                ).to.equal(initialBalance);

                // Execute withdraw.
                const txWithdraw = await (
                    await assetVault.batchAmountWithdraw(
                        [user.address, extra.address],
                        [],
                        [
                            ethers.utils.parseEther("6.0"),
                            ethers.utils.parseEther("4.0")
                        ],
                        TokenType.Native,
                        ethers.constants.AddressZero
                    )
                ).wait();

                // Validate events.
                await matchEvent(
                    txWithdraw,
                    "NativeDistributed",
                    eventsLib,
                    [
                        assetVault.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    distributor.address
                );

                // Validate balance after withdraw.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(0);
                expect (
                    await ethers.provider.getBalance(
                        user.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("6.0")
                    )
                );
                expect (
                    await ethers.provider.getBalance(
                        extra.address
                    )
                ).to.equal(
                    initialBalance.add(
                        ethers.utils.parseEther("4.0")
                    )
                );
            });

            it("Should allow withdrawing ERC20 tokens", async () => {
                const {
                    assetVault, distributor, mockErc20, user,
                    extra, eventsLib
                }: VaultSetupFixture = await loadFixture(
                    fundedFixture
                );

                // Validate balance before withdraw.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("10.0")
                );
                expect (
                    await mockErc20.balanceOf(
                        user.address
                    )
                ).to.equal(
                    0
                );
                expect (
                    await mockErc20.balanceOf(
                        extra.address
                    )
                ).to.equal(
                    0
                );

                // Execute withdraw.
                const txWithdraw = await (
                    await assetVault.batchAmountWithdraw(
                        [],
                        [user.address, extra.address],
                        [
                            ethers.utils.parseEther("6.0"),
                            ethers.utils.parseEther("4.0")
                        ],
                        TokenType.ERC20,
                        mockErc20.address
                    )
                ).wait();

                // Validate events.
                await matchEvent(
                    txWithdraw,
                    "TokensDistributed",
                    eventsLib,
                    [
                        assetVault.address,
                        mockErc20.address,
                        ethers.utils.parseEther("10.0")
                    ],
                    distributor.address
                );

                // Validate balance after withdraw.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(0);
                expect (
                    await mockErc20.balanceOf(
                        user.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("6.0")
                );
                expect (
                    await mockErc20.balanceOf(
                        extra.address
                    )
                ).to.equal(
                    ethers.utils.parseEther("4.0")
                );
            });
        });
    });

    context("Failing conditions", () => {
        context("enableWithdraw", () => {
            it("When not owner", async () => {
                const { assetVault,
                    user, errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);

                const userVault = assetVault.connect(user);

                await expect ( userVault.enableWithdraw() )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    );
            });

            it("When withdraw already enable", async () => {
                const { assetVault, 
                    errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);

                await assetVault.enableWithdraw();

                await expect ( assetVault.enableWithdraw() )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "VaultWithdrawsEnabled"
                    );
            });
        });

        context("withdrawERC721", () => {
            it("When not owner", async () => {
                const { assetVault,
                    user, mockNft,
                    extra, errorsLib }: VaultSetupFixture = await loadFixture(fundedFixture);
                
                const userVault = assetVault.connect(user);
                await expect ( userVault.withdrawERC721(
                    mockNft.address,
                    100,
                    extra.address
                ) )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    );
            });

            it("When withdraw disabled", async () => {
                const { assetVault, 
                    mockNft, user,
                    errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);
                    
                await expect ( assetVault.withdrawERC721(
                    mockNft.address,
                    100,
                    user.address
                ) )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "VaultWithdrawsDisabled"
                    );
            });

            // Pending add specific reverting error for the following two tests.
            it("When token address is wrong", async () => {
                const { assetVault, 
                    user, extra }: VaultSetupFixture = await loadFixture(fixtureSetup);
                
                await assetVault.enableWithdraw();

                await expect ( assetVault.withdrawERC721(
                    extra.address,
                    100,
                    user.address
                ) )
                    .to.be.reverted;
            });

            it("When tokenId is wrong", async () => {
                const { assetVault,
                    user, mockNft }: VaultSetupFixture = await loadFixture(fundedFixture);

                await expect ( assetVault.withdrawERC721(
                    mockNft.address,
                    150,
                    user.address
                ) )
                    .to.be.reverted;
            });
        });

        context("withdrawNative", () => {
            it("When not owner", async () => {
                const { assetVault,
                    user, errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);
                
                const userVault = assetVault.connect(user);

                await expect ( userVault.withdrawNative(
                    user.address,
                    ethers.provider.getBalance(assetVault.address)
                ) )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    );
            });

            it("When withdraw disabled", async () => {
                const { assetVault, 
                    user, errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);
                
                await expect ( assetVault.withdrawNative(
                    user.address,
                    ethers.provider.getBalance(assetVault.address)
                ) )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "VaultWithdrawsDisabled"
                    );
            });
        });

        // context("batchPercentageWithdrawNative", () => {
        //     it("When not owner", async () => {
        //         const { assetVault,
        //             user, errorsLib }: VaultSetupFixture = await loadFixture(fixtureSetup);
                
        //         const userVault = assetVault.connect(user);

        //         await expect ( userVault.batchPercentageWithdrawNative(
        //             [user.address, user.address],
        //             [50, 50]
        //         ) )
        //             .to.be.revertedWithCustomError(
        //                 errorsLib,
        //                 "CallerNotOwner"
        //             );
        //     });

        //     it("Invalid length", async () => {
        //         const {
        //             assetVault, user,
        //             extra, errorsLib
        //         }: VaultSetupFixture = await loadFixture(
        //             fixtureSetup
        //         );

        //         await assetVault.enableWithdraw();

        //         await expect (
        //             assetVault.batchPercentageWithdrawNative(
        //                 [user.address, extra.address],
        //                 [60]
        //             )
        //         ).to.be.revertedWithCustomError(
        //                 errorsLib,
        //                 "InvalidArrayLength"
        //         );
        //     });

        //     it("Insufficient balance", async () => {
        //         const {
        //             assetVault, user,
        //             extra, errorsLib
        //         }: VaultSetupFixture = await loadFixture(
        //             fixtureSetup
        //         );

        //         await assetVault.enableWithdraw();

        //         await expect (
        //             assetVault.batchPercentageWithdrawNative(
        //                 [user.address, extra.address],
        //                 [60, 50]
        //             )
        //         ).to.be.revertedWithCustomError(
        //                 errorsLib,
        //                 "InsufficientBalance"
        //         );
        //     });
        // });
    });
}