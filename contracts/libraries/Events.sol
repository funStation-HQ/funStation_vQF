// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "./DataTypes.sol";

/**
 * @title Events
 * @author API3 Latam
 * 
 * @notice A standard library of Events used across the API3 LATAM
 * Quantum Fair Platform.
 */
library Events {
    // ========== Core Events ==========
    /**
     * @dev Emitted when Distributor send native tokens.
     *
     * @param sender_ - The address of the sender.
     * @param total_ - The total amount of tokens sent.
     */
    event NativeDistributed (
        address indexed sender_,
        uint256 total_
    );

    /**
     * @dev Emitted when Distributor send ERC20 tokens.
     *
     * @param sender_ - The address of the sender.
     * @param token_ - The address of the token being distributed.
     * @param total_ - The total amount of tokens sent.
     */
    event TokensDistributed (
        address indexed sender_,
        address indexed token_,
        uint256 total_
    );

    // ========== Base Events ==========
    /**
     * @dev Emitted when we set the parameters for the airnode.
     *
     * @param airnodeAddress_ - The Airnode address being use.
     * @param derivedAddress_ - The derived address for the airnode-sponsor.
     * @param sponsorAddress_ - The actual sponsor wallet address.
     */
    event SetRequestParameters (
        address airnodeAddress_,
        address derivedAddress_,
        address sponsorAddress_
    );

    /**
     * @dev Emitted when a new Endpoint is added to an AirnodeLogic instance.
     *
     * @param index_ - The current index for the recently added endpoint in the array.
     * @param newEndpointId_ - The given endpointId for the addition.
     * @param endpointFunction_ - The function signature for the given endpoint of this addition.
     * @param newEndpointSelector_ - The selector for the given endpoint of this addition.
     */
    event SetAirnodeEndpoint (
        uint256 index_,
        bytes32 newEndpointId_,
        string endpointFunction_,
        bytes4 newEndpointSelector_
    );

    /**
     * @dev Emitted when balance is withdraw from requester.
     *
     * @param requester_ - The address of the requester contract.
     * @param recipient_ - The address of the recipient.
     * @param amount_ - The amount of tokens being transfered.
     */
    event SponsorWithdraw (
        address indexed requester_,
        address indexed recipient_,
        uint256 indexed amount_
    );

    // ========== Games Module Events ==========
    /**
     * @dev Emitted when (a) beneficiarie(s) is/are added to a Raffle.
     *
     * @param beneficiaries_ The address(es) of the beneficiarie(s).
     * @param shares_ The share(s) of the beneficiarie(s).
     * @param raffleId_ The identifier for the raffle.
     * @param raffleType_ The type of raffle.
     */
    event SetRaffleBeneficiaries (
        address[] beneficiaries_,
        uint256[] shares_,
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_
    );

    /**
     * @dev Emitted when a beneficiary is updated.
     *
     * @param beneficiary_ The address of the beneficiary.
     * @param oldShare_ The old share of the beneficiary.
     * @param newShare_ The new share of the beneficiary.
     * @param raffleId_ The identifier for the raffle.
     * @param raffleType_ The type of raffle.
     */
    event UpdateRaffleBeneficiary (
        address beneficiary_,
        uint256 oldShare_,
        uint256 newShare_,
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_
    );

    /**
     * @dev Emitted when a Raffle is created.
     * 
     * @param raffleId_ - The identifier for the new raffle.
     * @param raffleAddress_ - The newly created address for the raffle contract.
     * @param raffleType_ - The type of raffle being created.
     */
    event RaffleCreated (
        uint256 indexed raffleId_,
        address indexed raffleAddress_,
        DataTypes.RaffleType indexed raffleType_
    );

    /**
     * @dev Emitted when a Raffle is opened.
     *
     * @param raffleId_ - The identifier for the raffle.
     * @param raffleType_ - The type of raffle being opened.
     * @param prizeVaultAddress_ - The id of the prize vault associated with this raffle.
     * @param ticketVaultAddress_ - The id of the ticket vault associated with this raffle.
     * @param nftAmount_ - The amount of NFTs to be raffled.
     */
    event RaffleOpened (
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_,
        address prizeVaultAddress_,
        address ticketVaultAddress_,
        uint256 nftAmount_
    );

    /**
     * @dev Emitted when someone buys a ticket for a raffle.
     * 
     * @param raffleId_ - The identifier for the raffle.
     * @param raffleType_ - The type of raffle being entered.
     * @param participant_ - The address of the participant.
     * @param amount_ - The amount of tickets bought.
     */
    event RaffleEntered (
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_,
        address indexed participant_,
        uint256 amount_
    );

    /**
     * @dev Emitted when a Raffle is closed.
     *
     * @param raffleId_ - The identifier for the raffle.
     * * @param raffleType_ - The type of raffle being closed.
     * @param requestId_ - The id for the raffle airnode request.
     */
    event RaffleClosed (
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_,
        bytes32 requestId_
    );

    /**
     * @dev Emitted when the winners are set from the QRNG provided data.
     *
     * @param raffleId_ - The identifier for this specific raffle.
     * @param raffleType_ - The type of raffle being finished.
     * @param winnerIndexes_ - The index(es) of the winner(s).
     * @param raffleWinners_ - The winner address list for this raffle.
     * @param ownerCut_ - The pool amount to be shared between beneficiaries and/or owner.
     * @param treasuryCut_ - The pool amount to be sent to the treasury.
     */
    event RaffleFinished (
        uint256 indexed raffleId_,
        DataTypes.RaffleType indexed raffleType_,
        uint256[] winnerIndexes_,
        address[] raffleWinners_,
        uint256 ownerCut_,
        uint256 treasuryCut_
    );

    /**
     * @dev Emitted when a Raffle is canceled.
     * 
     * @param raffleId_ - The identifier for this specific raffle.
     * @param raffleType_ - The type of raffle being canceled.
     * @param reason_ - The reason for the cancelation.
     */
    event RaffleCanceled (
        uint256 indexed raffleId_,
        DataTypes.RaffleType raffleType_,
        DataTypes.CancelationReason reason_
    );

    /**
     * @dev Emitted when a new Picker is requested.
     * 
     * @param pickerId_ The id of the new picker.
     * @param owner_ The address of the picker owner.
     * @param numberRequested_  The number of numbers requested.
     * @param numberCap_  The cap for the numbers.
     */
    event PickerCreated (
        uint256 indexed pickerId_,
        address indexed owner_,
        uint256 numberRequested_,
        uint256 numberCap_
    );

    /**
     * @dev Emitted when a Picker is closed.
     * 
     * @param pickerId_ The id of the picker.
     * @param winnerNumbers_ The numbers picked by the picker.
     */
    event PickerDelivered (
        uint256 indexed pickerId_,
        uint256[] winnerNumbers_
    );

    // ========== Airnode Module Events ==========
    /**
     * @dev Should be emitted when a request to WinnerAirnode is done.
     *
     * @param requestId_ - The request id which this event is related to.
     * @param airnodeAddress_ - The airnode address to which this request is made.
     */
    event NewWinnerRequest (
        bytes32 indexed requestId_,
        address indexed airnodeAddress_
    );

    /**
     * @dev Should be emitted when a response is requested from WinnerAirnode.
     *
     * @param requestId_ - The request id from which this event was emitted.
     * @param qrngResponse_ - The oracle results from the request.
     */
    event WinnerResponse (
        bytes32 indexed requestId_,
        uint256[] qrngResponse_
    );

    /**
     * @dev Should be emitted when a request to PickerAirnode is done.
     * 
     * @param requestId_  The request id which this event is related to.
     * @param airnodeAddress_ The airnode address to which this request is made.
     */
    event NewPickerRequest (
        bytes32 indexed requestId_,
        address indexed airnodeAddress_
    );

    /**
     * @dev Should be emitted when a response is requested from PickerAirnode.
     *
     * @param requestId_ - The request id from which this event was emitted.
     * @param qrngResponse_ - The oracle results from the request.
     */
    event PickerResponse (
        bytes32 indexed requestId_,
        uint256[] qrngResponse_
    );

    // ========== ACL Module Events ==========
    /**
     * @dev Should be emitted When the ACL Manager contract address is updated.
     * 
     * @param authority - The new ACL Manager contract address.
     */
    event AuthorityUpdated (
        address authority
    );

    /**
     * @dev Should be emitted when a target function role is set.
     * 
     * @param target - The address of the target contract.
     * @param functionSelector - The function selector for the target function.
     * @param roleId - The role id for the target function.
     */
    event TargetFunctionRoleUpdated (
        address indexed target,
        bytes4 indexed functionSelector,
        uint64 indexed roleId
    );

    /**
     * @dev Should be emitted when a target contract is closed.
     * 
     * @param target - The address of the target contract.
     * @param closed - The value closed state is being updated to.
     */
    event TargetClosed (
        address indexed target,
        bool closed
    );

    /**
     * @dev Should be emitted when AccessManager grants a new role.
     * 
     * @param role The role being granted.
     * @param account The address being granted the role.
     */
    event RoleGranted (
        uint64 indexed role,
        address indexed account
    );

    /**
     * @dev Should be emitted when AccessManager revokes a role.
     * 
     * @param role The role being revoked.
     * @param account The address being revoked the role.
     */
    event RoleRevoked (
        uint64 indexed role,
        address indexed account
    );

    /**
     * @dev Should be emitted when AccessManager updates a role admin.
     * 
     * @param role The role being updated.
     * @param previousAdminRole The previous admin role.
     * @param newAdminRole The new admin role.
     */
    event RoleAdminChanged (
        uint64 indexed role,
        uint64 indexed previousAdminRole,
        uint64 indexed newAdminRole
    );

    // ========== dApis Module Events ==========
    /**
     * @dev Should be emitted when a dApi is registered.
     *
     * @param tokenAddress_ The address of the token this dApi maps to.
     * @param dApiAddress_ The address of the dApi.
     */
    event DApiRegistered (
        address indexed tokenAddress_,
        address indexed dApiAddress_
    );

    // ========== Vault Module Events ==========
    /**
     * @dev Should be emitted when a vault ownership changes.
     *
     * @param oldOwner_ The address of the old owner.
     * @param newOwner_ The address of the new owner.
     */
    event OwnerChanged (
        address indexed oldOwner_,
        address indexed newOwner_
    );

    /**
     * @dev Should be emitted when withdrawals are enabled on a vault.
     *
     * @param emitter_ The address of the vault owner.
     */
    event WithdrawEnabled (
        address emitter_
    );

    /**
     * @dev Should be emitted when a vault is approved for token transfers.
     *
     * @param approver_ The address of the vault owner.
     * @param vault_ The address of the vault.
     * @param to_ The address of the spender.
     * @param amount_ The amount of tokens being approved.
     */
    event ApprovedVault (
        address indexed approver_,
        address indexed vault_,
        address indexed to_, 
        uint256 amount_
    );
    
    /**
     * @dev Should be emitted when the balance of ERC721s is withdraw
     * from a vault.
     *
     * @param emitter_ The address of the vault owner.
     * @param recipient_ The end user to recieve the assets.
     * @param tokenContract_ The addresses of the assets being transfered.
     * @param tokenId_ The id of the token being transfered.
     */
    event WithdrawERC721 (
        address indexed emitter_,
        address indexed recipient_,
        address indexed tokenContract_,
        uint256 tokenId_
    );

    /**
     * @dev Should be emitted when the balance of ERC20s is withdraw.
     *
     * @param emitter_ The address of the vault.
     * @param recipient_ The end user to recieve the assets.
     * @param amount_ The amount of the token being transfered.
     */
    event WithdrawNative (
        address indexed emitter_,
        address indexed recipient_,
        uint256 amount_
    );

    /**
     * @dev Should be emitted when the balance of ERC20s is withdraw.
     *
     * @param emitter_ The address of the vault.
     * @param token_ The address of the token being transfered.
     * @param recipient_ The end user to recieve the assets.
     * @param amount_ The amount of the token being transfered.
     */
    event WithdrawERC20 (
        address indexed emitter_,
        address indexed token_,
        address indexed recipient_,
        uint256 amount_
    );

    /**
     * @dev Should be emitted when router deposits native tokens to a vault.
     *
     * @param emitter_ The address of the sender.
     * @param recipient_ The address of the vault to recieve the funds.
     * @param amount_ The amount of the token being transfered.
     */
    event DepositNative (
        address indexed emitter_,
        address indexed recipient_,
        uint256 amount_
    );

    /**
     * @dev Should be emitted when router deposits NFTs to a vault.
     *
     * @param emitter_ The address of the sender.
     * @param recipient_ The address of the vault to recieve the funds.
     * @param tokenAddresses_ The addresses of the ERC721 token(s).
     * @param tokenIds_ The id of the token(s) being transfered.
     */
    event DepositERC721 (
        address indexed emitter_,
        address indexed recipient_,
        address[] tokenAddresses_,
        uint256[] tokenIds_
    );

    /**
     * @dev Should be emitted when router deposits ERC20s to a vault.
     * 
     * @param emitter_ The address of the sender.
     * @param recipient_ The address of the vault to recieve the funds.
     * @param token_ The address of the token being transfered.
     * @param amount_ The amount of the token being transfered.
     */
    event DepositERC20 (
        address indexed emitter_,
        address indexed recipient_,
        address indexed token_,
        uint256 amount_
    );

    /**
     * @dev Should be emitted when factory creates a new vault clone.
     *
     * @param id_ The id of the new vault.
     * @param vault_ The address of the new vault.
     * @param to_ The new owner of the vault.
     */
    event VaultCreated (
        uint256 indexed id_,
        address vault_,
        address indexed to_
    );
}
