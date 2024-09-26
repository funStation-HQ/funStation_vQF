// Test expected behavior from an `AccessManaged` contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deriveSelector } from "../../../../scripts";
import { AccessControlSetupFixture } from "../../../helpers/types";

export async function shouldBehaveLikeAccessManaged (
    setupFunction: () => Promise<AccessControlSetupFixture>
) {
    context("Successful calls", () => {
        it("getAuthority", async () => {
            const {
                accessManager,
                mockContract
            } = await loadFixture(setupFunction);
            
            expect (
                await mockContract.getAuthority()
            ).to.equal(
                await accessManager.address
            );
        });

        it("restrictedFunc", async () => {
            const {
                mockContract,
                accessManager,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Register target.
            await accessManager.connect(
                roleAdmin
            ).setTargetFunctionRole(
                mockContract.address,
                [
                    deriveSelector(
                        mockContract.interface.getFunction(
                            "restrictedFunc"
                        )
                    )
                ],
                testRoleId
            );

            // Grant role to user.
            await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            );

            // Check can call.
            expect (
                await accessManager.canCall(
                    user.address,
                    mockContract.address,
                    deriveSelector(
                        mockContract.interface.getFunction(
                            "restrictedFunc"
                        )
                    )
                )
            ).to.equal(
                true
            );

            // Call restricted function.
            await expect (
                mockContract.connect(
                    user
                ).restrictedFunc()
            ).to.emit(
                mockContract,
                "RestrictedFuncCalled"
            );
        });
    });

    context("Failed calls", () => {
        context("setAuthority", () => {
            it("Caller not Authority", async () => {
                const {
                    errorsLib,
                    mockContract,
                    deployer
                } = await loadFixture(setupFunction);

                await expect (
                    mockContract.setAuthority(
                        await ethers.constants.AddressZero
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "AccessManagedUnauthorized"
                ).withArgs(
                    deployer.address
                )
            });

            it("New Authority is Zero Address", async () => {
                const {
                    accessManager,
                    mockContract,
                    roleAdmin,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    accessManager.connect(
                        roleAdmin
                    ).updateAuthority(
                        mockContract.address,
                        await ethers.constants.AddressZero
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "AccessManagedInvalidAuthority"
                ).withArgs(
                    ethers.constants.AddressZero
                );
            });
        });
    });
}