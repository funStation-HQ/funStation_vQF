// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { AirnodeLogic } from "../../base/AirnodeLogic.sol";
import { IPickerAirnode } from "../../../interfaces/IPickerAirnode.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
import { Events } from "../../../libraries/Events.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";

/**
 * @title PickerAirnode
 * @author QuantumFair
 * 
 * @notice This is the contract implementation to pick numbers for Picker dynamic
 * using the QRNG airnode. 
 */
contract PickerAirnode is
    AirnodeLogic,
    IPickerAirnode
{
    // ========== Storage ==========
    // Picker airnode metadata for each request.
    mapping(bytes32 => DataTypes.PickerResponse) public requestToResults;

    // ========== Constructor ==========
    constructor (
        address _airnodeRrpAddress
    ) AirnodeLogic (
        _airnodeRrpAddress
    ) {}

    // ========== Callback Functions ==========
    /**
     * @dev See { IPickerAirnode-getNumber }.
     */
    function getNumber (
        bytes32 requestId,
        bytes calldata data
    ) external virtual override onlyAirnodeRrp validRequest(
        requestId
    ) {
        // Decode airnode results
        uint256 qrngUint256 = abi.decode(data, (uint256));
        uint256[] memory qrngUint256Array = new uint256[](1);
        qrngUint256Array[0] = qrngUint256;
        // Get resulting number
        uint256 winnerNumber = qrngUint256 % requestToResults[requestId].numberCap;
        // Update picker metadata
        requestToResults[requestId].results[0] = winnerNumber;
        // Executes after fulfillment hook.
        _afterFulfillment(
            requestId
        );
        // Emit the event.
        emit Events.PickerResponse(
            requestId,
            qrngUint256Array
        );
    }

    /**
     * @dev See { IPickerAirnode-getMultipleNumbers }
     */
    function getMultipleNumbers (
        bytes32 requestId,
        bytes calldata data
    ) external virtual override onlyAirnodeRrp validRequest(
        requestId
    ) {
        DataTypes.PickerResponse memory pickerData = requestToResults[requestId];
        // Decode airnode results
        uint256[] memory qrngUint256Array = abi.decode(data, (uint256[]));
        // Get resulting number
        for (uint256 i; i < pickerData.numberRequested; i++) {
            // Update raffle metadata.
            requestToResults[requestId].results[i] = qrngUint256Array[i] % pickerData.numberCap;
        }
        // Executes after fulfillment hook.
        _afterFulfillment(
            requestId
        );
        // Emit the event.
        emit Events.PickerResponse(
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
     * @dev See { IPickerAirnode-requestNumbers }
     */
    function requestNumbers (
        bytes4 callbackSelector,
        uint256 numberCap,
        uint256 numberRequested
    ) external override returns (
        bytes32
    ) {
        bytes32 requestId;

        // Validate parameters.
        if (
            numberCap == 0 ||
            numberRequested == 0
        ) {
            revert Errors.InvalidParameter();
        }
        
        // Make request to Airnode RRP.
        if (
            numberRequested == 1
        ) {
            requestId = callAirnode(
                callbackSelector,
                ""
            );
        } else {
            requestId = callAirnode(
                callbackSelector,
                abi.encodePacked(
                    bytes32("1u"),
                    bytes32("size"),
                    numberRequested
                )
            );
        }

        // Update request metadata.
        requestToResults[requestId] = DataTypes.PickerResponse({
            numberCap: numberCap,
            numberRequested: numberRequested,
            results: new uint256[](numberRequested),
            delivered: false
        });

        // Emit the event.
        emit Events.NewPickerRequest(
            requestId,
            airnode
        );

        return requestId;
    }

    /**
     * @dev See { IPickerAirnode-requestResults }.
     */
    function requestResults (
        bytes32 requestId
    ) external requestFulfilled(
        requestId
    ) returns (
        DataTypes.PickerResponse memory
    ) {
        DataTypes.PickerResponse memory result = requestToResults[requestId];

        // Validate parameters.
        if (
            result.delivered
        ) {
            revert Errors.ResultRetrieved();
        }

        // Update metadata.
        requestToResults[requestId].delivered = true;

        return result;
    }
}