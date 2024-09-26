
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Third-party imports
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 *
 * @notice Mock contract simulating an ERC20 Token.
 */
contract MockERC20 is
    ERC20
{
    constructor()
        ERC20("TEST", "Test Mock")
    {
        _mint(msg.sender, 100000000000000000000);
    }
}
