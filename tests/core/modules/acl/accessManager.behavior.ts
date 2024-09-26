// Test expected behavior from the `AccessManager` contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { AccessManager } from "../../../../typechain";
import { matchEvent } from "../../../helpers/utils";
import { AccessControlSetupFixture } from "../../../helpers/types";
import { deriveSelector, 
    getRoleId } from "../../../../scripts";

export async function shouldBehaveLikeAccessManager (
    setupFunction: () => Promise<AccessControlSetupFixture>
) {
    context("Successful calls", () => {
        it("isTargetClosed", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin
            } = await loadFixture(setupFunction);

            // Check non registered target.
            expect (
                await accessManager.isTargetClosed(
                    mockContract.address
                )
            ).to.equal(
                false
            );

            // Register a target and closed it.
            await accessManager.connect(
                roleAdmin
            ).setTargetClosed(
                mockContract.address,
                true
            );

            // Check registered target.
            expect (
                await accessManager.isTargetClosed(
                    mockContract.address
                )
            ).to.equal(
                true
            );
        });

        it("getTargetFunctionRole", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin,
                testRoleId
            } = await loadFixture(setupFunction);

            const targetFunction = deriveSelector(
                mockContract.interface.getFunction(
                    "restrictedFunc"
                )
            );

            // Check non registered target.
            expect (
                await accessManager.getTargetFunctionRole(
                    mockContract.address,
                    targetFunction
                )
            ).to.equal(
                ethers.BigNumber.from(0)
            );

            // Register a target and closed it.
            await accessManager.connect(
                roleAdmin
            ).setTargetFunctionRole(
                mockContract.address,
                [
                    targetFunction
                ],
                testRoleId
            );

            // Check registered target.
            expect (
                await accessManager.getTargetFunctionRole(
                    mockContract.address,
                    targetFunction
                )
            ).to.equal(
                testRoleId
            );
        });

        it("getRoleAdmin", async () => {
            const {
                accessManager,
                roleAdmin,
                testRoleId
            } = await loadFixture(setupFunction);

            const testRoleAdmin = getRoleId(
                "TEST_ROLE_ADMIN"
            );
            
            // Check non registered role.
            expect (
                await accessManager.getRoleAdmin(
                    testRoleId
                )
            ).to.equal(
                ethers.BigNumber.from(0)
            );

            // Register a role admin.
            await accessManager.connect(
                roleAdmin
            ).setRoleAdmin(
                testRoleId,
                testRoleAdmin
            );

            // Check registered role.
            expect (
                await accessManager.getRoleAdmin(
                    testRoleId
                )
            ).to.equal(
                testRoleAdmin
            );
        });

        it("getRoleGrantedTime", async () => {
            const {
                accessManager,
                roleAdmin,
                user,
                testRoleId
            } = await loadFixture(setupFunction);

            // Check non registered role.
            expect (
                await accessManager.getRoleGrantedTime(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                ethers.BigNumber.from(0)
            );

            // Register a role admin.
            const txGrant = await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            );

            // Check registered role.
            expect (
                await accessManager.getRoleGrantedTime(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                (await ethers.provider.getBlock(
                    txGrant.blockHash || ""
                )).timestamp
            );
        });

        it("setTargetFunctionRole", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin,
                testRoleId
            } = await loadFixture(setupFunction);

            const targetFunction = deriveSelector(
                mockContract.interface.getFunction(
                    "restrictedFunc"
                )
            );

            // Check non registered target.
            expect (
                await accessManager.getTargetFunctionRole(
                    mockContract.address,
                    targetFunction
                )
            ).to.equal(
                ethers.BigNumber.from(0)
            );

            // Register a target and closed it.
            await accessManager.connect(
                roleAdmin
            ).setTargetFunctionRole(
                mockContract.address,
                [
                    targetFunction
                ],
                testRoleId
            );

            // Check registered target.
            expect (
                await accessManager.getTargetFunctionRole(
                    mockContract.address,
                    targetFunction
                )
            ).to.equal(
                testRoleId
            );
        });

        it("setTargetClosed", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin
            } = await loadFixture(setupFunction);

            // Check non registered target.
            expect (
                await accessManager.isTargetClosed(
                    mockContract.address
                )
            ).to.equal(
                false
            );

            // Register a target and closed it.
            await accessManager.connect(
                roleAdmin
            ).setTargetClosed(
                mockContract.address,
                true
            );

            // Check registered target.
            expect (
                await accessManager.isTargetClosed(
                    mockContract.address
                )
            ).to.equal(
                true
            );

            // Open the target.
            await accessManager.connect(
                roleAdmin
            ).setTargetClosed(
                mockContract.address,
                false
            );

            // Check registered target.
            expect (
                await accessManager.isTargetClosed(
                    mockContract.address
                )
            ).to.equal(
                false
            );
        });

        it("updateAuthority", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin,
                user
            } = await loadFixture(setupFunction);

            // Deploy new authority contract.
            const newAuthority = await upgrades.deployProxy(
                await ethers.getContractFactory("AccessManager"),
                [
                    roleAdmin.address
                ],
                {
                    initializer: "initialize",
                    unsafeAllow: ["constructor"],
                    kind: "uups"
                }
            ) as AccessManager;

            // Check current authority.
            expect (
                await mockContract.authority()
            ).to.equal(
                accessManager.address
            );

            // Update authority.
            await accessManager.connect(
                roleAdmin
            ).updateAuthority(
                mockContract.address,
                newAuthority.address
            );

            // Check updated authority.
            expect (
                await mockContract.authority()
            ).to.equal(
                newAuthority.address
            );
        });

        it("canCall", async () => {
            const {
                accessManager,
                mockContract,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Check non registered target.
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
                false
            );
            
            // Register new target.
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

            // Check registered target.
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

            // Now close the target.
            await accessManager.connect(
                roleAdmin
            ).setTargetClosed(
                mockContract.address,
                true
            );

            // Check after closing the target.
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
                false
            );
        });

        it("hasRole", async () => {
            const {
                accessManager,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Check non registered role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                false
            );

            // Grant role to user.
            await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            );

            // Check registered role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                true
            );
        });

        it("grantRole", async () => {
            const {
                accessManager,
                eventsLib,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Grant role to user.
            const txGrant = await (await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            )).wait()

            await matchEvent(
                txGrant,
                "RoleGranted",
                eventsLib,
                [
                    testRoleId,
                    user.address
                ]
            );
        });

        it("revokeRole", async () => {
            const {
                accessManager,
                eventsLib,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Grant role to user.
            await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            );

            // Check user has role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                true
            );

            // Revoke role from user.
            const txRevoke =await (await accessManager.connect(
                roleAdmin
            ).revokeRole(
                testRoleId,
                user.address
            )
            ).wait();
            await matchEvent(
                txRevoke,
                "RoleRevoked",
                eventsLib,
                [
                    testRoleId,
                    user.address
                ]
            );

            // Check user has no role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                false
            );
        });

        it("renounceRole", async () => {
            const {
                accessManager,
                eventsLib,
                roleAdmin,
                testRoleId,
                user
            } = await loadFixture(setupFunction);

            // Grant role to user.
            await accessManager.connect(
                roleAdmin
            ).grantRole(
                testRoleId,
                user.address
            );

            // Check user has role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                true
            );

            // Renounce role by user.
            const txRenounce =  await (await accessManager.connect(
                user
            ).renounceRole(
                testRoleId,
                user.address
            )).wait();
            await matchEvent(
                txRenounce,
                "RoleRevoked",
                eventsLib,
                [
                    testRoleId,
                    user.address
                ]
            );

            // Check user has no role.
            expect (
                await accessManager.hasRole(
                    testRoleId,
                    user.address
                )
            ).to.equal(
                false
            );
        });

        it("setRoleAdmin", async () => {
            const {
                accessManager,
                eventsLib,
                roleAdmin,
                testRoleId
            } = await loadFixture(setupFunction);

            const testRoleAdmin = getRoleId(
                "TEST_ROLE_ADMIN"
            );

            // Set role admin.
            const txAdminChange  = await (await accessManager.connect(
                roleAdmin
            ).setRoleAdmin(
                testRoleId,
                testRoleAdmin
            )).wait();
            await matchEvent(
                txAdminChange,
                "RoleAdminChanged",
                eventsLib,
                [
                    testRoleId,
                    await accessManager.ADMIN_ROLE(),
                    testRoleAdmin
                ]
            );

            // Check role admin.
            expect (
                await accessManager.getRoleAdmin(
                    testRoleId
                )
            ).to.equal(
                testRoleAdmin
            );
        });
    });
}
