// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.15;

// Package imports
import { Errors } from "../../libraries/Errors.sol";
// Third party imports
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title OwnableNFT
 * @author API3 Latam.
 *
 * @notice Logic for ACL trough token ownership.
 * The owner is determined by the holding of a token with an specific ID,
 * where the token ID converts to an on-chain address.
 */
abstract contract OwnableNFT {
    // ========== Storage ==========
    // The address of the token that the owner should have domain over.
    address public ownershipToken;

    // ========== Modifiers ==========
    /**
     * @notice Checks if the function is being called by the owner,
     * where the owner is defined by the token ID in the ownership token which
     * maps to the calling contract address.
     */
    modifier onlyOwner() {
        if (owner() != msg.sender) {
            revert Errors.CallerNotOwner(msg.sender);
        }
        _;
    }

    // ========== Helpers/Utilities Functions ==========
    /**
     * @notice Set the address for the token from whom ownership
     * the access control is derived.
     *
     * @param _ownershipToken The ERC721 address to use as controller.
     */
    function _setNFT (
        address _ownershipToken
    ) internal {
        ownershipToken = _ownershipToken;
    }

    // ========== Get/Set Function ==========
    /**
     * @notice Gets the owner of the underlying token ID, derived
     * from the contract address of the contract implementing.
     * 
     * @return tokenOwner The address of the owner.
     */
    function owner() 
     public view virtual returns (
        address tokenOwner
    ) {
        return IERC721(
            ownershipToken
        ).ownerOf(
            uint256(
                uint160(
                    address(this)
                )
            )
        );
    }

    /**
     * @notice Gets the token ID of the underlying token.
     * 
     * @return tokenId The token ID.
     */
    function tokenId ()
     public view returns (
        uint256
     ) {
        return uint256(
            uint160(
                address(this)
            )
        );
     }

    // ========== Upgradability ==========
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}