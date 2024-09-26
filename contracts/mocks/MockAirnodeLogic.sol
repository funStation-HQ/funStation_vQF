// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "../libraries/DataTypes.sol";
import { AirnodeLogic } from "../core/base/AirnodeLogic.sol";

/**
 * @title MockAirnodeLogic
 * @author API3 Latam
 *
 * @notice This mock contract intends to be used for testing the logic
 * behind the AirnodeLogic without taking into account the specifics of
 * an airnode being deploy.
 */
contract MockAirnodeLogic is AirnodeLogic {
    // ========== Events ==========
    /**
     * @notice Emitted when the `_beforeFullfilment` hook is called.
     * @dev This will be implemented on each requester.
     * Here we are just replicating 
     */
    event ReturnEndpoint (
        bytes32 endpointId_,
        bytes4 functionSelector_
    );

    // ========== Constructor ==========
    /**
     * @notice Constructor mimicking an actual requester.
     *
     * @param _airnodeRrpAddress The RRP contract for the contract network.
     */
    constructor (
        address _airnodeRrpAddress
    ) AirnodeLogic (
        _airnodeRrpAddress
    ) {}
    
    // ========== Mock Utilities Functions ==========
    /**
     * @notice Enables to manually add a requestId to the storage in the contract
     * without having to create an actual request.
     * @dev This is done each time the airnode protocol is called trough
     * the `callAirnode` implementation.
     * 
     * @param requestId_ The requestId to add.
     */
    function addRequestId (
        bytes32 requestId_
    ) external {
        incomingFulfillments[requestId_] = true;
    }

    /**
     * @notice Enables to manually remove a requestId from the storage in the contract
     * without having to fulfill an actual request.
     * @dev This is done each time a request is fulfilled by the callback
     * implementation.
     *
     * @param requestId_ The requestId to remove.
     */
    function removeRequestId (
        bytes32 requestId_
    ) external {
        incomingFulfillments[requestId_] = false;
    }

    /**
     * @notice Exposes an instance to test for the modifier `validRequest`.
     *
     * @param requestId_ A requestId_ to pass down to the modifier.
     *
     * @return success A boolean `true` value.
     */
    function mockValidRequestModifier(
        bytes32 requestId_
    ) external view validRequest(requestId_) returns (
        bool success
    ) {
        return true;
    }

    /**
     * @notice Exposes an instance to test for the modifier `requestFulfilled`.
     *
     * @param requestId_ A requestId_ to pass down to the modifier.
     *
     * @return success A boolean `true` value.
     */
    function mockRequestFulfilledModifier(
        bytes32 requestId_
    ) external view requestFulfilled(requestId_) returns (
        bool success
    ) {
        return true;
    }

    /**
     * @notice Enables access to call the `_beforeFullfilment` hook.
     *
     * @param selector_ The selector to filter the endpoint by.
     */
    function mockBeforeFullfilment (
        bytes4 selector_
    ) external {
        DataTypes.Endpoint memory hookResult = _beforeFullfilment(
            selector_
        );

        emit ReturnEndpoint(
            hookResult.endpointId,
            hookResult.functionSelector
        );
    }

    /**
     * @notice Enables access to call the `_afterFulfillment` hook.
     *
     * @param requestId_ The requestId to pass down to the hook.
     */
    function mockAfterFulfillment (
        bytes32 requestId_
    ) external {
        _afterFulfillment(
            requestId_
        );
    }

}
