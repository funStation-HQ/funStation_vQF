// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { IDistributor } from "../interfaces/IDistributor.sol";
import { Events } from "../libraries/Events.sol";
import { Errors } from "../libraries/Errors.sol";
// Third-party imports
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title Distributor
 * @author API3 Latam.
 *
 * @notice Implementation for the Distributor interface.
 */
contract Distributor is
    ReentrancyGuard,
    IDistributor
{
    // ========== Libraries ==========
    using SafeERC20 for IERC20;
    using Address for address payable;

    // ========== Constructor ==========
    constructor() {}

    // ========== Core Functions ==========
    /**
     * @dev See { IDistributor-distributeNative }.
     * We do not check balance because it could become more
     * expensive to call the function. We rely that the user
     * would attach enough ETH to cover the distribution.
     */
    function distributeNative (
        address payable _sender,
        address payable[] memory _addresses,
        uint256[] memory _amounts
    ) external payable nonReentrant {
        // Check the correctness of the data types
        if (
            _addresses.length != _amounts.length
        ) revert Errors.InvalidArrayLength();
        if (
            _addresses.length == 0
        ) revert Errors.InvalidArrayLength();
        if (
            _sender == address(0)
        ) revert Errors.ZeroAddress();

        uint256 len = _addresses.length;
        uint256 total = 0;

        for(uint256 i = 0; i < len; i++) {
            total += _amounts[i];
            _addresses[i].sendValue(_amounts[i]);
        }

        if (address(this).balance > 0) {
            _sender.sendValue(address(this).balance);
        }

        emit Events.NativeDistributed(
            _sender,
            total
        );
    }

    /**
     * @dev See { IDistributor-distributeTokens }.
     * We do not check balance because it could become very expensive.
     * So we leave the handling of any error to the sender, in
     * addition to the assurance from the SafeERC20 library.
     */
    function distributeTokens (
        IERC20 _token,
        address _sender,
        address[] memory _addresses,
        uint256[] memory _amounts
    ) external nonReentrant {
        // Check the correctness of the data types
        if (
            _addresses.length != _amounts.length
        ) revert Errors.InvalidArrayLength();
        if (
            _addresses.length == 0
        ) revert Errors.InvalidArrayLength();
        if (
            _sender == address(0)
        ) revert Errors.ZeroAddress();

        uint256 len = _addresses.length;
        uint256 total = 0;

        for (uint256 i = 0; i < len; i++) {
            total += _amounts[i];
        }

        // Can revert with: "SafeERC20: ERC20 operation did not succeed"
        _token.safeTransferFrom(_sender, address(this), total);

        for(uint256 i = 0; i < len; i++) {
            _token.safeTransfer(_addresses[i], _amounts[i]);
        }

        emit Events.TokensDistributed(
            _sender,
            address(_token),
            total
        );
    }
}