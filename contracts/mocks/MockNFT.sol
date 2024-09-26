// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockNFT is ERC721 {
    // ========== Constructor ==========
    constructor (
        string memory _name,
        string memory _symbol
    ) ERC721 (
        _name,
        _symbol
    ) {}

    // ========== Core Functions ==========
    /**
     * @notice Function to access `_mint` functionality.
     *
     * @param to_ The destination address of the mint.
     * @param tokenId_ The tokenId to assign to this mint.
     */
    function mint (
        address to_,
        uint256 tokenId_
    ) external {
        _mint(to_, tokenId_);
    }

    /**
     * @notice Function to access `_burn` functionality.
     *
     * @param tokenId_ The target tokenId to burn.
     */
    function burn (
        uint256 tokenId_
    ) external {
        _burn(tokenId_);
    }
}
