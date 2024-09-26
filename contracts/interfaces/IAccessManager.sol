// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title IAccessManaged.
 * @author API3 Latam.
 * 
 * @notice Manager contract for ACL entities.
 * 
 * This contract is based from the OpenZeppelin v5.0.0 contracts.
 * You can found it at this URL:
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/manager/IAccessManager.sol
 */
interface IAccessManager {
    // ================ Upgrade Functions ================
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

    // ========== Get/Set Functions ==========
    /**
     * @notice Get whether the contract is closed disabling any access.
     * Otherwise role permissions are applied.
     * 
     * @param target Address of the target contract.
     * 
     * @return Whether the contract is closed.
     */
    function isTargetClosed (
        address target
    ) external view returns (
        bool
    );

    /**
     * @notice Get the role required to call a function.
     * 
     * @param target Address of the target contract.
     * @param selector Function selector.
     * 
     * @return Role required to call the function.
     */
    function getTargetFunctionRole (
        address target,
        bytes4 selector
    ) external view returns (
        uint64
    );

    /**
     * @notice Get the id of the role that acts as an admin for the given role.
     * @dev The admin permission is required to grant the role and revoke the role.
     * 
     * @param roleId Id of the role.
     * 
     * @return Id of the admin role.
     */
    function getRoleAdmin (
        uint64 roleId
    ) external view returns (
        uint64
    );

    /**
     * @notice Get the the timepoint at which role membership became active.
     * 
     * @param roleId Id of the role.
     * @param account Address of the account.
     * 
     * @return Timepoint at which role membership became active.
     */
    function getRoleGrantedTime (
        uint64 roleId,
        address account
    ) external view returns (
        uint256
    );

    // ========== Core Functions ==========
    /**
     * @notice Set the role required to call functions identified
     * by the `selectors` in the `target` contract.
     * @dev The caller must be a global admin.
     * Emits a `TargetFunctionRoleUpdated` event per selector.
     * 
     * @param target Address of the target contract.
     * @param selectors Function selectors.
     * @param roleId Id of the role required to call the function.
     */
    function setTargetFunctionRole (
        address target,
        bytes4[] calldata selectors,
        uint64 roleId
    ) external;

    /**
     * @notice Set the closed flag for a contract.
     * @dev The caller must be a global admin.
     * Emits a `TargetClosed` event.
     * 
     * @param target Address of the target contract.
     * @param closed Whether the contract is closed.
     */
    function setTargetClosed (
        address target,
        bool closed
    ) external;

    /**
     * @notice Changes the authority of a target managed by this manager instance.
     * @dev The caller must be a global admin.
     * 
     * @param target Address of the target contract.
     * @param newAuthority New authority to set.
     */
    function updateAuthority (
        address target,
        address newAuthority
    ) external;

    /**
     * @notice Check if an address (`caller`) is authorised to call a given
     * function on a given contract directly
     * @dev This function is usually called by the targeted contract to control
     * immediate execution of restricted functions.
     * NOTE: This function does not report the permissions of this manager itself.
     * These are defined by the { AccessManager-_canCallSelf } function instead.
     * 
     * @param caller Address of the caller.
     * @param target Address of the target contract.
     * @param selector Function selector.
     * 
     * @return isAllowed Whether the caller is authorised to call the function.
     */
    function canCall (
        address caller,
        address target,
        bytes4 selector
    ) external view returns (
        bool isAllowed
    );

    /**
     * @notice Check if a given account currently has the permission level
     * corresponding to a given role.
     * 
     * @param roleId Id of the role.
     * @param account Address of the account.
     * 
     * @return isMember Whether the account has the role.
     */
    function hasRole (
        uint64 roleId,
        address account
    ) external view returns (
        bool isMember
    );

    /**
     * @notice Add `account` to `roleId`.
     * @dev This gives the account the authorization to call any function
     * that is restricted to this role.
     * 
     * Requirements:
     * - The caller must be an admin for the role (see { IaccessManager-getRoleAdmin })
     * - Granted role must not be the `PUBLIC_ROLE`
     *
     * Emits a `RoleGranted` event.
     * 
     * @param roleId Id of the role.
     * @param account Address of the account.
     * 
     */
    function grantRole (
        uint64 roleId,
        address account
    ) external;

    /**
     * @notice Remove an account from a role, with immediate effect.
     * If the account does not have the role, this call will be reverted.
     * @dev 
     * Requirements:
     * - The caller must be an admin for the role (see { IAccessManager-getRoleAdmin })
     * - Revoked role must not be the `PUBLIC_ROLE`
     *
     * Emits a `RoleRevoked` event if the account had the role.
     * 
     * @param roleId Id of the role.
     * @param account Address of the account.
     */
    function revokeRole (
        uint64 roleId,
        address account
    ) external;

    /**
     * @notice Renounce role permissions for the calling account with
     * immediate effect. If the sender is not in the role this call
     * will be reverted.
     * @dev The caller must be same as the `account` parameter.
     * Emits a `RoleRevoked` event if the account had the role.
     * 
     * @param roleId Id of the role.
     * @param account Address of the account.
     */
    function renounceRole (
        uint64 roleId,
        address account
    ) external;

    /**
     * @notice Change admin role for a given role.
     * @dev The caller must be a global admin.
     * Emits a `RoleAdminChanged` event.
     * 
     * @param roleId Id of the role.
     * @param admin Id of the admin role.
     */
    function setRoleAdmin (
        uint64 roleId,
        uint64 admin
    ) external;
}