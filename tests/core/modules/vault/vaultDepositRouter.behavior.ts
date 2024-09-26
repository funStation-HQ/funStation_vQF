// Test expected behavior from the `VaultDepositRouter` contract core functions.

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { DepositRouterFixture } from "../../../helpers/types";
import { getVaultId, matchEvent } from "../../../helpers/utils";

export async function shouldBehaveLikeDepositRouter (
    fixtureSetup: any
) {
    context("Successful calls" , () => {
        it("depositERC721", async () => {
            const { mockNft, user, assetVault,
                vaultDepositRouter }: DepositRouterFixture = await loadFixture(fixtureSetup);
            const vaultId = getVaultId(assetVault.address);
            const mockNftUser = mockNft.connect(user);

            await mockNft.mint(user.address, 1);
            await mockNftUser.approve(
                vaultDepositRouter.address,
                1);
            
            expect ( await mockNft.balanceOf(user.address) )
                .to.equal(1);
            expect ( await mockNft.ownerOf(1) )
                .to.equal(user.address);
            expect ( await mockNft.balanceOf(assetVault.address) )
                .to.equal(0);
            
            await expect ( vaultDepositRouter.depositERC721(
                user.address,
                vaultId,
                [mockNft.address],
                [1]
            ) )
                .to.emit(
                    mockNft,
                    "Transfer")
                .withArgs(
                    user.address,
                    assetVault.address,
                    1
                );
            
            expect ( await mockNft.balanceOf(user.address) )
                .to.equal(0);
            expect ( await mockNft.ownerOf(1) )
                .to.equal(assetVault.address);
            expect ( await mockNft.balanceOf(assetVault.address) )
                .to.equal(1);
        });

        context("depositNative", () => {
            it("Payer is the sender", async () => {
                const { 
                    user, assetVault,
                    vaultDepositRouter, eventsLib
                }: DepositRouterFixture = await loadFixture(
                    fixtureSetup
                );
                const oneEther = ethers.utils.parseEther("1.0");
                // Verify vault balance.
                expect ( await ethers.provider.getBalance(
                    assetVault.address
                ) ).to.equal(
                    0
                );
                // Execute deposit
                const txReceipt = await (
                    await vaultDepositRouter.connect(
                        user
                    ).depositNative(
                        user.address,
                        assetVault.address,
                        oneEther,
                        {
                            value: oneEther
                        }
                    )
                ).wait();
                // Check if event was emitted.
                await matchEvent(
                    txReceipt,
                    "DepositNative",
                    eventsLib,
                    [
                        user.address,
                        assetVault.address,
                        oneEther
                    ],
                    vaultDepositRouter.address
                );
                // Verify vault balance.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(
                    oneEther
                );
            });

            it("Payer is different from sender", async () => {
                const { 
                    user, extra, assetVault,
                    vaultDepositRouter, eventsLib
                }: DepositRouterFixture = await loadFixture(
                    fixtureSetup
                );
                const oneEther = ethers.utils.parseEther("1.0");
                // Verify vault balance.
                expect ( await ethers.provider.getBalance(
                    assetVault.address
                ) ).to.equal(
                    0
                );
                // Execute deposit
                const txReceipt = await (
                    await vaultDepositRouter.connect(
                        user
                    ).depositNative(
                        extra.address,
                        assetVault.address,
                        oneEther,
                        {
                            value: oneEther
                        }
                    )
                ).wait();
                // Check if event was emitted.
                await matchEvent(
                    txReceipt,
                    "DepositNative",
                    eventsLib,
                    [
                        extra.address,
                        assetVault.address,
                        oneEther
                    ],
                    vaultDepositRouter.address
                );
                // Verify vault balance.
                expect (
                    await ethers.provider.getBalance(
                        assetVault.address
                    )
                ).to.equal(
                    oneEther
                );
            });
        });

        context("depositERC20", () => {
            it("Sender pays for itself", async () => {
                const { 
                    user, assetVault,
                    vaultDepositRouter, mockErc20,
                    eventsLib
                }: DepositRouterFixture = await loadFixture(
                    fixtureSetup
                );
                const oneEther = ethers.utils.parseEther("1.0");
                // Verify vault balance.
                expect ( await mockErc20.balanceOf(
                    assetVault.address
                ) ).to.equal(
                    0
                );
                // Fund the user with ERC20 tokens
                mockErc20.transfer(
                    user.address,
                    oneEther
                );
                // Approve the funds to the deposit router
                await mockErc20.connect(
                    user
                ).approve(
                    vaultDepositRouter.address,
                    oneEther
                );
                // Execute deposit
                const txReceipt = await (
                    await vaultDepositRouter.connect(
                        user
                    ).depositERC20(
                        user.address,
                        user.address,
                        assetVault.address,
                        mockErc20.address,
                        oneEther
                    )
                ).wait();
                // Check if event was emitted.
                await matchEvent(
                    txReceipt,
                    "DepositERC20",
                    eventsLib,
                    [
                        user.address,
                        assetVault.address,
                        mockErc20.address,
                        oneEther
                    ],
                    vaultDepositRouter.address
                );
                // Verify vault balance.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(
                    oneEther
                );
            });

            it("Sender and payer are different", async () => {
                const { 
                    user, extra, assetVault,
                    vaultDepositRouter, mockErc20,
                    eventsLib
                }: DepositRouterFixture = await loadFixture(
                    fixtureSetup
                );
                const oneEther = ethers.utils.parseEther("1.0");
                // Verify vault balance.
                expect ( await mockErc20.balanceOf(
                    assetVault.address
                ) ).to.equal(
                    0
                );
                // Fund the user with ERC20 tokens
                mockErc20.transfer(
                    user.address,
                    oneEther
                );
                // Approve the funds to the deposit router
                await mockErc20.connect(
                    user
                ).approve(
                    vaultDepositRouter.address,
                    oneEther
                );
                // Execute deposit
                const txReceipt = await (
                    await vaultDepositRouter.connect(
                        user
                    ).depositERC20(
                        extra.address,
                        user.address,
                        assetVault.address,
                        mockErc20.address,
                        oneEther
                    )
                ).wait();
                // Check if event was emitted.
                await matchEvent(
                    txReceipt,
                    "DepositERC20",
                    eventsLib,
                    [
                        extra.address,
                        assetVault.address,
                        mockErc20.address,
                        oneEther
                    ],
                    vaultDepositRouter.address
                );
                // Verify vault balance.
                expect (
                    await mockErc20.balanceOf(
                        assetVault.address
                    )
                ).to.equal(
                    oneEther
                );
            });
        });
    });
}
