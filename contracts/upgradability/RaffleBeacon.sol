// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

/**
 * @title RaffleBeacon
 * @author API3 Latam
 *
 * @notice Beacon to be used as reference for beacon proxies 
 * when creating a raffle from hub.
 * @dev It should point to the latest raffle implementation.
 */
contract RaffleBeacon is UpgradeableBeacon {

    constructor (
        address _initialImplementation
    ) UpgradeableBeacon (
        _initialImplementation
    ) {}

}
