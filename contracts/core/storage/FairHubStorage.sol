// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title FairHubStorage
 * @author API3 Latam
 *
 * @notice This is an abstract contract that *only* contains storage for the FairHub contract.
 * This *must* be inherited last in order to preserve the storage layout.
 * Adding storage variables should be done solely at the bottom of this contract.
 */
abstract contract FairHubStorage {
    // ========== Address ==========
    address public raffleBeacon;            // Raffle beacon address.
    address public dApiManagerAddress;      // DApiManager address.
    address public vaultFactoryAdress;      // Current Vault Factory address.
    address public depositRouterAddress;    // Current Vault Deposit Router address.
    address public treasuryAddress;         // Treasury address of the platform.
    address public ownerAddress;            // Owner address of the platform.
    address public winnerAirnodeAddress;    // Airnode address to pick raffle winners.

    // ========== Uint256 ==========
    uint256 public raffleCut;                           // Percentage of the raffle cut.
    uint256 public cancelationFee;                      // The fee to be charged for canceling the raffle.
    uint256 public yoloRaffleCut;                       // Percentage of the yolo raffle cut.
    uint256 public yoloRoundDuration;                   // Duration of each round for a Yolo Raffle.
    Counters.Counter internal _raffleCounter;           // Individual Raffle identifier.
    Counters.Counter internal _yoloRaffleCounter;       // Individual Yolo Raffle identifier.

    // Mapping of raffle id with its contract
    mapping(uint256 => address) public raffles;
    // Mapping of owner addresses with its owned raffle ids.
    mapping(address => uint256[]) public ownedRaffles;
    // Mapping of ERC20 tokens with its raffles and yolo raffles.
    mapping(address => address) public tokenRaffles;
    // Mapping of yolo raffle id with its contract.
    mapping(uint256 => address) public yoloRaffles;
    // Mapping of owner addresses with its owned yolo raffle ids.
    mapping(address => uint256[]) public ownedYoloRaffles;

    // Added storage variables should strictly be appended below this line.
}
