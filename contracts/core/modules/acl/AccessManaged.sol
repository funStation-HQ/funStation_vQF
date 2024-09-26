// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports.
import { IAccessManager } from "../../../interfaces/IAccessManager.sol";
import { IAccessManaged } from "../../../interfaces/IAccessManaged.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
// Third party imports.
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title AccessManaged.
 * @author API3 Latam.
 * 
 * @notice Implementation of the AccessManaged interface.
 */
abstract contract AccessManaged is
    Initializable,
    ContextUpgradeable,
    IAccessManaged
{
    // ========== Storage ==========
    address public authority;

    // ========== Modifiers ==========
    /**
     * @notice Restricts access to a function as defined by the connected Authority for this contract and the
     * caller and selector of the function that entered the contract.
     */
    modifier restricted() {
        _checkCanCall(
            _msgSender(),
            _msgData()
        );
        _;
    }

    // ========== Initializer ==========
    /**
     * @param _initialAuthority Initial authority to connect to the contract.
     */
    function __AccessManaged_init (
        address _initialAuthority
    ) internal onlyInitializing {
        __AccessManaged_init_unchained(
            _initialAuthority
        );
    }
    
    function __AccessManaged_init_unchained (
        address initialAuthority
    ) internal onlyInitializing {
        _setAuthority(
            initialAuthority
        );
    }

    // ========== Internal Functions ==========
    /**
     * @notice Internal version of `setAuthority` without access control.
     * 
     * @param newAuthority New authority to connect to the contract.
     */
    function _setAuthority (
        address newAuthority
    ) internal virtual {
        // Parameter validation.
        if (
            newAuthority == address(0) ||
            newAuthority == address(this) ||
            newAuthority == authority
        ) revert Errors.InvalidAddress();
        // Update state.
        authority = newAuthority;
        // Emit state changes.
        emit Events.AuthorityUpdated(
            newAuthority
        );
    }

    /**
     * @notice Checks if the caller is allowed to call the function
     * identified by the selector.
     * @dev Reverts if the caller is not allowed.
     * Panics if the calldata is less than 4 bytes long.
     * 
     * @param caller Address of the caller.
     * @param callData Calldata of the function call.
     */
    function _checkCanCall (
        address caller,
        bytes calldata callData
    ) internal virtual {
        // Execute the canCall function of the authority.
        (bool success, bytes memory returnedData) = authority.staticcall(
            abi.encodeCall(
                IAccessManager.canCall,
                (
                    caller,
                    address(this),
                    bytes4(callData[0:4])
                )
            )
        );
        // Check the returned value from the validation.
        if (!success) {
            revert Errors.AccessManagedUnauthorized(caller);
        } else {
            bool canCall = abi.decode(returnedData, (bool));
            if (!canCall) revert Errors.AccessManagedUnauthorized(caller);
        }
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IAcessManaged-getAuthority }
     */
    function getAuthority ()
     public view virtual override returns (
        address _authority
    ) {
        return authority;
    }

    /**
     * @dev See { IAccessManaged-setAuthority }.
     */
    function setAuthority (
        address newAuthority
    ) public virtual override {
        address caller = _msgSender();
        // Only the current authority can change the authority.
        if (
            caller != authority
        ) revert Errors.AccessManagedUnauthorized(
            caller
        );
        // The new authority is not a contract.
        if (
            newAuthority.code.length == 0
        ) revert Errors.AccessManagedInvalidAuthority(
            newAuthority
        );
        // Update state.
        _setAuthority(newAuthority);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}