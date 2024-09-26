// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Third-party imports
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IDistributor.
 * @author API3 Latam.
 *
 * @notice Provides batch transfer of cypto.
 * This contract is inspired by 'Disperse' which can be found at:
 * `0xD152f549545093347A162Dce210e7293f1452150` on ethereum mainnet.
 * @dev Interface for the Distributor contract.
 */
interface IDistributor {
    // ========== Core Functions ==========
    /**
     * @notice Distributes native tokens to a list of addresses.
     *
     * @param _sender The sender of the transaction.
     * @param _addresses The list of addresses to distribute to.
     * @param _amounts The amount of tokens to distribute to each address.
     */
    function distributeNative (
        address payable _sender,
        address payable[] memory _addresses,
        uint256[] memory _amounts
    ) external payable;

    /**
     * @notice Distributes tokens to a list of addresses.
     *
     * @param _token The token to distribute.
     * @param _sender The sender of the transaction.
     * @param _addresses The list of addresses to distribute to.
     * @param _amounts The amount of tokens to distribute to each address.
     */
    function distributeTokens (
        IERC20 _token,
        address _sender,
        address[] memory _addresses,
        uint256[] memory _amounts
    ) external;

}