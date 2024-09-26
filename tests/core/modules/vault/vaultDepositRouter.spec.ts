// Test specification for `VaultDepositRouter` contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { depositRouterSetup } from "../../../helpers/fixtures";
import { DepositRouterFixture } from "../../../helpers/types";
import { shouldBehaveLikeDepositRouter } from "./vaultDepositRouter.behavior";

describe("VaultDepositRouter Tests", () => {
    describe("Parameters Tests", () => {
        it("Should return factory address", async () => {
            const { vaultDepositRouter,
                vaultFactory }: DepositRouterFixture = await loadFixture(depositRouterSetup);

            expect ( await vaultDepositRouter.factory() )
                .to.equal(vaultFactory.address);
        });
    });

    describe("Behavior Tests", async () => {
        await shouldBehaveLikeDepositRouter(depositRouterSetup);
    });
});
