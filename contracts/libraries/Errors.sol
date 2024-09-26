// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title Errors
 * @author API3 Latam
 * 
 * @notice A standard library of error types used across the API3 LATAM
 * Quantum Fair Platform.
 */
library Errors {

    // ========== Core Errors ==========
    error SameValueProvided ();
    error AlreadyInitialized ();
    error InvalidProxyAddress (
        address _proxy
    );
    error ZeroAddress ();
    error WrongInitializationParams (
        string errorMessage
    );
    error InvalidParameter ();
    error InvalidAddress ();
    error InvalidAmount ();
    error ParameterNotSet ();
    error InvalidArrayLength ();
    error InsufficientBalance();
    error InsufficientBalanceOrAllowance ();
    error ParameterAlreadySet ();
    error FailedExecution ();
    error InvalidCurrency ();

    // ========== Base Errors ==========
    error CallerNotOwner (               // Ownable ERC721
        address caller
    );
    error RequestIdNotKnown ();          // AirnodeLogic
    error NoEndpointAdded ();            // AirnodeLogic
    error InvalidEndpointId ();          // AirnodeLogic
    error IncorrectCallback ();          // AirnodeLogic
    error RequestNotFulfilled ();        // AirnodeLogic
    error EndpointAlreadyExists ();      // AirnodeLogic
    error InvalidInterface ();           // ERC1820Registry
    error InvalidKey ();                 // EternalStorage
    error ValueAlreadyExists ();         // EternalStorage

    // ========== Games Module Errors ==========
    error InvalidDApiPrice ();          // Raffle
    error RaffleDue ();                 // Raffle
    error RaffleNotOpen ();             // Raffle
    error RaffleNotAvailable ();        // Raffle
    error RaffleNotClose ();            // Raffle
    error RaffleAlreadyOpen ();         // Raffle
    error RaffleAlreadyFinished ();     // Raffle
    error TicketPaymentFailed ();       // Raffle
    error EarlyClosing ();              // Raffle
    error InvalidVaultBalance ();       // Raffle
    error InvalidGameId ();             // Picker

    // ========== Airnode Module Errors ==========
    error InvalidWinnerNumber ();        // WinnerAirnode
    error ResultRetrieved ();            // WinnerAirnode

    // ========== ACL Module Errors ==========
    error AccessManagedUnauthorized (       // AccessManaged
        address caller
    );
    error AccessManagedInvalidAuthority (   // AccessManaged
        address authority
    );
    error InvalidRole ();                   // AccessManager
    error RoleAlreadyGranted ();            // AccessManager
    error AccessManagerUnauthorized (       // AccessManager
        address caller
    );

    // ========== dApis Module Errors ==========
    error DApiNotRegistered ();          // DApiManager
    error CannotCastUint();              // DApiManager

    // ========== Vault Module Errors ==========
    error OwnerAlreadyChanged ();        // AssetVault
    error VaultWithdrawsDisabled ();     // AssetVault
    error VaultWithdrawsEnabled ();      // AssetVault
    error TokenIdOutOfBounds (           // VaultFactory
        uint256 tokenId
    );
    error NoTransferWithdrawEnabled (    // VaultFactory
        uint256 tokenId
    );
    error BatchLengthMismatch();         // VaultDepositRouter
}
