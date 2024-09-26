// Test specification for an `AccessManaged` contract,
// including the functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { aclSetup } from "../../../helpers/fixtures";
import { shouldBehaveLikeAccessManaged } from "./accessManaged.behavior";

describe("AccessManaged Test", () => {
    describe("Parameters Test", () => {
        it("Return initialized authority", async () => {
            const { 
                accessManager,
                mockContract
            } = await loadFixture(aclSetup);

            expect (
                await mockContract.authority()
            ).to.equal(
                await accessManager.address
            );
        });
    });

    describe("Behavior Test", async () => {
        await shouldBehaveLikeAccessManaged(
            aclSetup
        );
    });
});