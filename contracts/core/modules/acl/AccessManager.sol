// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports.
import { IAccessManager } from "../../../interfaces/IAccessManager.sol";
import { IAccessManaged } from "../../../interfaces/IAccessManaged.sol";
import { Events }  from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
// Third party imports.
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title AccessManager.
 * @author API3 Latam.
 * 
 * @notice Implementation of the AccessManager interface.
 */
contract AccessManager is
    UUPSUpgradeable,
    ContextUpgradeable,
    IAccessManager
{
    // ========== Storage ==========
    uint64 public constant ADMIN_ROLE = type(uint64).min;
    uint64 public constant PUBLIC_ROLE = type(uint64).max; // Default Role.

    mapping(address => DataTypes.TargetConfig) private _targets;
    mapping(uint64 => DataTypes.Role) private _roles;

    // ========== Modifiers ==========
    /**
     * @dev Check that the caller is authorized to perform the operation,
     * following the restrictions encoded in `_getAdminRestrictions`.
     */
    modifier onlyAuthorized () {
        _checkAuthorized();
        _;
    }

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor () {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with an initial admin.
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     * 
     * @param initialAdmin Initial admin to connect to the contract.
     */
    function initialize (
        address initialAdmin
    ) external initializer {
        if (
            initialAdmin == address(0)
        ) {
            revert Errors.ZeroAddress();
        }

        // Grant initial admin role.
        _grantRole(ADMIN_ROLE, initialAdmin);

        // Run initializers.
        __Context_init();
        __UUPSUpgradeable_init();
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override onlyAuthorized {}

    /**
     * @dev See { IAccessManager-getVersion }.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    ) {
        return 1;
    }

    // ========== Internal Functions ==========
    /**
     * @notice Extracts the selector from calldata.
     * @dev Panics if data is not at least 4 bytes.
     * NOTE: The first 4 bytes of any encoded function call will always
     * contain the selector of the function.
     */
    function _checkSelector (
        bytes calldata data
    ) private pure returns (
        bytes4
    ) {
        return bytes4 (
            data[0:4]
        );
    }

    /**
     * @notice Get the admin restrictions of a given function call
     * based on the function and arguments involved.
     * 
     * @param data The calldata of the function call.
     *
     * @return restricted Does this data match a restricted operation.
     * @return roleAdminId Which role is this operation restricted to.
     */
    function _getAdminRestrictions (
        bytes calldata data
    ) private view returns (
        bool restricted,
        uint64 roleAdminId
    ) {
        if (data.length < 4) {
            // Not enough data to check restrictions.
            return (false, 0);
        }
        // Retrieve the selector to look role restrictions up for.
        bytes4 selector = _checkSelector(data);
        // Restricted to default ADMIN role only.
        if (
            selector == this.setTargetFunctionRole.selector ||
            selector == this.setTargetClosed.selector ||
            selector == this.updateAuthority.selector ||
            selector == this.setRoleAdmin.selector
        ) {
            return (true, ADMIN_ROLE);
        }
        // Restricted to the admin(s) of each role to be granted.
        if (
            selector == this.grantRole.selector ||
            selector == this.revokeRole.selector
        ) {
            // First argument is a roleId.
            uint64 roleId = abi.decode(
                data[0x04:0x24],
                (uint64)
            );
            return (true, getRoleAdmin(roleId));
        }
        // Ensure always returning a default.
        return (false, 0);
    }

    /**
     * @notice A version of `canCall` that checks for admin restrictions in this contract.
     * 
     * @param caller The caller of the function.
     * @param data The calldata of the function call.
     * 
     * @return authorized Whether the caller can call the function or not.
     */
    function _canCallSelf (
        address caller,
        bytes calldata data
    ) private view returns (
        bool authorized
    ) {
        // Not enough data to check restrictions.
        if (data.length < 4) {
            return false;
        }
        // Check default admin restrictions.
        (bool enabled, uint64 roleId) = _getAdminRestrictions(data);
        if (!enabled) {
            return false;
        }
        // Check if caller has the required role.
        bool inRole = hasRole(roleId, caller);
        if (!inRole) {
            return false;
        }
        // If not any issue then return true.
        return true;
    }

    /**
     * @dev Check if the current call is authorized according to admin logic.
     */
    function _checkAuthorized ()
     private view {
        address caller = _msgSender();
        bool authorized = _canCallSelf(caller, _msgData());
        if (
            !authorized
        ) {
            revert Errors.AccessManagerUnauthorized(caller);
        }
    }

    /**
     * @notice Internal version of `setTargetFunctionRole` without access control.
     * @dev Emits a `TargetFunctionRoleUpdated` event.
     * 
     * @param target Address of the target contract.
     * @param selector Function selector to set the role for.
     * @param roleId ID of the role to set.
     */
    function _setTargetFunctionRole (
        address target,
        bytes4 selector,
        uint64 roleId
    ) internal virtual {
        // Parameters' Validations.
        if (
            target == address(0)
        ) {
            revert Errors.ZeroAddress();
        }
        if (
            selector == bytes4(0)
        ) {
            revert Errors.InvalidParameter();
        }
        // Set the role.
        _targets[target].allowedRoles[selector] = roleId;
        // Emit the event.
        emit Events.TargetFunctionRoleUpdated(
            target,
            selector,
            roleId
        );
    }

    /**
     * @notice Internal version of `setTargetClosed` without access control.
     * @dev Emits a {TargetClosed} event.
     */
    function _setTargetClosed (
        address target,
        bool closed
    ) internal virtual {
        // Parameters' Validations.
        if (
            target == address(this) ||
            target == address(0)
        ) {
            revert Errors.InvalidParameter();
        }
        // Set the target closed.
        _targets[target].closed = closed;
        // Emit the event.
        emit Events.TargetClosed(
            target,
            closed
        );
    }

    /**
     * @notice Internal version of `grantRole` without access control.
     * @dev Emits a `RoleGranted` event.
     * 
     * @param roleId ID of the role to grant.
     * @param account Address to grant the role to.
     * 
     * @return success Whether the role was granted successfully or not.
     */
    function _grantRole (
        uint64 roleId,
        address account
    ) internal virtual returns (
        bool success
    ) {
        // Parameters' Validations.
        if (
            account == address(0)
        ) {
            revert Errors.ZeroAddress();
        }
        if (
            roleId == PUBLIC_ROLE
        ) {
            revert Errors.InvalidRole();
        }
        if (
            _roles[roleId].members[account] != 0
        ) {
            revert Errors.RoleAlreadyGranted();
        }
        // Add the role to the account.
        _roles[roleId].members[account] = block.timestamp;
        // Emit the event.
        emit Events.RoleGranted(
            roleId,
            account
        );
        // Just return.
        return true;
    }

    /**
     * @dev Internal version of `revokeRole` without access control.
     * This logic is also used by `renounceRole`.
     * @dev Emits a {RoleRevoked} event if the account had the role.
     * 
     * @param roleId ID of the role to revoke.
     * @param account Address to revoke the role from.
     * 
     * @return success Whether the role was revoked successfully or not.
     */
    function _revokeRole (
        uint64 roleId,
        address account
    ) internal virtual returns (
        bool success
    ) {
        // Parameters' Validations.
        if (
            account == address(0)
        ) {
            revert Errors.ZeroAddress();
        }
        if (
            roleId == PUBLIC_ROLE
        ) {
            revert Errors.InvalidRole();
        }
        // Check if role is granted.
        if (
            _roles[roleId].members[account] == 0
        ) revert Errors.InvalidRole();
        // Remove the role from the account.
        delete _roles[roleId].members[account];
        // Emit the event.
        emit Events.RoleRevoked(
            roleId,
            account
        );
        // Just return.
        return true;
    }

    /**
     * @notice Internal version of `setRoleAdmin` without access control.
     * @dev Emits a `RoleAdminChanged` event.
     *
     * NOTE: Setting the admin role as the `PUBLIC_ROLE` is allowed, but it will effectively allow
     * anyone to set grant or revoke such role.
     */
    function _setRoleAdmin (
        uint64 roleId,
        uint64 admin
    ) internal virtual returns (
        bool success
    ) {
        // Parameters' Validations.
        if (
            roleId == ADMIN_ROLE ||
            roleId == PUBLIC_ROLE
        ) {
            revert Errors.InvalidRole();
        }
        uint64 prevAdmin = _roles[roleId].admin;
        // Set the new admin.
        _roles[roleId].admin = admin;
        // Emit the event.
        emit Events.RoleAdminChanged(
            roleId,
            prevAdmin,
            admin
        );
        // Just return.
        return true;
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IAccessManager-isTargetClosed }.
     */
    function isTargetClosed (
        address target
    ) public view virtual override returns (
        bool
    ) {
        return _targets[target].closed;
    }

    /**
     * @dev See { IAccessManager-getTargetFunctionRole }.
     */
    function getTargetFunctionRole (
        address target,
        bytes4 selector
    ) public view virtual override returns (
        uint64
    ) {
        return _targets[target].allowedRoles[selector];
    }

    /**
     * @dev See { IAccessManager-getRoleAdmin }.
     */
    function getRoleAdmin (
        uint64 roleId
    ) public view virtual override returns (
        uint64
    ) {
        return _roles[roleId].admin;
    }

    /**
     * @dev See { IAccessManager-getRoleGrantedTime }.
     */
    function getRoleGrantedTime (
        uint64 roleId,
        address account
    ) public view virtual override returns (
        uint256 since
    ) {
        return _roles[roleId].members[account];
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IAccessManager-setTargetFunctionRole }.
     */
    function setTargetFunctionRole(
        address target,
        bytes4[] calldata selectors,
        uint64 roleId
    ) public virtual override onlyAuthorized {
        // Execute the set up.
        for (
            uint256 i = 0;
            i < selectors.length;
            ++i
        ) {
            _setTargetFunctionRole(
                target,
                selectors[i],
                roleId
            );
        }
    }

    /**
     * @dev See { IAccessManager-setTargetClosed }.
     */
    function setTargetClosed (
        address target,
        bool closed
    ) public virtual override onlyAuthorized {
        // Execute the set up.
        _setTargetClosed(
            target,
            closed
        );
    }

    /**
     * @dev See { IAcessManager-updateAuthority }.
     */
    function updateAuthority(
        address target,
        address newAuthority
    ) public virtual override onlyAuthorized {
        IAccessManaged(
            target
        ).setAuthority(
            newAuthority
        );
    }

    /**
     * @dev See { IAccessManager-canCall }.
     */
    function canCall (
        address caller,
        address target,
        bytes4 selector
    ) public view virtual override returns (
        bool isAllowed
    ) {
        // Check if target is closed.
        if (
            isTargetClosed(target)
        ) {
            return false;
        } else {
            // Execute role validation.
            uint64 roleId = getTargetFunctionRole(
                target,
                selector
            );
            return hasRole(roleId, caller);
        }
    }

    /**
     * @dev See { IAccessManager-hasRole }.
     */
    function hasRole (
        uint64 roleId,
        address account
    ) public view virtual returns (
        bool isMember
    ) {
        if (
            roleId == PUBLIC_ROLE
        ) {
            return true;
        } else {
            // If it's 0 then it's not a member.
            // Else it's a member.
            return _roles[roleId].members[account] != 0;
        }
    }

    /**
     * @dev See { IAccessManager-grantRole }.
     */
    function grantRole (
        uint64 roleId,
        address account
    ) public virtual override onlyAuthorized {
        // Execute the grant.
        bool result = _grantRole(
            roleId,
            account
        );
        // Check the result.
        if (!result) {
            revert Errors.FailedExecution();
        }
    }

    /**
     * @dev See { IAccessManager-revokeRole }.
     */
    function revokeRole (
        uint64 roleId,
        address account
    ) public virtual override onlyAuthorized {
        // Execute the revokation.
        bool result = _revokeRole(
            roleId,
            account
        );
        // Check the result.
        if (!result) {
            revert Errors.FailedExecution();
        }
    }

    /**
     * @dev See { IAccessManager-renounceRole }.
     */
    function renounceRole (
        uint64 roleId,
        address account
    ) public virtual override {
        // Parameters' Validations.
        if (
            account != _msgSender()
        ) {
            revert Errors.InvalidAddress();
        }
        // Execute the revoke role.
        bool result = _revokeRole(
            roleId,
            account
        );
        // Check the result.
        if (!result) {
            revert Errors.FailedExecution();
        }
    }

    /**
     * @dev See { IAccessManager-setRoleAdmin }.
     */
    function setRoleAdmin (
        uint64 roleId,
        uint64 admin
    ) public virtual override onlyAuthorized {
        _setRoleAdmin(
            roleId,
            admin
        );
    }
}