// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from '../libraries/DataTypes.sol';

/**
 * @title IRaffle
 * @author API3 Latam
 *
 * @notice This is the interface for the Raffle contract,
 * which is initialized everytime a new raffle is requested.
 */
interface IRaffle {
  // ================ Initialize ================
  /**
   * @notice Initializer function for proxy pattern.
   * @dev This replaces the constructor so we can utilize it on every new proxy.
   * NOTE: This is set to be initialized/parametrized trough the FairHub.
   *
   * @param _creatorAddress The raffle creator.
   * @param _raffleId The id for this raffle.
   * @param _raffleType The type of this raffle.
   * @param _startTime The starting time for the raffle.
   * @param _expectedEndTime The expected end time for the raffle.
   * @param _winnerNumber The initial number to set as total winners.
   * @param _ticketPrice The ticket price to charge on native tokens for each unique entry per participant.
   * @param _requiredBalance The required balance for not canceling the raffle.
   * @param _metadata The `Multihash` struct information for this raffle metadata.
   * @param _currency The `RaffleCurrency` struct information for this raffle.
   * @param _fairHub The current address of the FairHub.
   */
  function initialize (
    address _creatorAddress,
    uint256 _raffleId,
    DataTypes.RaffleType _raffleType,
    uint256 _startTime,
    uint256 _expectedEndTime,
    uint256 _winnerNumber,
    uint256 _ticketPrice,
    uint256 _requiredBalance,
    DataTypes.Multihash memory _metadata,
    DataTypes.TokenType _currency,
    address _fairHub
  ) external;

  // ========== Core Functions ==========
  /**
   * @notice Opens a raffle to the public,
   * and safekeeps the assets in the corresponding vaults.
   * @dev `_tokens`, `_ids` and `winnerNumber` should match.
   *
   * @param _tokens The tokens addresses to use for prizes.
   * @param _ids The id for the respective address in the array of `_tokens`.
   */
  function open (
    address[] memory _tokens,
    uint256[] memory _ids
  ) external;

  /**
    * @notice Enter the raffle.
    * @dev Verified wether raffle is Open and on time.
    * Sponsorship will be always included even when same person
    * pays for itself.
    *
    * @param _participantAddress The participant address.
    * @param _amount The amount of tickets to buy.
    */
  function enter (
      address _participantAddress,
      uint256 _amount
  ) external payable;

  /**
    * @notice Closes the ongoing raffle.
    * @dev Called by the owner when the raffle is over.
    * This function stops new entries from registering and will
    * call a QRNG requester.
    */
  function close () external;

  /**
    * @notice Wrap ups a closed raffle.
    * @dev This function updates the winners as result from calling the airnode,
    * and distribute the prizes.
    */
  function finish () external;

  /**
   * @notice Cancels a raffle by the owner.
   * @dev Only allow cancelations prior to closing a Raffle.
   * If Raffle is not open yet, cancelationFee is not apply.
   */
  function cancel () external payable;

  /**
   * @notice Forces the raffle to be reverted.
   * @dev This function is called by the owner when the raffle is not
   * finished and has already been open.
   */
  function forceRecover () external;

  // ========== Get/Set Functions ==========
  /**
    * @notice Set address for winnerRequester.
    */
  function setRequester ()
   external;

  /**
    * @notice Update the set number of winners.
    *
    * @param _winnerNumbers The new number of winners for this raffle.
    */
  function updateWinners(
    uint256 _winnerNumbers
  ) external;

  /**
    * @notice Update the metadata for the raffle.
    *
    * @param _metadata The new metadata struct.
    */
  function updateMetadata(
    DataTypes.Multihash memory _metadata
  ) external;

  /**
   * @notice Set the beneficiaries for this raffle.
   * 
   * @param _beneficiaries The addresses of the beneficiaries.
   * @param _shares The shares for each beneficiary.
   */
  function setBeneficiaries (
    address[] memory _beneficiaries,
    uint256[] memory _shares
  ) external;

  /**
   * @notice Update a given beneficiary share.
   *
   * @param _beneficiary The address of the beneficiary.
   * @param _share The new share for the beneficiary.
   */
  function updateBeneficiary (
    address _beneficiary,
    uint256 _share
  ) external;

  // ========== Upgradability ==========
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
}
