// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "../libraries/DataTypes.sol";

/**
 * @title IPickerAirnode
 * @author QuantumFair
 * 
 * @notice This interface is for the Picker Airnode, which is utilized for
 * the picker dynamic.
 */
interface IPickerAirnode {
    // ========== Callback Functions ==========
    /**
     * @notice Callback function when requesting for one number only.
     * @dev We suggest to set this as endpointId index `1`.
     *
     * @param requestId - The id for this request.
     * @param data - The response from the API send by the airnode.
     */
    function getNumber (
        bytes32 requestId,
        bytes calldata data
    ) external;

    /**
     * @notice Callback function when requesting for multiple numbers.
     * @dev We suggest to set this as endpointId index `2`.
     * 
     * @param requestId The id for this request.
     * @param data The response from the API send by the airnode. 
     */
    function getMultipleNumbers (
        bytes32 requestId,
        bytes calldata data
    ) external;

    // ========== Core Functions ==========
    /**
     * @notice The function to call this airnode implementation.
     *
     * @param callbackSelector The target endpoint to use as callback.
     * @param numberCap The cap to use for the number results.
     * @param numberRequested The total amount of number to retrieve.
     */
    function requestNumbers (
        bytes4 callbackSelector,
        uint256 numberCap,
        uint256 numberRequested
    ) external returns (
        bytes32
    );

    /**
     * @notice Return the results from a given request.
     *
     * @param requestId The request to get results from.
     */
    function requestResults (
        bytes32 requestId
    ) external returns (
        DataTypes.PickerResponse memory
    );
}