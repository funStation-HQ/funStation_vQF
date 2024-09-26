// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { IAssetVault } from "../../../interfaces/IAssetVault.sol";
import { IVaultFactory } from "../../../interfaces/IVaultFactory.sol";
import { IDistributor } from "../../../interfaces/IDistributor.sol";
import { OwnableNFT } from "../../base/OwnableNFT.sol";  
import { Errors } from "../../../libraries/Errors.sol";
import { Events } from "../../../libraries/Events.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
// Third party imports
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";

/**
 * @title AssetVault
 * @author API3 Latam.
 *
 * The Asset Vault is a vault for the storage of assets.
 * Designed for one-time use, like a piggy bank. Once withdrawals are enabled,
 * and the safe is broken, the vault can no longer be used.
 *
 * It starts in a deposit-only state. Assets cannot be withdrawn at this point. When
 * the owner is allow and actually calls `enableWithdraw()`, 
 * the state is set to a 'withdrawEnabled' state.
 * Withdraws cannot be disabled once enabled. This restriction protects the interactions
 * of the assets kept in the vault from unexpected withdrawal and frontrunning attacks.
 *
 * This contract is based from the arcadexyz repository `v2-contracts`.
 * You can found the original at the URL:
 * https://github.com/arcadexyz/v2-contracts/blob/main/contracts/vault/AssetVault.sol
 *
 * @dev AssetVault only supports arbitrary external calls by the current owner of the vault.
 * We are expecting to ensure that this calls are only made by a contract,
 * so no user can meddle with the security of the Vault. Unless someone decided to deploy
 * a vault for themselves, which is also possible.
 */
