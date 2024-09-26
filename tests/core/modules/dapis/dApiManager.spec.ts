// Test specification for `DApiManager` contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { MockDApiProxy, MockERC20 } from "../../../../typechain";
import { dApiManagerSetup } from "../../../helpers/fixtures";
import { shouldBehaveLikeDApiManager } from "./dApiManager.behavior";

describe("DApiManager Tests", () => {
    describe("Parameters Test", () => {
        context("tokenToAddress", () => {
            it("Return existing proxy address", async () => {
                const { 
                    dapiManager,
                    dapiProxies
                } = await loadFixture(dApiManagerSetup);
    
                expect (
                    await dapiManager.tokenToAddress(
                        (dapiProxies.firstProxyHash['token'] as MockERC20).address
                    )
                ).to.equal(
                    (dapiProxies.firstProxyHash['proxy'] as MockDApiProxy).address
                );
            });

            it("Return default address", async () => {
                const { dapiManager } = await loadFixture(dApiManagerSetup);
    
                expect (
                    await dapiManager.tokenToAddress(
                        ethers.Wallet.createRandom().address
                    )
                ).to.equal(
                    ethers.constants.AddressZero
                );
            });
        });
    });

    describe("Behavior Test", async () => {
        await shouldBehaveLikeDApiManager(
            dApiManagerSetup
        );
    });
});
