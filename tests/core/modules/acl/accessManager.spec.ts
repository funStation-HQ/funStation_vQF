// Test specification for `AccessManager` contract,
// including the functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { aclSetup } from "../../../helpers/fixtures";
import { shouldBehaveLikeAccessManager } from "./accessManager.behavior";

describe("AccessManager Tests", () => {
    describe("Parameters Test", () => {
        it("Return default role values", async() => {
            const { accessManager } = await loadFixture(aclSetup);

            expect (
                await accessManager.ADMIN_ROLE()
            ).to.equal(
                ethers.BigNumber.from(0)
            );

            expect (
                await accessManager.PUBLIC_ROLE()
            ).to.equal(
                // Equivalent to uint64 which is 2**64-1
                ethers.BigNumber.from(
                    2
                ).pow(
                    64    
                ).sub(
                    1
                )
            );
        });
    });

    describe("Behavior Test", async () => {
        await shouldBehaveLikeAccessManager(
            aclSetup
        );
    });
});
