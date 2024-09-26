// SPDX-License-Identifier: MIT

// Package imports
import { DataTypes } from "../libraries/DataTypes.sol";

pragma solidity ^0.8.15;

interface IPicker {
    // ========== Upgrade Functions ==========
    /**
     * @notice Update the airnode contract to a new implementation.
     * 
     * @param newImplementation The new implementation to upgrade to.
     */
    function updateAirnode (
        address newImplementation
    ) external;

    /**
     * @notice Get the current version of the contract.
     * 
     * @return version The current version of the contract.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    );

    // ========== Get/Set Functions ==========
    /**
     * @notice Get the owner of a given id.
     * 
     * @param _id The id to get the owner of.
     */
    function getOwner (
        uint256 _id
    ) external view returns (
        address owner
    );

    /**
     * @notice Get the ids of a given owner.
     * 
     * @param _owner The owner to get the ids of.
     */
    function getIds (
        address _owner
    ) external view returns (
        uint256[] memory ids
    );

    /**
     * @notice Get the result of a given id.
     * 
     * @param _id The id to get the result of.
     */
    function getResult (
        uint256 _id
    ) external view returns (
        DataTypes.PickerResponse memory result
    );

    // ========== Core Functions ==========
    /**
     * @notice Create a new picker.
     * @dev Funcion restricted by AccessManager.
     * 
     * @param _owner The owner of the picker.
     * @param _numberRequested The total amount of number to retrieve.
     * @param _numberCap The cap to use for the number results.
     */
    function newPicker (
        address _owner,
        uint256 _numberRequested,
        uint256 _numberCap
    ) external;

    /**
     * @notice Request numbers from the airnode.
     * 
     * @param _id The id of the picker to request numbers from.
     */
    function retrieveResults (
        uint256 _id
    ) external;
}