contract AssetVault is
    OwnableNFT,
    ERC721HolderUpgradeable,
    ReentrancyGuardUpgradeable,
    IAssetVault
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    // ========== Storage ==========
    /**
     * @notice True if withdrawals are allowed out of this vault.
     * @dev Once set to true, it cannot be reverted back to false.
    */
    bool public withdrawEnabled;
    address public vaultFactoryAddress;

    // ========== Modifiers ==========
    /**
     * @dev For methods only callable with withdraws enabled
     * (all withdrawal operations).
     */
    modifier onlyWithdrawEnabled () {
        if (!withdrawEnabled) {
            revert Errors.VaultWithdrawsDisabled();
        }
        _;
    }

    /**
     * @dev For methods only callable with withdraws disabled
     * (call operations and enabling withdraws).
     */
    modifier onlyWithdrawDisabled() {
        if (withdrawEnabled) {
            revert Errors.VaultWithdrawsEnabled();
        }
        _;
    }

    // ========== Initializer/Constructor ==========
    /**
     * @dev Disables initializers, so contract can only be used trough proxies.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev See { IAssetVault-initialize }.
     */
    function initialize ()
     external initializer {
        // TODO: Add interface validation.
        // Validate arguments.
        if (
            withdrawEnabled
            || ownershipToken != address(0)
        ) revert Errors.AlreadyInitialized();

        // Assuming creator is vault factory
        vaultFactoryAddress = msg.sender;
        _setNFT(msg.sender);

        __ReentrancyGuard_init();
    }

    // ========== Internal Functions ==========
    /**
     * @notice Calculates the amounts to be distributed based on the percentages.
     *
     * @param _percentages The percentages to be used for the calculation.
     * @param _tokenAddress The address of the token to be distributed.
     *
     * @return _amounts The amounts to be distributed.
     * @return _totalAmount The total amount to be distributed.
     */
    function _calculatePercentages (
        uint256[] memory _percentages,
        address _tokenAddress
    ) internal view returns (
        uint256[] memory _amounts,
        uint256 _totalAmount
    ) {
        // Calculate amounts.
        uint256 percentageSum = 0;
        uint256 totalAmount = 0;
        uint256[] memory amounts = new uint256[](_percentages.length);
        IERC20 token = IERC20(_tokenAddress);

        uint256 currentBalance;
        if (_tokenAddress == address(0)) {
            currentBalance = address(this).balance;
        } else {
            currentBalance = token.balanceOf(address(this));
        }

        for (uint256 i = 0; i < _percentages.length; i++) {
            // Calculate amount
            uint256 amount;
            if (
                _tokenAddress == address(0)
            ) {
                amount = currentBalance * _percentages[i] / 100;
            }
            else {
                amount = currentBalance * _percentages[i] / 100;
            }

            percentageSum += _percentages[i];
            totalAmount += amount;
            amounts[i] = amount;
        }

        // Check if the amounts match.
        uint256 remnant;
        if (
            _tokenAddress == address(0)
        ) {
            if (
                address(this).balance > totalAmount
            ) {
                remnant = address(this).balance - totalAmount;
            }
        }
        else {
            if (
                token.balanceOf(
                    address(this)
                ) > totalAmount
            ) {
                remnant = token.balanceOf(
                    address(this)
                ) - totalAmount;
            }
        }

        // Add the remnant to the last amount.
        if (
            remnant > 0
        ) {
            // NOTE: We are expecting minimum amounts to be left due to floating point inaccuracies.
            // As we will stop the possibility for further withdrawals after this operation.
            // All should be taken out at once.
            amounts[_percentages.length - 1] += remnant;
            totalAmount += remnant;
        }

        // Check if the percentages are valid.
        if (
            percentageSum != 100 &&
            (
                totalAmount > address(this).balance ||
                (
                    totalAmount > token.balanceOf(
                        address(this)
                    ) &&
                    totalAmount > token.allowance(
                        address(this),
                        IVaultFactory(
                            vaultFactoryAddress
                        ).getDistributor()
                    )
                )
            )
        ) revert Errors.InsufficientBalanceOrAllowance();

        return (amounts, totalAmount);
    }

    // ========== Override Functions ==========
    /**
     * @dev See { ERC721Holder-onERC721Received }.
     */
    function onERC721Received (
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (
        bytes4
    ) {
        if (
            withdrawEnabled
        ) {
            revert Errors.VaultWithdrawsEnabled();
        }
        return this.onERC721Received.selector;
    }

    // ========== Helper Functions ==========
    /**
     * @dev See { IAssetVault-callApprove }.
     */
    function callApprove (
        address token,
        address spender,
        uint256 amount
    ) external override onlyOwner onlyWithdrawDisabled nonReentrant {
        IERC20 tokenContract = IERC20(token);

        // Validate Vault balance.
        if (
            amount > tokenContract.balanceOf(address(this))
        ) revert Errors.InsufficientBalance();

        // Do approval
        tokenContract.safeApprove(
            spender,
            amount
        );

        emit Events.ApprovedVault(
            msg.sender,
            address(this),
            spender,
            amount
        );
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IAssetVault-enableWithdraw }.
     */
    function enableWithdraw ()
     external override onlyOwner onlyWithdrawDisabled {
        withdrawEnabled = true;
        emit Events.WithdrawEnabled(
            msg.sender
        );
    }

    /**
     * @dev See { IAssetVault-withdrawERC721 }.
     */
    function withdrawERC721 (
        address token,
        uint256 tokenId,
        address to
    ) external override onlyOwner onlyWithdrawEnabled {
        IERC721(token).safeTransferFrom(
            address(this),
            to,
            tokenId
        );
        emit Events.WithdrawERC721(
            msg.sender,
            to,
            token,
            tokenId
        );
    }

    /**
     * @dev See { IAssetVault-withdrawERC20 }.
     */
    function withdrawERC20 (
        address token,
        address to,
        uint256 amount
    ) external override onlyOwner onlyWithdrawEnabled nonReentrant {
        IERC20 tokenInstance = IERC20(token);
        uint256 balance = tokenInstance.balanceOf(address(this));

        // Validations
        if (
            (amount > balance) &&
            amount > tokenInstance.allowance(
                address(this),
                IVaultFactory(
                    vaultFactoryAddress
                ).getDistributor()
            )
        ) revert Errors.InsufficientBalanceOrAllowance();
        // Execute the withdraw.
        tokenInstance.safeTransfer(to, amount);
        // Emit event.
        emit Events.WithdrawERC20(
            msg.sender,
            token,
            to,
            balance
        );
    }

    /**
     * @dev See { IAssetVault-withdrawNative }.
     */
    function withdrawNative (
        address to,
        uint256 amount
    ) external override onlyOwner onlyWithdrawEnabled nonReentrant {
        // Validations.
        if (
            amount > address(this).balance
        ) revert Errors.InsufficientBalance();
        // Execute the withdraw.
        payable(to).sendValue(amount);
        // Emit event.
        emit Events.WithdrawNative(
            msg.sender,
            to,
            amount
        );
    }

    /**
     * @dev See { IAssetVault-batchPercentageWithdraw }.
     */
    function batchPercentageWithdraw (
        address payable[] memory _payableRecipients,
        address[] memory _recipients,
        uint256[] memory _percentages,
        DataTypes.TokenType _currency,
        address _tokenAddress
    ) external override onlyOwner onlyWithdrawEnabled nonReentrant {
        // Check if the arguments are valid.
        if (
            _recipients.length == 0 &&
            _payableRecipients.length == 0
        ) revert Errors.InvalidParameter ();
        if (
            !(
                _recipients.length == _percentages.length ||
                _payableRecipients.length == _percentages.length
            )
        ) revert Errors.InvalidArrayLength ();

        // Calculate Amounts
        (uint256[] memory amounts, uint256 totalAmount) = _calculatePercentages(
            _percentages,
            _tokenAddress
        );
        
        IDistributor distributor = IDistributor(
            IVaultFactory(
                vaultFactoryAddress
            ).getDistributor()
        );

        // Execute the batch withdraw.
        if (
            _currency == DataTypes.TokenType.Native
        ) {
            distributor.distributeNative{
                value: totalAmount
            }(
                payable(address(this)),
                _payableRecipients,
                amounts
            );
        } else if (
            (
                _currency == DataTypes.TokenType.ERC20 ||
                _currency == DataTypes.TokenType.dApi
            ) &&
            _tokenAddress != address(0)
        ) {
            distributor.distributeTokens(
                IERC20(_tokenAddress),
                address(this),
                _recipients,
                amounts
            );
        } else {
            revert Errors.InvalidCurrency();
        }
    }

    /**
     * @dev See { IAssetVault-batchAmountWithdraw }.
     */
    function batchAmountWithdraw (
        address payable[] memory _payableRecipients,
        address[] memory _recipients,
        uint256[] memory _amounts,
        DataTypes.TokenType _currency,
        address _tokenAddress
    ) external override onlyOwner onlyWithdrawEnabled nonReentrant {
        // Check if the arguments are valid.
        if (
            _recipients.length == 0 &&
            _payableRecipients.length == 0
        ) revert Errors.InvalidParameter ();
        if (
            !(
                _recipients.length == _amounts.length ||
                _payableRecipients.length == _amounts.length
            )
        ) revert Errors.InvalidArrayLength ();

        uint256 totalAmount = 0;
        address distributorAddress = IVaultFactory(
            vaultFactoryAddress
        ).getDistributor();
        IDistributor distributor = IDistributor(
            distributorAddress
        );

        for (uint256 i=0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        if (
            _currency == DataTypes.TokenType.Native
        ) {
            if (
                totalAmount != address(this).balance
            ) revert Errors.InsufficientBalance();
            // Execute the batch withdraw.
            distributor.distributeNative{
                value: totalAmount
            }(
                payable(address(this)),
                _payableRecipients,
                _amounts
            );
        } else if (
            (
                _currency == DataTypes.TokenType.ERC20 ||
                _currency == DataTypes.TokenType.dApi
            ) &&
            _tokenAddress != address(0)
        ) {
            IERC20 token = IERC20(_tokenAddress);

            if (
                totalAmount > token.balanceOf(
                    address(this)
                ) &&
                totalAmount > token.allowance(
                    address(this),
                    distributorAddress
                )
            ) revert Errors.InsufficientBalanceOrAllowance();
            // Execute the batch withdraw.
            distributor.distributeTokens(
                token,
                address(this),
                _recipients,
                _amounts
            );
        } else {
            revert Errors.InvalidCurrency();
        }
    }

    /**
     * @dev Fallback function to receive native tokens.
     */
    receive() external payable {
        if (
            withdrawEnabled
        ) revert Errors.VaultWithdrawsEnabled();
    }
}
