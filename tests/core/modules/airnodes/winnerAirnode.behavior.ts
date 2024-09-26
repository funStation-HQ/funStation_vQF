// Test expected behavior from the `WinnerAirnode` contract core functions.

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";
import { getBytesSelector } from "../../../../scripts/utils"
import { matchEvent, 
    getEmittedArgument } from "../../../helpers/utils";
import { WinnerAirnodeFixture } from "../../../helpers/types";

export async function shouldBehaveLikeWinnerAirnode(
    fixtureSetup: any
) {
    context("Successful calls", async () => {
        it("getIndividualWinner", async() => {
            const { winnerAirnode, mockRrpV0,
                mock, eventsLib,
                errorsLib }: WinnerAirnodeFixture = await loadFixture(fixtureSetup);
            const getIndividualWinner = getBytesSelector(
                "getIndividualWinner(bytes32,bytes)");
            const newWinnerRequest = "NewWinnerRequest";

            const txRequestWinner = await (await winnerAirnode.requestWinners(
                getIndividualWinner,
                1,
                10
            )).wait();
            
            const requestId = getEmittedArgument(
                txRequestWinner,
                eventsLib,
                newWinnerRequest,
                0
            ) as string[];

            await matchEvent (
                txRequestWinner,
                newWinnerRequest,
                eventsLib,
                [requestId,
                mock.address],
                winnerAirnode.address
            );

            const initialWinnerResponse = await winnerAirnode.getWinnerResponse(
                requestId[0]
            );
            expect (initialWinnerResponse.totalEntries)
                .to.equal(10);
            expect (initialWinnerResponse.totalWinners)
                .to.equal(1);
            expect (initialWinnerResponse.winnerIndexes)
                .to.have.all.members([]);
            expect (initialWinnerResponse.isFinished)
                .to.equal(false);

            const expectedData = ethers.utils.randomBytes(32);
            const currentAirnode = await winnerAirnode.airnode();

            await expect ( mockRrpV0.fulfill(
                requestId[0],
                currentAirnode,
                winnerAirnode.address,
                getIndividualWinner,
                expectedData,
                []
            ))
                .to.emit(mockRrpV0, "FulfilledRequest")
                .withArgs(currentAirnode, requestId[0], expectedData);
            
            await winnerAirnode.requestResults(requestId[0]);

            const finalWinnerResponse = await winnerAirnode.getWinnerResponse(
                requestId[0]
            );
            
            const coder = ethers.utils.defaultAbiCoder;
            const expectedParsedData = coder.decode(
                ["uint256"], expectedData
            ) as BigNumber[];
            const expectedIndex = expectedParsedData[0].mod(
                finalWinnerResponse.totalEntries
            );

            expect (finalWinnerResponse.isFinished)
                .to.equal(true);
            expect (finalWinnerResponse.winnerIndexes[0].toNumber())
                .to.equal(expectedIndex.toNumber());

            await expect ( winnerAirnode.requestResults(requestId[0]) )
                .to.be.revertedWithCustomError(
                    errorsLib, 
                    "ResultRetrieved"
                );
        });

        it("getMultipleWinners", async() => {
            const { winnerAirnode, mockRrpV0,
                mock, eventsLib,
                errorsLib }: WinnerAirnodeFixture = await loadFixture(fixtureSetup);
            const getMultipleWinners = getBytesSelector(
                "getMultipleWinners(bytes32,bytes)");
            const newWinnerRequest = "NewWinnerRequest";

            const txRequestWinner = await (await winnerAirnode.requestWinners(
                getMultipleWinners,
                2,
                20
            )).wait();
            
            const requestId = getEmittedArgument(
                txRequestWinner,
                eventsLib,
                newWinnerRequest,
                0
            ) as string[];

            await matchEvent (
                txRequestWinner,
                newWinnerRequest,
                eventsLib,
                [requestId,
                mock.address],
                winnerAirnode.address
            );

            const initialWinnerResponse = await winnerAirnode.getWinnerResponse(
                requestId[0]
            );
            expect (initialWinnerResponse.totalEntries)
                .to.equal(20);
            expect (initialWinnerResponse.totalWinners)
                .to.equal(2);
            expect (initialWinnerResponse.winnerIndexes)
                .to.have.all.members([]);
            expect (initialWinnerResponse.isFinished)
                .to.equal(false);

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
            const currentAirnode = await winnerAirnode.airnode()

            await expect ( mockRrpV0.fulfill(
                requestId[0],
                currentAirnode,
                winnerAirnode.address,
                getMultipleWinners,
                ethers.utils.arrayify(expectedData),
                []
            ))
                .to.emit(mockRrpV0, "FulfilledRequest")
                .withArgs(currentAirnode, requestId[0], expectedData);
            
            await winnerAirnode.requestResults(requestId[0]);

            const finalWinnerResponse = await winnerAirnode.getWinnerResponse(
                requestId[0]
            );
            
            const expectedParsedData = coder.decode(
                ["uint256[]"], expectedData
            ) as Array<Array<BigNumber>>;
            const expectedIndexes = expectedParsedData[0].map(num => {
                return num.mod(finalWinnerResponse.totalEntries);
            });

            expect (finalWinnerResponse.isFinished)
                .to.equal(true);
            expect (finalWinnerResponse.winnerIndexes[0].toNumber())
                .to.equal(expectedIndexes[0].toNumber());
            expect (finalWinnerResponse.winnerIndexes[1].toNumber())
                .to.equal(expectedIndexes[1].toNumber());

            await expect ( winnerAirnode.requestResults(requestId[0]) )
                .to.be.revertedWithCustomError(
                    errorsLib, 
                    "ResultRetrieved"
                );
        });
    });

    context("Should fail winner request", async() => {
        it("Should revert for InvalidParams", async () => {
            const { winnerAirnode,
                errorsLib }: WinnerAirnodeFixture = await loadFixture(fixtureSetup);
            const getMultipleWinners = getBytesSelector(
                "getMultipleWinners(bytes32,bytes)");

            await expect( winnerAirnode.requestWinners(
                getMultipleWinners,
                1,
                0
            ) )
                .to.be.revertedWithCustomError(
                    errorsLib,
                    "InvalidParameter"
                );
            
            await expect (  winnerAirnode.requestWinners(
                getMultipleWinners,
                0,
                1
            ) )
                .to.be.revertedWithCustomError(
                    errorsLib,
                    "InvalidParameter"
                );
        });

        it("Should revert on InvalidWinnersNumber", async () => {
            const { winnerAirnode,
                errorsLib }: WinnerAirnodeFixture = await loadFixture(fixtureSetup);
            const getMultipleWinners = getBytesSelector(
                "getMultipleWinners(bytes32,bytes)");

            await expect( winnerAirnode.requestWinners(
                getMultipleWinners,
                10,
                5
            ) )
                .to.be.revertedWithCustomError(
                    errorsLib,
                    "InvalidWinnerNumber"
                );
        });
    });
}
