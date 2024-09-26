// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { AirnodeLogic } from "../../base/AirnodeLogic.sol";
import { IWinnerAirnode } from "../../../interfaces/IWinnerAirnode.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";

/**
 * @title WinnerAirnode
 * @author API3 Latam
 *
 * @notice This is the contract implementation to pick winners for raffles
 * using the QRNG airnode.
 */
contract WinnerAirnode is 
    AirnodeLogic,
    IWinnerAirnode
{
    // ========== Storage ==========
    // Raffle airnode metadata for each request.
    mapping(bytes32 => DataTypes.WinnerReponse) public requestToRaffle;

    // ========== Constructor ==========
    constructor (
        address _airnodeRrpAddress
    ) AirnodeLogic (
        _airnodeRrpAddress
    ) {}

    // ========== Callback Functions ==========
    /**
     * @dev See { IWinnerAirnode-getIndividualWinner }.
     */
    function getIndividualWinner (
        bytes32 requestId,
        bytes calldata data
    ) external virtual override onlyAirnodeRrp validRequest(
        requestId
    ) {
        // Decode airnode results
        uint256 qrngUint256 = abi.decode(data, (uint256));
        uint256[] memory qrngUint256Array = new uint256[](1);
        qrngUint256Array[0] = qrngUint256;
        // Get winner index
        uint256 winnerIndex = qrngUint256 % requestToRaffle[requestId].totalEntries;

        // Update raffle metadata
        requestToRaffle[requestId].winnerIndexes.push(winnerIndex);

        // Executes after fulfillment hook.
        _afterFulfillment(
            requestId
        );

        // Emit the event.
        emit Events.WinnerResponse(
            requestId,
            qrngUint256Array
        );
    }

    /**
     * @dev See { IWinnerAirnode-getMultipleWinners }.
     */
    function getMultipleWinners (
        bytes32 requestId,
        bytes calldata data
    ) external virtual override onlyAirnodeRrp validRequest(
        requestId
    ) {
        DataTypes.WinnerReponse memory raffleData = requestToRaffle[requestId];

        // Decode airnode results.
        uint256[] memory qrngUint256Array = abi.decode(data, (uint256[]));

        // Get winner indexes.
        for (uint256 i; i < raffleData.totalWinners; i++) {
            // Update raffle metadata.
            requestToRaffle[requestId].winnerIndexes.push(
                qrngUint256Array[i] % raffleData.totalEntries
            );
        }

        // Executes after fulfillment hook.
        _afterFulfillment(
            requestId
        );

        // Emit the event.
        emit Events.WinnerResponse(
            requestId,
            qrngUint256Array
        );
    }

    // ========== Core Functions ==========
    /**
     * @dev See { AirnodeLogic-callAirnode }.
     */
    function callAirnode (
        bytes4 _functionSelector,
        bytes memory _parameters
    ) internal override returns (
        bytes32
    ) {
        // Executes before fulfillment hook.
        DataTypes.Endpoint memory currentEndpoint = _beforeFullfilment(
            _functionSelector
        );

        // Make request to Airnode RRP.
        bytes32 _requestId = airnodeRrp.makeFullRequest(
            airnode,
            currentEndpoint.endpointId,
            sponsorAddress,
            derivedAddress,
            address(this),
            currentEndpoint.functionSelector,
            _parameters
        );

        // Update mappings.
        incomingFulfillments[_requestId] = true;

        return _requestId;
    }

    /**
     * @dev See { IWinnerAirnode-requestWinners }.
     */
    function requestWinners (
        bytes4 callbackSelector,
        uint256 winnerNumbers,
        uint256 participantNumbers
    ) external override returns (
        bytes32
    ) {
        bytes32 requestId;

        // Validate parameters.
        if (
            participantNumbers == 0 || winnerNumbers == 0
        ) revert Errors.InvalidParameter();
        if (
            winnerNumbers > participantNumbers
        ) revert Errors.InvalidWinnerNumber();

        // Make request to Airnode RRP.
        if (
            winnerNumbers == 1
        ) {
            requestId = callAirnode(
                callbackSelector,
                ""
            );
        } else {
            requestId = callAirnode(
                callbackSelector,
                abi.encode(
                    bytes32("1u"),
                    bytes32("size"),
                    winnerNumbers
                )
            );
        }

        // Update request metadata.
        requestToRaffle[requestId].totalEntries = participantNumbers;
        requestToRaffle[requestId].totalWinners = winnerNumbers;

        // Emit event.
        emit Events.NewWinnerRequest(
            requestId,
            airnode
        );

        return requestId;
    }

    /**
     * @dev See { IWinnerAirnode-requestResults }
     */
    function requestResults (
        bytes32 requestId
    ) external override requestFulfilled(
        requestId
    ) returns (
        DataTypes.WinnerReponse memory
    ) {
        DataTypes.WinnerReponse memory result = requestToRaffle[requestId];

        // Validate results.
        if (
            result.isFinished
        ) revert Errors.ResultRetrieved();

        // Update metadata.
        requestToRaffle[requestId].isFinished = true;
        
        return result;
    }
}
