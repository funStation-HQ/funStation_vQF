// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import { OwnableNFT } from "../core/base/OwnableNFT.sol";

/**
 * @title MockOwnableNFT
 * @author API3 Latam.
 *
 * @notice Mock contract to test functionalities from OwnableNFT.
 * @dev We are exposing some funcitonalities as public that should be kept
 * as `internal` at the original implementation.
 */
contract MockOwnableNFT is OwnableNFT {
    // ========== Constructor ==========
    constructor () {}

    // ========== Helpers/Utilities Functions ==========
    /**
     * @notice Function to test whether modifier `onlyOwner`
     * works as expected.
     */
    function testOnlyOwner()
     external view onlyOwner returns (
        bool success
     ) {
        return true;
    }

    /**
     * @notice Function to test internal call to `_setNFT` function.
     *
     * @param ownershipToken_ The ERC721 address to use as ACL validator.
     */
    function testSetNft(
        address ownershipToken_
    ) external {
        _setNFT(ownershipToken_);
    }
}
