
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { AccessManaged } from "../core/modules/acl/AccessManaged.sol";
// Third party imports
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

/**
 * @title MockRestrictedFuncs
 *
 * @notice Mock contract with restricted functions.
 */
contract MockRestrictedFuncs is
    UUPSUpgradeable,
    AccessManaged
{
    // ========== Events ==========
    event RestrictedFuncCalled();  // Emitted when restrictedFunc is called.

    // ========== Constructor ==========
    constructor() {
        _disableInitializers();
    }

    function initialize (
        address _accessManager
    ) external initializer {
        // Run the AccessManaged initializer.
        __AccessManaged_init(
            _accessManager
        );
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override {}

    // ========== Restricted Functions ==========
    function restrictedFunc()
        external
        restricted
    {
        // Emit an event to indicate that the function was called.
        emit RestrictedFuncCalled();
    }
}