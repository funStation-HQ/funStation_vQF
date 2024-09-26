// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "../libraries/DataTypes.sol";

/**
 * @title IAssetVault
 * @author API3 Latam
 *
 * @notice This is the interface for the AssetVault contract,
 * which is utilized for safekeeping of assets during Hub
 * user flows, like 'Raffles'.
 *
 * This contract is based from the arcadexyz repository `v2-contracts`.
 * You can found it at this URL:
 * https://github.com/arcadexyz/v2-contracts/blob/main/contracts/interfaces/IAssetVault.sol
 */
interface IAssetVault {
    // ========== Initialize ==========
    /**
     * @notice Initializer for the logic contract trough the minimal clone proxy.
     * @dev In practice, always called by the VaultFactory contract.
     */
    function initialize ()
     external;

    // ========== Get/Set Functions ==========
    /**
     * @notice Default view function for public value `withdrawEnabled`.
     *
     * @return withdrawEnabled Either true or false depending on the state. 
     */
    function withdrawEnabled ()
     external view returns (
        bool withdrawEnabled
    );

    // ========== Helper Functions ==========
    /**
     * @notice Helper function to approve the balance for a given token.
     * @dev Only callable by the owner of the vault.
     *
     * @param token The token to approve.
     * @param spender The address to approve the balance for.
     * @param amount The amount to approve.
     */
    function callApprove (
        address token,
        address spender,
        uint256 amount
    ) external;

    // ========== Core Functions ==========
    /**
     * @notice Enables withdrawals on the vault.
     * @dev Any integration should be aware that a withdraw-enabled vault cannot
     * be transferred (will revert).
     */
    function enableWithdraw () 
     external;

    /**
     * @notice Withdraw entire balance of a given ERC721 token from the vault.
     * The vault must be in a "withdrawEnabled" state (non-transferrable).
     * The specified token must exist and be owned by this contract.
     *
     * @param token The token to withdraw.
     * @param tokenId The ID of the NFT to withdraw.
     * @param to The recipient of the withdrawn token.
     */
    function withdrawERC721 (
        address token,
        uint256 tokenId,
        address to
    ) external;

    /**
     * @notice Withdraw an amount of specified ERC20 tokens from the vault balance.
     *
     * @param token The token to withdraw.
     * @param to The recipient of the withdrawn funds.
     * @param amount The amount of ERC20 tokens to withdraw.
     */
    function withdrawERC20 (
        address token,
        address to,
        uint256 amount
    ) external;

    /**
     * @notice Withdraw an amount of native tokens from the vault balance.
     *
     * @param to The recipient of the withdrawn funds.
     * @param amount The amount of native tokens to withdraw.
     */
    function withdrawNative (
        address to,
        uint256 amount
    ) external;

    /**
     * @notice Withdraw entire balance of given currency from the vault.
     * @dev Percentages should always sum to 100%.
     *
     * @param _payableRecipients The recipients of the withdrawn funds in case native withdraw.
     * @param _recipients The recipients of the withdrawn funds in case of ERC20.
     * @param _percentages The percentages of the vault per each recipient.
     * @param _currency The currency to withdraw.
     * @param _tokenAddress The address of the token to withdraw.
     */
    function batchPercentageWithdraw (
        address payable[] memory _payableRecipients,
        address[] memory _recipients,
        uint256[] memory _percentages,
        DataTypes.TokenType _currency,
        address _tokenAddress
    ) external;

    /**
     * @notice Withdraw balance amount of given currency from the vault.
     * @dev Withdraw a given amount from the vault, and split it between the recipients.
     * The sum of the amounts should be equal to the total balance of the contract.
     *
     * @param _payableRecipients The recipients of the withdrawn funds in case native withdraw.
     * @param _recipients The recipients of the withdrawn funds in case of ERC20.
     * @param _amounts The amounts of the vault per each recipient.
     * @param _currency The currency to withdraw.
     * @param _tokenAddress The address of the token to withdraw.
     */
    function batchAmountWithdraw (
        address payable[] memory _payableRecipients,
        address[] memory _recipients,
        uint256[] memory _amounts,
        DataTypes.TokenType _currency,
        address _tokenAddress
    ) external;
}