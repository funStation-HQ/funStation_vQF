// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title DataTypes
 * @author API3 Latam
 * 
 * @notice A standard library of data types used across the API3 LATAM
 * Quantum Fair Platform.
 */
library DataTypes {
    
    // ========== Enums ==========
    /**
     * @notice An enum containing the different states a raffle can use.
     *
     * @param Unintialized - A raffle is created but yet to be open.
     * @param Canceled - A raffle that is invalidated.
     * @param Open - A raffle where participants can enter.
     * @param Close - A raffle which cannot recieve more participants.
     * @param Finish - A raffle that has been wrapped up.
     */
    enum RaffleStatus {
        Unintialized,
        Canceled,
        Open,
        Close,
        Finish
    }

    /**
     * @notice An enum for indicating the type of raffle.
     * 
     * @param Traditional - A traditional raffle.
     * @param Yolo - A Yolo raffle.
     */
    enum RaffleType {
        Traditional,
        Yolo
    }

    /**
     * @notice An enum containing the different states a raffle can use
     * for cancelation.
     *
     * @param ForcedCancelation - A raffle is canceled by the system due to a major force reason.
     * @param CreatorDecision - A raffle is canceled by the creator of its own volition.
     */
    enum CancelationReason {
        ForcedCancelation,
        CreatorDecision
    }

    /**
     * @notice An enum containing the different tokens that a Vault can hold.
     *
     * @param Native - The native token of the network, eg. ETH or MATIC.
     * @param ERC20 - An ERC20 token.
     * @param ERC721 - An NFT.
     * @param ERC1155 - An ERC1155 token.
     * @param dApi - A dApi token.
     */
    enum TokenType {
        Native,
        ERC20,
        ERC721,
        ERC1155,
        dApi
    }

    // ========== Structs ==========
    /**
     * @notice Structure to efficiently save IPFS hashes.
     * @dev To reconstruct full hash insert `hash_function` and `size` before the
     * the `hash` value. So you have `hash_function` + `size` + `hash`.
     * This gives you a hexadecimal representation of the CIDs. You need to parse
     * it to base58 from hex if you want to use it on a traditional IPFS gateway.
     *
     * @param hash - The hexadecimal representation of the CID payload from the hash.
     * @param hash_function - The hexadecimal representation of multihash identifier.
     * IPFS currently defaults to use `sha2` which equals to `0x12`.
     * @param size - The hexadecimal representation of `hash` bytes size.
     * Expecting value of `32` as default which equals to `0x20`. 
     */
    struct Multihash {
        bytes32 hash;
        uint8 hash_function;
        uint8 size;
    }

    /**
     * @notice Information for Airnode endpoints.
     *
     * @param endpointId - The unique identifier for the endpoint this
     * callbacks points to.
     * @param functionSelector - The function selector for this endpoint
     * callback.
     */
    struct Endpoint {
        bytes32 endpointId;
        bytes4 functionSelector;
    }

    /**
     * @notice Metadata information for WinnerAirnode request flow.
     * @dev This should be consume by used in addition to IndividualRaffle struct
     * to return actual winner addresses.
     *
     * @param totalEntries - The number of participants for this raffle.
     * @param totalWinners - The number of winners finally set for this raffle.
     * @param winnerIndexes - The indexes for the winners from raffle entries.
     * @param isFinished - Indicates wether the result has been retrieved or not.
     */
    struct WinnerReponse {
        uint256 totalEntries;
        uint256 totalWinners;
        uint256[] winnerIndexes;
        bool isFinished;
    }

    /**
     * @notice Metadata information for PickerAirnode request flow.
     * 
     * @param numberCap - The maximum number that can be picked.
     * @param numberRequested - The number of picks requested.
     * @param results - The results of the picks.
     * @param delivered - Indicates wether the result has been retrieved or not.
     */
    struct PickerResponse {
        uint256 numberCap;
        uint256 numberRequested;
        uint256[] results;
        bool delivered;
    }

    /**
     * @notice Structure to keep track of tokens kept in vaults.
     * @dev Some fields could be ignored depending on the type of token.
     * Eg. tokenId is of no use for ERC20 tokens.
     */
    struct TokenInventory {
        address tokenAddress;
        uint256 tokenId;
        uint256 tokenAmount;
    }

    /**
     * @notice Structure that stores the details for a target contract.
     * @dev This is used to keep track of the roles that are allowed to call
     * the target contract.
     * 
     * @param allowedRoles - A mapping of function selectors to a roleId.
     * @param closed - Indicates wether the target contract is available for being called or not.
     */
    struct TargetConfig {
        mapping(bytes4 => uint64) allowedRoles;
        bool closed;
    }

    /**
     * @notice Structure that stores the details for a role.
     * @dev This is used to keep track of the members of a role and the admin
     * that can grant or revoke permissions.
     * 
     * @param members - A mapping of addresses to the time at which the role was granted.
     * @param admin - The address of the admin that can grant or revoke permissions.
     */
    struct Role {
        mapping(address => uint256) members;
        uint64 admin;
    }
}
