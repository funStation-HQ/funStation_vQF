// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports.
import { IVaultDepositRouter } from "../../../interfaces/IVaultDepositRouter.sol";
import { IVaultFactory } from "../../../interfaces/IVaultFactory.sol";
import { IAssetVault } from "../../../interfaces/IAssetVault.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
// Third party imports.
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title VaultDepositRouter.
 * @author API3 Latam.
 *
 * The VaultDepositRouter contract is a middleman that enables deposits
 * across the platform to the 'AssetVaults'.
 */
contract VaultDepositRouter is 
    UUPSUpgradeable,
    OwnableUpgradeable,
    IVaultDepositRouter
{
    using Address for address payable;
    using SafeERC20 for IERC20;

    // ========== Storage ==========
    IVaultFactory public factory;
    mapping(address => 
        mapping(DataTypes.TokenType => DataTypes.TokenInventory[])
    ) private vaultBalances;

    // ========== Modifiers ==========
    /**
     * @dev Modifier to check if the caller is the owner of the token.
     */
    modifier validVault (
        address vault
    ) {
        if (
            IAssetVault(vault).withdrawEnabled()
        ) revert Errors.VaultWithdrawsEnabled();
        _;
    }

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializer for the logic contract trough the UUPS Proxy.
     *
     * @param _factoryAddress The address to use for the factory interface.
     */
    function initialize (
        address _factoryAddress
    ) external override initializer {
        if (_factoryAddress == address(0)) {
            revert Errors.InvalidProxyAddress(_factoryAddress);
        }
        __Ownable_init();
        __UUPSUpgradeable_init();

        factory = IVaultFactory(_factoryAddress);
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { IVaultDepositRouter-upgradeFactory }.
     */
    function upgradeFactory (
        address newImplementation
    ) external override onlyOwner {
        factory = IVaultFactory(newImplementation);
    }

    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override onlyOwner {}

    /**
     * @dev See { IVaultDepositRouter-getVersion }.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    ) {
        return 1;
    }
    
    // ========== Helpers/Utilities Functions ==========
    /**
     * @notice Collect an token ERC721 from the caller
     *
     * @param vault The vault to deposit to.
     * @param token The token to deposit.
     * @param id The ID of the token to deposit.
     */
    function _depositERC721 (
        address owner,
        address vault,
        address token,
        uint256 id
    ) internal validVault(vault) {
        IERC721(token).safeTransferFrom(
            owner,
            vault,
            id
        );
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IVaultDepositRouter-depositERC721Batch }.
     */
    function depositERC721 (
        address owner,
        uint256 vault,
        address[] calldata tokens,
        uint256[] calldata ids
    ) external {
        if (
            tokens.length == 0
        ) revert Errors.InvalidParameter();
        if (
            tokens.length != ids.length
        ) revert Errors.BatchLengthMismatch();

        address vaultAddress = factory.instanceAt(vault);

        for (uint256 i = 0; i < tokens.length; i++) {
            _depositERC721(owner, vaultAddress, tokens[i], ids[i]);
            
            vaultBalances[vaultAddress][
             DataTypes.TokenType.ERC721].push(
                DataTypes.TokenInventory({
                    tokenAddress: tokens[i],
                    tokenId: ids[i],
                    tokenAmount: 1
                })
            );
        }

        emit Events.DepositERC721(
            owner,
            vaultAddress,
            tokens,
            ids
        );
    }

    /**
     * @dev See { IVaultDepositRouter-depositNative }.
     */
    function depositNative (
        address sender,
        address vault,
        uint256 amount
    ) external payable override validVault(
        vault
    ) {
        payable(vault).sendValue(amount);

        vaultBalances[vault][
            DataTypes.TokenType.Native].push(
                DataTypes.TokenInventory({
                    tokenAddress: address(0),
                    tokenId: 0,
                    tokenAmount: amount
                })
            );

        emit Events.DepositNative(
            sender,
            vault,
            amount
        );
    }

    /**
     * @dev See { IVaultDepositRouter-depositERC20 }.
     */
    function depositERC20 (
        address sender,
        address sponsor,
        address vault,
        address token,
        uint256 amount
    ) external override validVault(
        vault
    ) {
        // Initial validations.
        if (
            token == address(0)
        ) revert Errors.InvalidParameter();
        if (
            amount == 0
        ) revert Errors.InvalidParameter();
        if (
            sender != sponsor
        ) {
            // Sponsor will pay for the transaction.
            if (sponsor == address(0)) {
                revert Errors.InvalidParameter();
            } else {
                if (
                    IERC20(token).allowance(
                        sponsor,
                        address(this)
                    ) < amount
                ) {
                    revert Errors.InsufficientBalanceOrAllowance();
                } else {
                    IERC20(token).safeTransferFrom(
                        sponsor,
                        vault,
                        amount
                    );
                }
            }
        } else {
            // Sender will pay for the transaction.
            if (
                IERC20(token).allowance(
                    sender,
                    address(this)
                ) < amount
            ) {
                revert Errors.InsufficientBalanceOrAllowance();
            } else {
                IERC20(token).safeTransferFrom(
                    sender,
                    vault,
                    amount
                );
            }
        }

        vaultBalances[vault][
            DataTypes.TokenType.ERC20].push(
                DataTypes.TokenInventory({
                    tokenAddress: token,
                    tokenId: 0,
                    tokenAmount: amount
                })
            );

        emit Events.DepositERC20(
            sender,
            vault,
            token,
            amount
        );
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
