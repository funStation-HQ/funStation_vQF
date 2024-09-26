// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title IVaultDepositRouter.
 * @author API3 Latam.
 *
 * @notice Interface for VaultDepositRouter.
 */
interface IVaultDepositRouter {
    // ================ Initialize ================
    /**
     * @notice Initializer for the logic contract trough the UUPS Proxy.
     *
     * @param _factoryAddress The address to use for the factory interface.
     */
    function initialize (
        address _factoryAddress
    ) external;

    // ========== Upgrade Functions ==========
    /**
     * @notice Updates the VaultFactory implementation address.
     *
     * @param newImplementation The address of the upgraded version of the contract.
     */
    function upgradeFactory (
        address newImplementation
    ) external;

    /**
     * @notice Returns the current implementation version for this contract.
     * @dev This version will be manually updated on each new contract version deployed.
     *
     * @return version The current version of the implementation.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    );

    // ========== Core Functions ==========
    /**
     * @notice Deposit ERC721 tokens to the vault.
     *
     * @param owner The address of the current owner of the token.
     * @param vault The vault to deposit to.
     * @param tokens The token to deposit.
     * @param ids The ID of the token to deposit, for each token.
     */
    function depositERC721 (
        address owner,
        uint256 vault,
        address[] calldata tokens,
        uint256[] calldata ids
    ) external;

    /**
     * @notice Transfer native tokens to the vault.
     * @dev The value is forwarded but as there's no explicit need
     * for the potential sponsor address to interact with any other contract
     * we don't include it in the function signature.
     *
     * @param sender The address to be registered as sender.
     * @param vault The vault to deposit to.
     * @param amount The expected amount of tokens to be deposit.
     */
    function depositNative (
        address sender,
        address vault,
        uint256 amount
    ) external payable;

    /**
     * @notice Deposit ERC20 tokens to the vault.
     * 
     * @param sender The address to be registered as sender.
     * @param sponsor The address to pay for the transaction.
     * @param vault The vault to deposit to.
     * @param token The token to deposit.
     * @param amount The expected amount of tokens to be deposit.
     */
    function depositERC20 (
        address sender,
        address sponsor,
        address vault,
        address token,
        uint256 amount
    ) external;
}