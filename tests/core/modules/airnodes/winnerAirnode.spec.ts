// Test specification for `WinnerAirnode` contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { winnerAirnodeSetup } from "../../../helpers/fixtures";
import { getBytesSelector } from "../../../../scripts/utils";
import { shouldBehaveLikeWinnerAirnode } from "./winnerAirnode.behavior";


describe("WinnerAirnode Tests", () => {
    describe("Parameters Tests", () => {
        context("Endpoints", () => {
            it("Should return correct endpoints", async() => {
                const {
                    winnerAirnode,
                    qrngData
                } = await loadFixture(
                    winnerAirnodeSetup
                );

                const firstEndpoint = await winnerAirnode.endpointsIds(0);
                expect(
                    firstEndpoint.endpointId
                ).to.equal(
                    qrngData["endpointIdUint256"]
                );
                expect(
                    firstEndpoint.functionSelector
                ).to.equal(
                    getBytesSelector(
                        "getIndividualWinner(bytes32,bytes)"
                    )
                );

                const secondEndpoint = await winnerAirnode.endpointsIds(1);
                expect(
                    secondEndpoint.endpointId
                ).to.equal(
                    qrngData["endpointIdUint256Array"]
                );
                expect(
                    secondEndpoint.functionSelector
                ).to.equal(
                    getBytesSelector(
                        "getMultipleWinners(bytes32,bytes)"
                    )
                );
            });

            it("Should revert on index out of bounds", async () => {
                const {
                    winnerAirnode
                } = await loadFixture(
                    winnerAirnodeSetup
                );

                await expect (
                    winnerAirnode.endpointsIds(2)
                ).to.be.reverted;
            });

            it("Should return correct index from mapping", async() => {
                const {
                    winnerAirnode
                } = await loadFixture(
                    winnerAirnodeSetup
                );

                expect (
                    await winnerAirnode.callbackToIndex(
                        getBytesSelector(
                            "getIndividualWinner(bytes32,bytes)"
                        )
                    )
                ).to.equal(0);
                
                expect (
                    await winnerAirnode.callbackToIndex(
                        getBytesSelector(
                            "getMultipleWinners(bytes32,bytes)"
                        )
                    )
                ).to.equal(1);
            });

            it("Should return empty index from mapping", async() => {
                const {
                    winnerAirnode
                } = await loadFixture(
                    winnerAirnodeSetup
                );

                expect (
                    await winnerAirnode.callbackToIndex(
                        getBytesSelector(
                            "notAFunction()"
                        )
                    )
                )
                    .to.equal(0);
            });
        });
    })

    describe("Behavior Tests", async() => {
        await shouldBehaveLikeWinnerAirnode(
                winnerAirnodeSetup
            );
        });
});