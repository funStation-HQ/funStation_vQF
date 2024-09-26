// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title IAccessManaged.
 * @author API3 Latam.
 * 
 * @notice Entity contract with utilities for providing ACL access
 * for third contracts via the Access Manager settings.
 * 
 * This contract is based from the OpenZeppelin v5.0.0 contracts.
 * You can found it at this URL:
 * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.1/contracts/access/manager/IAccessManaged.sol
 */
interface IAccessManaged {
    // ========== Get/Set Functions ==========
    /**
     * @notice Returns the current authority.
     * 
     * @return _authority Current authority address.
     */
    function getAuthority ()
     external view returns (
        address _authority
    );

    /**
     * @notice Transfers control to a new authority.
     * @dev The caller must be the current authority.
     * 
     * @param newAuthority New authority address.
     */
    function setAuthority (
        address newAuthority
    ) external;
}