// Test specification for `AirnodeLogic` abstract contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deriveEndpointId } from "@api3/airnode-admin";
import { getBytesSelector } from "../../../scripts/utils";
import { matchEvent } from "../../helpers/utils";
import { airnodeLogicSetup } from "../../helpers/fixtures";
import { shouldBehaveLikeAirnodeLogic } from "./airnodeLogic.behavior";

describe("AirnodeLogic Tests", () => {
    describe("Behavior Tests", async () => {
        await shouldBehaveLikeAirnodeLogic(
                airnodeLogicSetup
            );
    });

    describe("Modifiers Tests", async () => {
        context("validRequest", async () => {
            context("Success cases", () => {
                it("validRequest", async () => {
                    const { airnodeLogic } = await loadFixture(airnodeLogicSetup);
                    const randomRequestId = ethers.utils.randomBytes(32);

                    await airnodeLogic.addRequestId(
                        randomRequestId
                    );

                    expect( await airnodeLogic.mockValidRequestModifier(
                        randomRequestId
                    ) )
                        .to.equal(true);
                });

                it("requestFulfilled", async () => {
                    const { airnodeLogic } = await loadFixture(airnodeLogicSetup);
                    const randomRequestId = ethers.utils.randomBytes(32);
                    
                    // Assuming that the protocol is called by the requester.
                    await airnodeLogic.addRequestId(
                        randomRequestId
                    );
                    // Then we fulfill the request.
                    await airnodeLogic.removeRequestId(
                        randomRequestId
                    );

                    // Now we test the modifier.
                    expect( await airnodeLogic.mockRequestFulfilledModifier(
                            randomRequestId
                        )
                    ).to.equal(true);
                });
            });
            context("Failure cases", () => {
                it("validRequest", async () => {
                    const { airnodeLogic,
                        errorsLib } = await loadFixture(airnodeLogicSetup);

                    await expect ( airnodeLogic.mockValidRequestModifier(
                        ethers.utils.randomBytes(32)
                    ) )
                        .to.be.revertedWithCustomError(
                            errorsLib, "RequestIdNotKnown"
                        );
                });

                it("requestFulfilled", async () => {
                    const { airnodeLogic,
                        errorsLib } = await loadFixture(airnodeLogicSetup);
                    const randomRequestId = ethers.utils.randomBytes(32);
                    
                    // Assuming that the protocol is called by the requester.
                    await airnodeLogic.addRequestId(
                        randomRequestId
                    );

                    // Now we test the modifier.
                    await expect ( airnodeLogic.mockRequestFulfilledModifier(
                            randomRequestId
                        )
                    ).to.be.revertedWithCustomError(
                            errorsLib,
                            "RequestNotFulfilled"
                        );
                });
            });
        });
    });

    describe("Hooks Tests", async () => {
        context("beforeFullfilment", async () => {
            it("Should fail on invalid endpoint", async () => {
                const { airnodeLogic,
                    errorsLib } = await loadFixture(airnodeLogicSetup);
                const wrongSelector = getBytesSelector("notAFunction()");

                await expect ( airnodeLogic.mockBeforeFullfilment(
                    wrongSelector
                ) )
                    .to.be.revertedWithCustomError(
                        errorsLib, "NoEndpointAdded"
                    );
            });

            it("Should succeed and emit event", async () => {
                const { airnodeLogic } = await loadFixture(airnodeLogicSetup);

                const testId = await deriveEndpointId("airnodeLogic", "testFunction");
                const testFunction = "testFunction(address,uint256)";
                const testSelector = getBytesSelector(testFunction);

                await airnodeLogic.addNewEndpoint(
                    testId,
                    testFunction
                );

                await expect (airnodeLogic.mockBeforeFullfilment(testSelector))
                    .to.emit(airnodeLogic, "ReturnEndpoint")
                    .withArgs(testId, testSelector);
            });
        });
    });
});