// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Third party imports.
import "@api3/contracts/v0.8/interfaces/IDapiProxy.sol";
import "./MockApi3ServerV1.sol";

/**
 * @title MockDApiProxy.
 * @author API3 DAO.
 * 
 * @notice This is a copy from the contract available at:
 * https://github.com/api3dao/airnode-protocol-v1/blob/main/contracts/api3-server-v1/proxies/DapiProxy.sol
 * just for testing purposes.
 */
contract MockDApiProxy is IDapiProxy {
    // Api3ServerV1 address
    address public immutable override api3ServerV1;
    // Hash of the dAPI name
    bytes32 public immutable override dapiNameHash;

    /**
     * @param _api3ServerV1 Api3ServerV1 address
     * @param _dapiNameHash Hash of the dAPI name
     */
    constructor(
        address _api3ServerV1,
        bytes32 _dapiNameHash
    ) {
        api3ServerV1 = _api3ServerV1;
        dapiNameHash = _dapiNameHash;
    }

    /**
     * @notice Reads the dAPI that this proxy maps to
     *
     * @return value dAPI value
     * @return timestamp dAPI timestamp
     */
    function read()
     external view virtual override returns (
        int224 value,
        uint32 timestamp
    ) {
        (value, timestamp) = MockApi3ServerV1(
            api3ServerV1
        ).readDataFeedWithDapiNameHash(
            dapiNameHash
        );
    }
}
