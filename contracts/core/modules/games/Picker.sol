// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { AccessManaged } from "../acl/AccessManaged.sol";
import { IPickerAirnode } from "../../../interfaces/IPickerAirnode.sol";
import { IPicker } from "../../../interfaces/IPicker.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
// Third party imports
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Picker
 * @author QuantumFair
 * 
 * @notice This is the core contract for the Picker game implementation.
 */
contract Picker is
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessManaged,
    IPicker
{
    using Counters for Counters.Counter;

    // ========== Storage ==========
    // Picker airnode contract address.
    Counters.Counter internal _idCounter;
    address public pickerAirnode;
    mapping (uint256 => bytes32) internal idToRequest;
    mapping (uint256 => address) public idToOwner;
    mapping (address => uint256[]) public ownerToIds;
    mapping (uint256 => DataTypes.PickerResponse) public idToResults;

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev See { IPicker-initialize }.
     */
    function initialize (
        address _accessManager,
        address _pickerAirnode
    ) external initializer {
        // Validate input.
        if (
            _accessManager == address(0) ||
            _pickerAirnode == address(0)
        ) revert Errors.InvalidAddress();
        // Set the airnode contract address.
        pickerAirnode = _pickerAirnode;
        // Initialization chain.
        __AccessManaged_init(
            _accessManager
        );
        __UUPSUpgradeable_init();
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { IPicker-updateAirnode }.
     */
    function updateAirnode (
        address newImplementation
    ) external override restricted {
        pickerAirnode = newImplementation;
    }

    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override restricted {}

    /**
     * @dev See { IPicker-getVersion }.
     */
    function getVersion ()
     external pure override returns (
        uint256 version
    ) {
        return 1;
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IPicker-getOwner }.
     */
    function getOwner (
        uint256 _id
    ) external view override returns (
        address owner
    ) {
        return idToOwner[_id];
    }

    /**
     * @dev See { IPicker-getIds }.
     */
    function getIds (
        address _owner
    ) external view returns (
        uint256[] memory ids
    ) {
        return ownerToIds[_owner];
    }

    /**
     * @dev See { IPicker-getResult }.
     */
    function getResult (
        uint256 _id
    ) external view returns (
        DataTypes.PickerResponse memory result
    ) {
        return idToResults[_id];
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IPicker-newPicker }. 
     */
    function newPicker (
        address _owner,
        uint256 _numberRequested,
        uint256 _numberCap
    ) external override nonReentrant restricted {
        // Validate input.
        if (
            _owner == address(0) ||
            _numberRequested == 0 ||
            _numberCap == 0
        ) revert Errors.InvalidParameter();
        // Create new request.
        bytes32 requestId;
        if (
            _numberRequested == 1
        ) {
            requestId = IPickerAirnode(pickerAirnode).requestNumbers(
                IPickerAirnode.getNumber.selector,
                _numberCap,
                _numberRequested
            );
        } else {
            requestId = IPickerAirnode(pickerAirnode).requestNumbers(
                IPickerAirnode.getMultipleNumbers.selector,
                _numberCap,
                _numberRequested
            );
        }
        // Update storage.
        uint256 gameId = _idCounter.current();
        idToRequest[gameId] = requestId;

        idToOwner[gameId] = _owner;
        ownerToIds[_owner].push(gameId);
        _idCounter.increment();

        // Emit event.
        emit Events.PickerCreated(
            gameId,
            _owner,
            _numberRequested,
            _numberCap
        );
    }

    /**
     * @dev See { IPicker-retrieveResults }.
     */
    function retrieveResults (
        uint256 _id
    ) external override nonReentrant {
        // Validate input.
        if (
            idToOwner[_id] == address(0)
        ) revert Errors.InvalidGameId();
        // Validate access.
        if (
            idToOwner[_id] != msg.sender
        ) revert Errors.InvalidAddress();
        // Validate results.
        if (
            idToResults[_id].delivered == true
        ) revert Errors.ResultRetrieved();
        // Get results from airnode.
        DataTypes.PickerResponse memory result = IPickerAirnode(pickerAirnode).requestResults(
            idToRequest[_id]
        );
        // Update storage.
        idToResults[_id] = result;
        // Emit event.
        emit Events.PickerDelivered(
            _id,
            result.results
        );
    }
}

