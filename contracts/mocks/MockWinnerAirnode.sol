// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import { DataTypes } from "../libraries/DataTypes.sol";
import { WinnerAirnode } from "../core/modules/airnodes/WinnerAirnode.sol";

/**
 * @title MockWinnerAirnode
 * @author API3 Latam
 *
 * @notice This is a test contract to expose internal variables from
 * the original contract `WinnerAirnode`.
 */
contract MockWinnerAirnode is WinnerAirnode {
    // ========== Constructor ==========
    constructor (
        address _airnodeRrpAddress
    ) WinnerAirnode (
        _airnodeRrpAddress
    ) {}

    // ========== Get/Set Functions ==========
    /**
     * @notice Get the current metadata from a request.
     * @dev This is just for testing purposes. Is meant to be kept as `internal`
     * in the original implementation. 
     *
     * @param requestId_ The id from the desired request.
     *
     * @return winnerResponse The metadata in the defined data structure.
     */
    function getWinnerResponse(
        bytes32 requestId_
    ) external view returns (
        DataTypes.WinnerReponse memory winnerResponse
    ) {
        return requestToRaffle[requestId_];
    }
}
