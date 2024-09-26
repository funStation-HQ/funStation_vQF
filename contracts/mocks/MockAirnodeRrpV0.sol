// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import { IAirnodeRrpV0 } from "@api3/airnode-protocol/contracts/rrp/interfaces/IAirnodeRrpV0.sol";

/**
 * @title MockAirnodeRrpV0.sol
 * @author API3 Latam
 *
 * @notice This is a modified version from the original API3 Dao implementation
 * build for testing purposes. For the actual contract please refer to their repository.
 * https://github.com/api3dao/airnode/blob/master/packages/airnode-protocol/contracts/rrp/AirnodeRrpV0.sol
 * @dev This is not a contract ready for production. 
 * All the security checks have been removed. 
 */
contract MockAirnodeRrpV0 is IAirnodeRrpV0 {

    mapping(bytes32 => bytes32) private requestIdToFulfillmentParameters;

    function makeFullRequest (
        address airnode,
        bytes32 endpointId,
        address sponsor,
        address sponsorWallet,
        address fulfillAddress,
        bytes4 fulfillFunctionId,
        bytes calldata parameters
    ) external override returns (
        bytes32 requestId
    ) {

        requestId = keccak256(
            abi.encodePacked(
                address(this),
                msg.sender,
                airnode,
                endpointId,
                sponsor,
                sponsorWallet,
                fulfillAddress,
                fulfillFunctionId,
                parameters
            )
        );
        requestIdToFulfillmentParameters[requestId] = keccak256(
            abi.encodePacked(
                airnode,
                fulfillAddress,
                fulfillFunctionId
            )
        );
    }

    function fulfill (
        bytes32 requestId,
        address airnode,
        address fulfillAddress,
        bytes4 fulfillFunctionId,
        bytes calldata data,
        bytes calldata signature
    ) external override returns (
        bool callSuccess,
        bytes memory callData
    ) {
        require(
            keccak256(
                abi.encodePacked(
                    airnode,
                    fulfillAddress,
                    fulfillFunctionId
                )
            ) == requestIdToFulfillmentParameters[requestId],
            "Invalid request fulfillment"
        );

        delete requestIdToFulfillmentParameters[requestId];
        (callSuccess, callData) = fulfillAddress.call(
            abi.encodeWithSelector(
                fulfillFunctionId,
                requestId,
                data
            )
        );

        emit FulfilledRequest(
            airnode,
            requestId,
            data
        );
    }

    function fail (
        bytes32 requestId,
        address airnode,
        address fulfillAddress,
        bytes4 fulfillFunctionId,
        string calldata errorMessage
    ) external {
        require(
            keccak256(
                abi.encodePacked(
                    airnode,
                    msg.sender,
                    fulfillAddress,
                    fulfillFunctionId
                )
            ) == requestIdToFulfillmentParameters[requestId],
            "Invalid request fulfillment"
        );
        delete requestIdToFulfillmentParameters[requestId];
    }

    function setSponsorshipStatus (
        address requester,
        bool sponsorshipStatus
    ) external virtual {}

    function makeTemplateRequest (
        bytes32 templateId,
        address sponsor,
        address sponsorWallet,
        address fulfillAddress,
        bytes4 fulfillFunctionId,
        bytes calldata parameters
    ) external virtual returns (
        bytes32 requestId
    ) {}

    function sponsorToRequesterToSponsorshipStatus (
        address sponsor,
        address requester
    ) external view virtual returns (
        bool sponsorshipStatus
    ) {}

    function requesterToRequestCountPlusOne (
        address requester
    ) external view virtual returns (
        uint256 requestCountPlusOne
    ) {}

    function requestIsAwaitingFulfillment (
        bytes32 requestId
    ) external view virtual returns (
        bool isAwaitingFulfillment
    ) {}

    function checkAuthorizationStatus (
        address[] calldata authorizers,
        address airnode,
        bytes32 requestId,
        bytes32 endpointId,
        address sponsor,
        address requester
    ) external view virtual returns (
        bool status
    ) {}

    function checkAuthorizationStatuses (
        address[] calldata authorizers,
        address airnode,
        bytes32[] calldata requestIds,
        bytes32[] calldata endpointIds,
        address[] calldata sponsors,
        address[] calldata requesters
    ) external view virtual returns (
        bool[] memory statuses
    ) {}

    function createTemplate (
        address airnode,
        bytes32 endpointId,
        bytes calldata parameters
    ) external virtual returns (
        bytes32 templateId
    ) {}

    function getTemplates (
        bytes32[] calldata templateIds
    ) external view virtual returns (
        address[] memory airnodes,
        bytes32[] memory endpointIds,
        bytes[] memory parameters
    ) {}

    function templates (
        bytes32 templateId
    ) external view virtual returns (
        address airnode,
        bytes32 endpointId,
        bytes memory parameters
    ) {}

    function requestWithdrawal (
        address airnode,
        address sponsorWallet
    ) external virtual {}

    function fulfillWithdrawal (
        bytes32 withdrawalRequestId,
        address airnode,
        address sponsor
    ) external virtual payable {}

    function sponsorToWithdrawalRequestCount (
        address sponsor
    ) external view virtual returns (
        uint256 withdrawalRequestCount
    ) {}
}
