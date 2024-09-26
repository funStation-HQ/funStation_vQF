// Test specification for `PickerAirnode` contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { pickerAirnodeSetup } from "../../../helpers/fixtures";
import { getBytesSelector } from "../../../../scripts/utils";
import { shouldBehaveLikePickerAirnode } from "./pickerAirnode.behavior";


describe("PickerAirnode Tests", () => {
    describe("Parameters Tests", () => {
        context("Endpoints", () => {
            it("Should return correct endpoints", async() => {
                const {
                    pickerAirnode,
                    qrngData
                } = await loadFixture(
                    pickerAirnodeSetup
                );

                const firstEndpoint = await pickerAirnode.endpointsIds(0);
                expect(
                    firstEndpoint.endpointId
                ).to.equal(
                    qrngData["endpointIdUint256"]
                );
                expect(
                    firstEndpoint.functionSelector
                ).to.equal(
                    getBytesSelector(
                        "getNumber(bytes32,bytes)"
                    )
                );

                const secondEndpoint = await pickerAirnode.endpointsIds(1);
                expect(
                    secondEndpoint.endpointId
                ).to.equal(
                    qrngData["endpointIdUint256Array"]
                );
                expect(
                    secondEndpoint.functionSelector
                ).to.equal(
                    getBytesSelector(
                        "getMultipleNumbers(bytes32,bytes)"
                    )
                );
            });

            it("Should revert on index out of bounds", async () => {
                const {
                    pickerAirnode
                } = await loadFixture(
                    pickerAirnodeSetup
                );

                await expect (
                    pickerAirnode.endpointsIds(2)
                ).to.be.reverted;
            });

            it("Should return correct index from mapping", async() => {
                const {
                    pickerAirnode
                } = await loadFixture(
                    pickerAirnodeSetup
                );

                expect (
                    await pickerAirnode.callbackToIndex(
                        getBytesSelector(
                            "getNumber(bytes32,bytes)"
                        )
                    )
                ).to.equal(0);
                
                expect (
                    await pickerAirnode.callbackToIndex(
                        getBytesSelector(
                            "getMultipleNumbers(bytes32,bytes)"
                        )
                    )
                ).to.equal(1);
            });

            it("Should return empty index from mapping", async() => {
                const {
                    pickerAirnode
                } = await loadFixture(
                    pickerAirnodeSetup
                );

                expect (
                    await pickerAirnode.callbackToIndex(
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
        await shouldBehaveLikePickerAirnode(
                pickerAirnodeSetup
            );
        });
});