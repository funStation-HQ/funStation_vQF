import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DistributorSetup } from "../helpers/types";
import { matchEvent } from "../helpers/utils";

export async function shouldBehaveLikeDistributor(
    fixtureSetup: any
) {
    context ("Successful calls", () => {
        it("Should distribute tokens", async () => {
            const {
                deployer, user, extra,
                distributor, mockErc20,
                eventsLib
            }: DistributorSetup = await loadFixture(
                fixtureSetup
            );

            // Check initial balances and allowance
            expect ( await mockErc20.balanceOf(
                deployer.address
            ) ).to.equal(
                ethers.utils.parseEther("100.0")
            );
            expect ( await mockErc20.balanceOf(
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );
            expect ( await mockErc20.balanceOf(
                user.address
            )   ).to.equal(
                ethers.utils.parseEther("0.0")
            );
            expect ( await mockErc20.balanceOf(
                extra.address
            )   ).to.equal(
                ethers.utils.parseEther("0.0")
            );

            expect ( await mockErc20.allowance(
                deployer.address,
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );

            // Approve the distributor to spend the mockErc20
            await mockErc20.approve(
                distributor.address,
                ethers.utils.parseEther("10.0")
            );
            
            // Execute the distribution of tokens.
            const receiptDistributeTokens = await (await distributor.distributeTokens(
                mockErc20.address,
                deployer.address,
                [
                    user.address,
                    extra.address
                ],
                [   ethers.utils.parseEther("5.0"),
                    ethers.utils.parseEther("5.0")
                ]
            )).wait();

            // Validate the events.
            await matchEvent(
                receiptDistributeTokens,
                "TokensDistributed",
                eventsLib,
                [
                    deployer.address,
                    mockErc20.address,
                    ethers.utils.parseEther("10.0")
                ]
            );

            // Check final balances and allowances
            expect ( await mockErc20.balanceOf(
                deployer.address
            ) ).to.equal(
                ethers.utils.parseEther("90.0")
            );
            expect ( await mockErc20.balanceOf(
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );
            expect ( await mockErc20.balanceOf(
                user.address
            )   ).to.equal(
                ethers.utils.parseEther("5.0")
            );
            expect ( await mockErc20.balanceOf(
                extra.address
            )   ).to.equal(
                ethers.utils.parseEther("5.0")
            );

            expect ( await mockErc20.allowance(
                deployer.address,
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );
        });

        it("Should distribute native", async () => {
            const {
                deployer, user, extra,
                distributor, eventsLib
            }: DistributorSetup = await loadFixture(
                fixtureSetup
            );
            const initialSupply = ethers.utils.parseEther("10000.0");
            const originalBalance = await ethers.provider.getBalance(
                deployer.address
            );

            // Check initial balances and allowance
            expect ( await ethers.provider.getBalance(
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );
            expect (
                await ethers.provider.getBalance(
                    user.address
                )
            ).to.equal(
                initialSupply
            );
            expect (
                await ethers.provider.getBalance(
                    extra.address
                )
            ).to.equal(
                initialSupply
            );

            // Execute the function.
            const receiptDistributeNative = await (
                await distributor.distributeNative(
                    deployer.address,
                    [
                        user.address,
                        extra.address
                    ],
                    [   ethers.utils.parseEther("5.0"),
                        ethers.utils.parseEther("5.0")
                    ], {
                        value: ethers.utils.parseEther("10.0")
                    }
                )
            ).wait();

            // Validate the events.
            await matchEvent(
                receiptDistributeNative,
                "NativeDistributed",
                eventsLib,
                [
                    deployer.address,
                    ethers.utils.parseEther("10.0")
                ]
            );

            // Check final balances and allowances
            expect ( await ethers.provider.getBalance(
                deployer.address
            ) ).to.equal(
                originalBalance.sub(
                    ethers.utils.parseEther("10.0").add(
                        receiptDistributeNative.gasUsed.mul(
                            receiptDistributeNative.effectiveGasPrice
                        )
                    )
                )
            );
            expect ( await ethers.provider.getBalance(
                distributor.address
            ) ).to.equal(
                ethers.utils.parseEther("0.0")
            );
            expect ( await ethers.provider.getBalance(
                user.address
            )   ).to.equal(
                initialSupply.add(ethers.utils.parseEther("5.0"))
            );
            expect ( await ethers.provider.getBalance(
                extra.address
            )   ).to.equal(
                initialSupply.add(ethers.utils.parseEther("5.0"))
            );
        });
    });

    context("Unsuccessful calls", () => {
        it("Should revert on InvalidLenght", async () => {
            const {
                deployer, user, extra,
                distributor, mockErc20,
                errorsLib
            }: DistributorSetup = await loadFixture(
                fixtureSetup
            );

            // Empty arrays
            await expect ( distributor.distributeTokens(
                mockErc20.address,
                deployer.address,
                [],
                []
            ) ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidArrayLength"
            );

            await expect ( distributor.distributeTokens(
                mockErc20.address,
                deployer.address,
                [user.address],
                []
            ) ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidArrayLength"
            );

            await expect ( distributor.distributeTokens(
                mockErc20.address,
                deployer.address,
                [],
                [ethers.utils.parseEther("5.0")]
            ) ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidArrayLength"
            );

            // Unmatched array lengths
            await expect ( distributor.distributeTokens(
                mockErc20.address,
                deployer.address,
                [
                    user.address,
                    extra.address
                ],
                [   ethers.utils.parseEther("5.0")
                ]
            ) ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidArrayLength"
            );
        });
    });
}