// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.15;

// Package imports
import { IAssetVault } from "../../../interfaces/IAssetVault.sol";
import { IVaultFactory } from "../../../interfaces/IVaultFactory.sol";
import { Errors } from "../../../libraries/Errors.sol";
import { Events } from "../../../libraries/Events.sol";
// Third party imports
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";


/**
 * @title VaultFactory
 * @author API3 Latam.
 *
 * @notice The Vault factory is used for creating and registering AssetVault contracts.
 * @dev Each Asset Vault is created via "create", and uses a specified template
 * and the OpenZeppelin Clones library to cheaply deploy a new clone pointing to logic
 * in the template.
 */
contract VaultFactory is 
    ERC721EnumerableUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IVaultFactory
{
    // ========== Storage ==========
    address public vaultLogic;    // The implementation contract for asset vaults.
    address public distributor;   // The distributor contract address.

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev See { IVaultFactory-initialize }.
     */
    function initialize (
        address _vaultAddress
    ) external override initializer {
        if (
            _vaultAddress == address(0)
        ) revert Errors.InvalidProxyAddress(_vaultAddress);
        __Ownable_init();
        __UUPSUpgradeable_init();

        vaultLogic = _vaultAddress;
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { IVaultFactory-upgradeVault }.
     */
    function upgradeVault (
        address newImplementation
    ) external override onlyOwner {
        vaultLogic = newImplementation;
    }

    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override onlyOwner {}

    /**
     * @dev See { IVaultFactory-getVersion }.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    ) {
        return 1;
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IVaultFactory-isInstance }.
     */
    function isInstance (
        address instance
    ) external view override returns (
        bool validity
    ) {
        return _exists(
            uint256(uint160(instance))
        );
    }

    /**
     * @dev See { IVaultFactory-instanceAt }.
     */
    function instanceAt (
        uint256 tokenId
    ) external view override returns (
        address instance
    ) {
        if (!_exists(tokenId)) {
            revert Errors.TokenIdOutOfBounds(tokenId);
        }

        return address(uint160(tokenId));
    }

    /**
     * @dev See { IVaultFactory-instanceAtIndex }.
     */
    function instanceAtIndex (
        uint256 index
    ) external view override returns (
        address instance
    ) {
        return address(uint160(
            tokenByIndex(index)
        )); 
    }

    /**
     * @dev See { IVaultFactory-getDistributor }.
     */
    function getDistributor ()
     external view override returns (
        address distributorAddress
    ) {
        return distributor;
    }

    /**
     * @dev See { IVaultFactory-setDistributor }.
     */
    function setDistributor (
        address _distributor
    ) external onlyOwner {
        if (
            _distributor == address(0) ||
            _distributor == distributor
        ) revert Errors.InvalidParameter();
        
        distributor = _distributor;
    }

    // ========== Utilities Functions ==========
    /**
     * @notice Creates and initializes a minimal proxy vault instance,
     * using the OpenZeppelin Clones library.
     *
     * @return vault The address of the newly created vault.
     */
    function _create ()
     internal returns (
        address vault
    ) {
        vault = Clones.clone(vaultLogic);
        IAssetVault(vault).initialize();
        return vault;
    }

    // ========== Overrides ==========
    /**
     * @dev See { Ownable-owner }.
     */
    function owner () public view override(
        OwnableUpgradeable,
        IVaultFactory
    ) returns (
        address
    ) {
        return super.owner();
    }

    /**
     * @dev See { IVaultFactory-safeTransferFrom }.
     */
    function safeTransferFrom (
        address from,
        address to,
        uint256 tokenId
    ) public override (
        ERC721Upgradeable,
        IERC721Upgradeable,
        IVaultFactory
    ) {
        super.safeTransferFrom(
            from,
            to,
            tokenId
        );
    }

    /**
     * @notice Hook that is called before any token transfer.
     * @dev This notifies the vault contract about the ownership transfer.
     * Does not let tokens with withdraw enabled be transferred, which ensures
     * that items cannot be withdrawn in a frontrunning attack.
     *
     * @param from The previous owner of the token.
     * @param to The owner of the token after transfer.
     * @param firstTokenId The token ID.
     * @param batchSize JUST FOR COMPATIBILITY PURPOSES.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override  {
        IAssetVault vault = IAssetVault(
            address(uint160(firstTokenId))
        );
        
        if (vault.withdrawEnabled()) {
            revert Errors.NoTransferWithdrawEnabled(firstTokenId);
        }

        super._beforeTokenTransfer(from, to, firstTokenId, 1);
    }

    // ========== Core Functions ==========

    /**
     * @dev See { IVaultFactory-create }.
     */
    function create (
        address to
    ) external override returns (
        uint256 vaultId,
        address vaultAddress
    ) {
        address vault = _create();
        uint256 id = uint256(uint160(vault)); 

        _mint(to, id);

        emit Events.VaultCreated(
            id,
            vault,
            to
        );
        return (id, vault);
    }
}