// Test expected behavior from the `pickerAirnode` contract core functions.

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";
import { getBytesSelector } from "../../../../scripts/utils"
import { matchEvent, 
    getEmittedArgument } from "../../../helpers/utils";
import { PickerAirnodeFixture } from "../../../helpers/types";

export async function shouldBehaveLikePickerAirnode(
    fixtureSetup: any
) {
    context("Successful calls", async () => {
        it("getNumber", async() => {
            // Load the fixture
            const {
                pickerAirnode, mockRrpV0,
                mock, eventsLib,
                errorsLib
            }: PickerAirnodeFixture = await loadFixture(
                fixtureSetup
            );
            // Initialize constants
            const getNumber = getBytesSelector(
                "getNumber(bytes32,bytes)"
            );
            const newPickerRequest = "NewPickerRequest";
            const numberCap = 20;
            // Request a number
            const txRequestNumber = await (
                await pickerAirnode.requestNumbers(
                    getNumber,
                    numberCap,
                    1
                )
            ).wait();
            // Retrieve the requestId
            const requestId = getEmittedArgument(
                txRequestNumber,
                eventsLib,
                newPickerRequest,
                0
            ) as string[];

            await matchEvent (
                txRequestNumber,
                newPickerRequest,
                eventsLib,
                [
                    requestId,
                    mock.address
                ],
                pickerAirnode.address
            );
            // Check the new state of the request
            const initialPickerResponse = await pickerAirnode.getPickerResponse(
                requestId[0]
            );
            expect (
                initialPickerResponse.numberCap
            ).to.equal(20);
            expect (
                initialPickerResponse.numberRequested
            ).to.equal(1);
            expect (
                initialPickerResponse.results
            ).to.deep.equal(
                [0]
            );
            expect (
                initialPickerResponse.delivered
            ).to.equal(false);
            // Emulate the fulfillment of the request
            const expectedData = ethers.utils.randomBytes(32);
            const currentAirnode = await pickerAirnode.airnode();

            await expect (
                mockRrpV0.fulfill(
                    requestId[0],
                    currentAirnode,
                    pickerAirnode.address,
                    getNumber,
                    expectedData,
                    []
                )
            ).to.emit(
                mockRrpV0,
                "FulfilledRequest"
            ).withArgs(
                currentAirnode,
                requestId[0],
                expectedData
            );
            // Check the final state of the request
            await (
                await pickerAirnode.requestResults(
                    requestId[0]
                )
            ).wait();

            const finalPickerResponse = await pickerAirnode.getPickerResponse(
                requestId[0]
            );
            
            const coder = ethers.utils.defaultAbiCoder;
            const expectedParsedData = coder.decode(
                ["uint256"],
                expectedData
            ) as BigNumber[];
            const expectedValue = expectedParsedData[0].mod(
                numberCap
            );

            expect (
                finalPickerResponse.delivered
            ).to.equal(true);
            expect (
                finalPickerResponse.results[0].toNumber()
            ).to.equal(
                expectedValue.toNumber()
            );
            // Check that the request cannot be fulfilled again
            await expect (
                pickerAirnode.requestResults(
                    requestId[0]
                )
            ).to.be.revertedWithCustomError(
                errorsLib, 
                "ResultRetrieved"
            );
        });

        it("getMultipleNumbers", async() => {
            // Load the fixture
            const {
                pickerAirnode, mockRrpV0,
                mock, eventsLib,
                errorsLib
            }: PickerAirnodeFixture = await loadFixture(fixtureSetup);
            // Initialize constants
            const getMultipleWinners = getBytesSelector(
                "getMultipleNumbers(bytes32,bytes)"
            );
            const newPickerRequest = "NewPickerRequest";
            const numberCap = 20;
            const numberRequested = 2;
            // Request the numbers
            const txRequestNumber = await (
                await pickerAirnode.requestNumbers(
                    getMultipleWinners,
                    numberCap,
                    numberRequested
                )
            ).wait();
            // Retrieve the requestId
            const requestId = getEmittedArgument(
                txRequestNumber,
                eventsLib,
                newPickerRequest,
                0
            ) as string[];

            await matchEvent (
                txRequestNumber,
                newPickerRequest,
                eventsLib,
                [
                    requestId,
                    mock.address
                ],
                pickerAirnode.address
            );
            // Check the new state of the request
            const initialPickerResponse = await pickerAirnode.getPickerResponse(
                requestId[0]
            );
            expect (
                initialPickerResponse.numberCap
            ).to.equal(numberCap);
            expect (
                initialPickerResponse.numberRequested
            ).to.equal(numberRequested);
            expect (
                initialPickerResponse.results
            ).to.deep.equal(
                [0, 0]
            );
            expect (
                initialPickerResponse.delivered
            ).to.equal(false);
            // Emulate the fulfillment of the request
            const coder = ethers.utils.defaultAbiCoder;
            const randomNumbers = new Array<BigNumber>;
            for (let i=0; i<2; i++) {
                randomNumbers.push(
                    BigNumber.from(
                        ethers.utils.hexlify(
                            ethers.utils.randomBytes(32)
                        )
                    )
                );
            }

            const expectedData = coder.encode(
                ["uint256[]"],
                [randomNumbers]
            );
            const currentAirnode = await pickerAirnode.airnode()

            await expect (
                mockRrpV0.fulfill(
                    requestId[0],
                    currentAirnode,
                    pickerAirnode.address,
                    getMultipleWinners,
                    ethers.utils.arrayify(expectedData),
                    []
                )
            ).to.emit(
                mockRrpV0,
                "FulfilledRequest"
            ).withArgs(
                currentAirnode,
                requestId[0],
                expectedData
            );

            // Check the final state of the request
            await (
                await pickerAirnode.requestResults(
                    requestId[0]
                )
            ).wait();

            const finalPickerResponse = await pickerAirnode.getPickerResponse(
                requestId[0]
            );
            
            const expectedParsedData = coder.decode(
                ["uint256[]"], expectedData
            ) as Array<Array<BigNumber>>;
            const expectedValues = expectedParsedData[0].map(num => {
                return num.mod(numberCap);
            });

            expect (
                finalPickerResponse.delivered
            ).to.equal(true);
            expect (
                finalPickerResponse.results[0].toNumber()
            ).to.equal(
                expectedValues[0].toNumber()
            );
            expect (
                finalPickerResponse.results[1].toNumber()
            ).to.equal(
                expectedValues[1].toNumber()
            );
            // Check that the request cannot be fulfilled again
            await expect (
                pickerAirnode.requestResults(
                    requestId[0]
                )
            ).to.be.revertedWithCustomError(
                errorsLib, 
                "ResultRetrieved"
            );
        });
    });

    context("Should fail picker request", async() => {
        it("Should revert for InvalidParams", async () => {
            const {
                pickerAirnode,
                errorsLib
            }: PickerAirnodeFixture = await loadFixture(fixtureSetup);
            const getMultipleNumbers = getBytesSelector(
                "getMultipleNumbers(bytes32,bytes)"
            );

            await expect(
                pickerAirnode.requestNumbers(
                    getMultipleNumbers,
                    1,
                    0
                )
            ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidParameter"
            );
            
            await expect (
                pickerAirnode.requestNumbers(
                    getMultipleNumbers,
                    0,
                    1
                )
            ).to.be.revertedWithCustomError(
                errorsLib,
                "InvalidParameter"
            );
        });
    });
}
