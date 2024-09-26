// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title IDApiManager
 * @author API3 Latam
 * 
 * @notice This is the interface for the DappiManager contract,
 * which is utilized for managing the reading from dAppis.
 * 
 * More information can be found on the API3 docs:
 * https://docs.api3.org/reference/dapis/understand/
 */
interface IDApiManager {
    // ========== Upgrade Functions ==========
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
     * @notice Sets the address of a dApi.
     * @dev Only callable by the owner of the contract.
     * 
     * @param _tokenAddress The address of the token this dApi maps to.
     * @param _dApiAddress The address of the dApi.
     */
    function setDApi (
        address _tokenAddress,
        address _dApiAddress
    ) external;

    /**
     * @notice Gets the address of a dAppi.
     * 
     * @param _tokenAddress The address of the token mapped to the dApi.
     */
    function getDApi (
        address _tokenAddress
    ) external view returns (
        address dApiAddress
    );

    // ========== Core Functions ==========
    /**
     * @notice Reads data from a dApi.
     * 
     * @param _tokenAddress The address of the token mapped to the dApi.
     */
    function readDApi (
        address _tokenAddress
    ) external view returns (
        uint256 data
    );
}