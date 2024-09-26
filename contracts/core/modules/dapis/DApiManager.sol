// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports.
import { IDApiManager } from "../../../interfaces/IDApiManager.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
// Third party imports.
import "@api3/contracts/v0.8/interfaces/IProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DApiManager.
 * @author API3 Latam.
 * 
 * @notice Implementation for DApiManager interface.
 */
contract DApiManager is
    UUPSUpgradeable,
    OwnableUpgradeable,
    IDApiManager
{
    // ========== Storage ==========
    // Mapping of token address to dApi address.
    mapping(address => address) public tokenToAddress;

    // ========== Modifiers ==========
    /**
     * @dev Modifier to check if requested dApi is registered.
     */
    modifier dApiRegistered (
        address tokenAddress
    ) {
        if (
            tokenToAddress[tokenAddress] == address(0)
        ) revert Errors.DApiNotRegistered();
        _;
    }

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializer for the logic contract trough the UUPS Proxy.
     */
    function initialize ()
     external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override onlyOwner {}

    /**
     * @dev See { IDApiManager-getVersion }.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    ) {
        return 1;
    }

    // ========== Internal Functions ==========
    /**
     * @notice Read a dAPI via its proxy contract.
     * 
     * @param _dappiAddress Address of the dAPI proxy contract.
     * 
     * @return castedValue Value read from the dAPI.
     */
    function _readProxy (
        address _dappiAddress
    ) internal view returns (
        uint256 castedValue
    ) {
        // Use the IProxy interface to read a dAPI via its proxy contract.
        (int224 value,) = IProxy(_dappiAddress).read();
        // Cast to uint256.
        if (
            value < 0
        ) revert Errors.CannotCastUint();
        castedValue = uint256(
            int256(
                value
            )
        );
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IDApiManager-setDApi }.
     */
    function setDApi (
        address _tokenAddres,
        address _dApiAddress
    ) external onlyOwner {
        // Parameter validation.
        if (
            _tokenAddres == address(0) || 
            _dApiAddress == address(0)
        ) revert Errors.ZeroAddress();
        if (
            tokenToAddress[_tokenAddres] == _dApiAddress
        ) revert Errors.ParameterAlreadySet();
        // Set dApi address.
        tokenToAddress[_tokenAddres] = _dApiAddress;
        // Emit event.
        emit Events.DApiRegistered(
            _tokenAddres,
            _dApiAddress
        );
    }

    /**
     * @dev See { IDApiManager-getDApi }.
     */
    function getDApi (
        address _tokenAddress
    ) public view returns (
        address dApiAddress
    ) {
        // Parameter validation.
        if (
            _tokenAddress == address(0)
        ) revert Errors.ZeroAddress();
        if (
            tokenToAddress[_tokenAddress] == address(0)
        ) revert Errors.DApiNotRegistered();
        // Return dApi address.
        return tokenToAddress[_tokenAddress];
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IDApiManager-readDApi }.
     */
    function readDApi (
        address _tokenAddress
    ) external view dApiRegistered(
        _tokenAddress
    ) returns (
        uint256 data
    ) {
        // Retrieve the dApi address.
        address dApiAddress = getDApi(
            _tokenAddress
        );
        // Read data from dApi.
        data = _readProxy(
            dApiAddress
        );
    }
}