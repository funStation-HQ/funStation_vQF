// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { DataTypes } from "../../libraries/DataTypes.sol";
import { Events } from "../../libraries/Events.sol";
import { Errors } from "../../libraries/Errors.sol";
// Third party imports
import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AirnodeLogic
 * @author API3 Latam
 *
 * @notice This is an abstract contract to be inherited by the modules
 * which are going to make use of an Airnode.
 */
abstract contract AirnodeLogic is 
    RrpRequesterV0,
    Ownable
{
    // ========== Storage ==========
    address public airnode;           // The address of the airnode being use.
    address internal derivedAddress;  // The derived address to be sponsored.
    address internal sponsorAddress;  // The sponsored wallet address that will pay for fulfillments.
    
    DataTypes.Endpoint[] public endpointsIds; // The storage for endpoints data.
    
    // ========== Mappings ==========
    // The mapping of functions to their index in the array.
    mapping(bytes4 => uint256) public callbackToIndex;
    // The list of ongoing fulfillments.
    mapping(bytes32 => bool) internal incomingFulfillments;
    
    // ========== Modifiers ==========
    /**
     * @notice Validates if the given requestId exists.
     * @dev Is up to each requester how to deal with edge cases
     * of missing requests.
     *
     * @param _requestId The requestId being used.
     */
    modifier validRequest (
        bytes32 _requestId
    ) {
        if (
            incomingFulfillments[_requestId] == false
        ) revert Errors.RequestIdNotKnown();
        _;
    }

    /**
     * @notice Validates whether the given requestId has been fulfilled.
     *
     * @param _requestId The requestId being used.
     */
    modifier requestFulfilled (
        bytes32 _requestId
    ) {
        if (
            incomingFulfillments[_requestId] == true
        ) revert Errors.RequestNotFulfilled();
        _;
    }

    // ========== Constructor ==========
    /**
     * @notice Constructor function for AirnodeLogic contract.
     *
     * @param _airnodeRrp The RRP contract address for the network being deploy. 
     */
    constructor (
        address _airnodeRrp
    ) RrpRequesterV0 (
        _airnodeRrp
    ) {}

    // ========== Get/Set Functions ==========
    /** 
     * @notice Sets parameters used in requesting the Airnode protocol.
     *
     * @param _airnode - The address for the airnode.
     * @param _derivedAddress - The derived address to sponsor.
     * @param _sponsorAddress - The actual sponsorer address.
     */
    function setRequestParameters (
        address _airnode,
        address _derivedAddress,
        address _sponsorAddress
    ) external onlyOwner {
        // Check if the given addresses are valid.
        if (
            _airnode == address(0) ||
            _derivedAddress == address(0) ||
            _sponsorAddress == address(0)
        ) revert Errors.ZeroAddress();

        // Set the airnode parameters.
        airnode = _airnode;
        derivedAddress = _derivedAddress;
        sponsorAddress = _sponsorAddress;
        
        // Emit the event.
        emit Events.SetRequestParameters(
            _airnode,
            _derivedAddress,
            _sponsorAddress
        );
    }

    /**
     * @notice Function to add new endpoints to the `endpointsIds` array.
     *
     * @param _endpointId - The identifier for the airnode endpoint.
     * @param _endpointFunction - The function selector to point the callback to.
     */
    function addNewEndpoint (
        bytes32 _endpointId,
        string memory _endpointFunction
    ) external onlyOwner {
        // Calculate the function selector from the given string.
        bytes4 _endpointSelector =  bytes4(
            keccak256(
                bytes(
                    _endpointFunction
                )
            )
        );

        // Check if the endpoint already exists.
        if (callbackToIndex[_endpointSelector] != 0) {
            revert Errors.EndpointAlreadyExists();
        }

        // Push the new endpoint to the array.
        endpointsIds.push(
            DataTypes.Endpoint(
                _endpointId,
                _endpointSelector
            )
        );
        callbackToIndex[_endpointSelector] = endpointsIds.length - 1;

        // Emit the event.
        emit Events.SetAirnodeEndpoint(
            endpointsIds.length - 1,
            _endpointId,
            _endpointFunction,
            _endpointSelector
        );
    }

    /**
     * @notice Function to get the fulfillment status from a request.
     *
     * @param _requestId The id of the desired request.
     *
     * @return isItFulfilled Boolean True if is yet to be fulfilled 
     *  or False if does not exists or is already fulfilled.
     */
    function getIncomingFulfillments (
        bytes32 _requestId
    ) external view onlyOwner returns (
        bool isItFulfilled
    ) {
        return incomingFulfillments[_requestId];
    }

    // ========== Utilities Functions ==========
    /**
     * @notice Function to request the balance from requester.
     * @dev In case the requester contract is set as a sponsor.
     */
    function withdraw()
     external onlyOwner {
        uint256 balance = address(this).balance;

        payable(msg.sender).transfer(balance);

        emit Events.SponsorWithdraw(
            address(this),
            msg.sender,
            balance
        );
    }

    /**
     * @notice Checks wether and endpoint exists and
     * if it corresponds with the registered index.
     * @dev This function should be called before any callback.
     * You should manually add them to the specific airnode defined callbacks.
     *
     * @param _selector The function selector to look for.
     */
    function _beforeFullfilment (
        bytes4 _selector
    ) internal virtual returns (
        DataTypes.Endpoint memory
    ) {
        uint256 endpointIdIndex = callbackToIndex[_selector];
        
        // Validate if endpoint exists.
        if (
            endpointIdIndex == 0
            && endpointsIds.length == 0
        ) {
            revert Errors.NoEndpointAdded();
        }

        DataTypes.Endpoint memory _currentEndpoint = endpointsIds[endpointIdIndex];

        // Validate endpoint data.
        if (
            _currentEndpoint.endpointId == bytes32(0)
        ) revert Errors.InvalidEndpointId();

        if (
            _currentEndpoint.functionSelector != _selector
        ) revert Errors.IncorrectCallback();

        return _currentEndpoint;
    }

    /**
     * @notice - Updates request status and emit successful request event.
     * @dev This function should be called after any callback.
     * You should manually add them to the specific airnode defined callbacks.
     *
     * @param _requestId - The id of the request for this fulfillment.
     */
    function _afterFulfillment (
        bytes32 _requestId
    ) internal virtual {
        // Set the request as fulfilled.
        incomingFulfillments[_requestId] = false;
    }

    // ========== Core Functions ==========
    /**
     * @notice Boilerplate to implement airnode calls.
     * @dev This function should be overwritten for each specific
     * requester implementation.
     *
     * @param _functionSelector - The target endpoint to use as callback.
     * @param parameters - The data for the API endpoint.
     */
    function callAirnode (
        bytes4 _functionSelector,
        bytes memory parameters
    ) internal virtual returns (
        bytes32
    ) {}

    // ========== Upgradability ==========
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}