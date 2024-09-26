// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

/**
 * @title MockApi3ServerV1.
 * @author API3 DAO.
 * 
 * @notice Modified and shortened version from the following contract:
 * https://github.com/api3dao/airnode-protocol-v1/blob/main/contracts/api3-server-v1/Api3ServerV1.sol
 * for testing purposes.
 */
contract MockApi3ServerV1 {
    struct DataFeed {
        int224 value;
        uint32 timestamp;
    }

    // Data feed with ID
    mapping(bytes32 => DataFeed) public _dataFeeds;

    constructor() {}

    /**
     * @notice Reads the data feed with dAPI name hash
     *
     * @param dapiNameHash dAPI name hash
     *
     * @return value Data feed value
     * @return timestamp Data feed timestamp
     */
    function _readDataFeedWithDapiNameHash(
        bytes32 dapiNameHash
    ) internal view returns (
        int224 value,
        uint32 timestamp
    ) {
        DataFeed storage dataFeed = _dataFeeds[dapiNameHash];
        (value, timestamp) = (dataFeed.value, dataFeed.timestamp);
        require(
            timestamp > 0,
            "Data feed not initialized"
        );
    }

    /**
     * @notice Reads the data feed with dAPI name hash
     *
     * @param dapiNameHash dAPI name hash
     *
     * @return value Data feed value
     * @return timestamp Data feed timestamp
     */
    function readDataFeedWithDapiNameHash(
        bytes32 dapiNameHash
    ) external view returns (
        int224 value,
        uint32 timestamp
    ) {
        return _readDataFeedWithDapiNameHash(
            dapiNameHash
        );
    }

    /**
     * @notice Called privately to process the Beacon update.
     * 
     * @param beaconId Beacon ID.
     * @param timestamp Timestamp used in the signature.
     * @param data The value to save for the Beacon.
     */
    function processBeaconUpdate(
        bytes32 beaconId,
        uint256 timestamp,
        int224 data
    ) internal {
        require(
            timestamp > _dataFeeds[beaconId].timestamp,
            "Does not update timestamp"
        );
        _dataFeeds[beaconId] = DataFeed({
            value: data,
            timestamp: uint32(timestamp)
        });
    }

    /**
     * @notice Updates a Beacon using given data value.
     * @dev Note that this would originally be data provided trough
     * an airnode.
     * 
     * @param beaconId The id of the beacon to update for.
     * @param timestamp Signature timestamp.
     * @param data Update data, an `int254`.
     */
    function updateBeaconWithSignedData(
        bytes32 beaconId,
        uint256 timestamp,
        int224 data
    ) external {
        processBeaconUpdate(
            beaconId,
            timestamp,
            data
        );
    }
}