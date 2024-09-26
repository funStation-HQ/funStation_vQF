// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import { DataTypes } from "../libraries/DataTypes.sol";
import { PickerAirnode } from "../core/modules/airnodes/PickerAirnode.sol";

/**
 * @title MockPickerAirnode
 * @author API3 Latam
 *
 * @notice This is a test contract to expose methods for accessing storage variables
 * from the original contract `PickerAirnode`.
 */
contract MockPickerAirnode is PickerAirnode {
    // ========== Constructor ==========
    constructor (
        address _airnodeRrpAddress
    ) PickerAirnode (
        _airnodeRrpAddress
    ) {}

    // ========== Get/Set Functions ==========
    /**
     * @notice Get the current metadata from a request.
     * @dev This is just for testing purposes. For easily retriving
     * the values of the mapping.
     *
     * @param requestId_ The id from the desired request.
     *
     * @return pickerResponse The metadata in the defined data structure.
     */
    function getPickerResponse(
        bytes32 requestId_
    ) external view returns (
        DataTypes.PickerResponse memory pickerResponse
    ) {
        return requestToResults[requestId_];
    }
}
