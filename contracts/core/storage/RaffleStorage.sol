// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "../../libraries/DataTypes.sol";

/**
 * @title RaffleStorage
 * @author API3 Latam
 *
 * @notice This is an abstract contract that contains the storage layout
 * for the `Raffle` contract.
 * This must be inherited last in order to preserve the storage layout.
 * Adding storage variables should be done solely at the bottom of this contract.
 */
abstract contract RaffleStorage {
    // ========== Raffle State ==========
    uint256 public raffleId;                    // The id of this raffle contract.
    DataTypes.RaffleType public raffleType;     // The type of raffle this contract belongs to.
    address public creatorAddress;              // The address from the creator of the raffle.
    uint256 public winnerNumber;                // The number of winners for this raffle.
    uint256 public startTime;                   // The starting time for the raffle.
    uint256 public expectedEndTime;             // The expected end time for the raffle.
    uint256 public ticketPrice;                 // The price of each ticket.
    uint256 public requiredBalance;             // The required balance for not canceling the raffle.
    DataTypes.RaffleStatus public status;       // The status of the raffle.
    DataTypes.Multihash public metadata;        // The metadata information for this raffle.
    DataTypes.TokenType public currency;        // The currency for this raffle.
    address[] public participants;              // The addresses of the participants.
    uint256 public totalParticipants;           // The total amount of participants for this raffle.
    uint256 public totalEntries;                // The total amount of entries for this raffle.
    address public fairHub;                     // The current address of the FairHub.
    
    // ========== Requester Related ==========
    address public winnerRequester;             // The address of the requester being use.
    bytes32 public requestId;                   // The id for this raffle airnode request.

    // ========== Prizes ==========
    address[] public winners;                   // Winner addresses for this raffle.
    address[] public tokens;                    // Tokens to be set as prize.
    uint256[] public ids;                       // TokenIds to be set as prize.

    // ========== Beneficiaries ==========
    address[] public beneficiaries;             // Beneficiaries addresses for this raffle.
    uint256 internal totalShare;                // Total share of the pool to be shared with the beneficiaries.

    // ========== Vault Related ==========
    uint256 public prizesVaultId;               // Prizes Vault Token Id for ownership validation.
    address public prizesVaultAddress;          // Prizes Vault Token Address.
    uint256 public ticketsVaultId;              // Tickets Vault Token Id for ownership validation.
    address public ticketsVaultAddress;         // Tickets Vault Token Address.
    
    // ========== Mappings ==========
    mapping(address => uint256) public entries;     // Amount of entries for a given user.
    mapping(address => uint256) public shares;      // Amount of shares for a given beneficiary.
    mapping(address => uint256) public payers;      // Amount of tokens payed by players/sponsors.

    address[] payersAddresses;                      // Payer addresses for this raffle.  
}
