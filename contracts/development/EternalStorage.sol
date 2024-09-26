// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.15;

// import { Errors } from "../../libraries/Errors.sol";

// /**
//  * @title EternalStorage
//  * @author API3 Latam
//  * 
//  * @notice A standard EternalStorage implementation to be used by those
//  * contracts using this pattern. Contains all the functions to 
//  * set, get and delete data from the storage.
//  * @dev This contract is based from `polymath-core` datastore implementation.
//  * Which can be found at https://github.com/PolymathNetwork/polymath-core/tree/master/contracts/datastore.
//  */
// abstract contract EternalStorage {
//     // ========== Storage ==========
//     /**
//      * @notice There's a mapping for the most common datatypes available in Solidity.
//      * @dev Further datatypes could be added and shouldn't change the storage layout
//      * in inherited versions in case there's a need for specific mappings.
//      */
//     mapping (bytes32 => uint256) internal uint256Data;
//     mapping (bytes32 => bytes32) internal bytes32Data;
//     mapping (bytes32 => address) internal addressData;
//     mapping (bytes32 => string) internal stringData;
//     mapping (bytes32 => bytes) internal bytesData;
//     mapping (bytes32 => bool) internal boolData;
//     mapping (bytes32 => uint256[]) internal uint256ArrayData;
//     mapping (bytes32 => bytes32[]) internal bytes32ArrayData;
//     mapping (bytes32 => address[]) internal addressArrayData;
//     mapping (bytes32 => bool[]) internal boolArrayData;

//     // ========== Modifiers ==========
//     /**
//      * @notice Checks if the length of the key and data arrays are equal.
//      *
//      * @param _keyLength Length of the key array.
//      * @param _dataLength Length of the data array.
//      */
//     modifier validArrayLength (
//         uint256 _keyLength,
//         uint256 _dataLength
//     ) {
//         if(_keyLength != _dataLength) revert Errors.InvalidArrayLength();
//         _;
//     }

//     /**
//      * @notice Checks if the key is not empty.
//      * 
//     * @param _key Key to be checked for.
//      */
//     modifier validKey (
//         bytes32 _key
//     ) {
//         if(_key == bytes32(0)) revert Errors.InvalidKey();
//         _;
//     }

//     // ========== Setters ==========
//     /**
//      * @notice Creates new registry of an uint256 data against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setUint256 (
//         bytes32 _key,
//         uint256 _data
//     ) external {
//         _setData(_key, _data, false);
//     }

//     /**
//      * @notice Creates new registry of a bytes32 data against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setBytes32 (
//         bytes32 _key,
//         bytes32 _data
//     ) external {
//         _setData(_key, _data, false);
//     }

//     /**
//      * @notice Creates new registry of an address value against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setAddress (
//         bytes32 _key,
//         address _data
//     ) external {
//         _setData(_key, _data, false);
//     }

//     /**
//      * @notice Creates new registry of a bool value against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setBool (
//         bytes32 _key,
//         bool _data
//     ) external {
//         _setData(_key, _data, false);
//     }

//     /**
//      * @notice Creates new registry of a string value against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setString (
//         bytes32 _key,
//         string calldata _data
//     ) external {
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Creates new registry of bytes data against a key.
//      *
//      * @param _key Unique key to identify the data.
//      * @param _data Data to be stored against the key.
//      */
//     function setBytes (
//         bytes32 _key,
//         bytes calldata _data
//     ) external {
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Creates new registry of an uint256 array against a key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Array to be stored against the key.
//      */
//     function setUint256Array (
//         bytes32 _key,
//         uint256[] calldata _data
//     ) external {
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Creates new registry of a bytes32 array against a key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Array to be stored against the key.
//      */
//     function setBytes32Array (
//         bytes32 _key,
//         bytes32[] calldata _data
//     ) external {
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Creates new registry of an address array against a key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Array to be stored against the key.
//      */
//     function setAddressArray (
//         bytes32 _key,
//         address[] calldata _data
//     ) external {    
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Creates new registry of a bool array against a key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Array to be stored against the key.
//      */
//     function setBoolArray (
//         bytes32 _key,
//         bool[] calldata _data
//     ) external {    
//         _setData(_key, _data);
//     }

//     /**
//      * @notice Stores multiple uint256 data against respective keys
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be stored against the respective keys
//      */
//     function setUint256Multi (
//         bytes32[] memory _keys,
//         uint256[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], false);
//         }
//     }

//     /**
//      * @notice Stores multiple bytes32 values against respective keys
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be stored against the respective keys
//      */
//     function setBytes32Multi (
//         bytes32[] memory _keys,
//         bytes32[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], false);
//         }
//     }

//     /**
//      * @notice Stores multiple addresses against respective keys
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be stored against the respective keys
//      */
//     function setAddressMulti (
//         bytes32[] memory _keys,
//         address[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], false);
//         }
//     }

//     /**
//      * @notice Stores multiple bool values against respective keys
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be stored against the respective keys
//      */
//     function setBoolMulti (
//         bytes32[] memory _keys,
//         bool[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {    
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], false);
//         }
//     }

//     // ========== Appends ==========
//     /**
//      * @notice Inserts an uint256 element to the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Element to push into the array.
//      */
//     function insertUint256 (
//         bytes32 _key,
//         uint256 _data
//     ) external {
//         _setData(_key, _data, true);
//     }

//     /**
//      * @notice Inserts a bytes32 element to the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Element to push into the array.
//      */
//     function insertBytes32 (
//         bytes32 _key,
//         bytes32 _data
//     ) external {       
//         _setData(_key, _data, true);
//     }

//     /**
//      * @notice Inserts an address element to the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Element to push into the array.
//      */
//     function insertAddress (
//         bytes32 _key,
//         address _data
//     ) external {    
//         _setData(_key, _data, true);
//     }

//     /**
//      * @notice Inserts a bool element to the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _data Element to push into the array.
//      */
//     function insertBool (
//         bytes32 _key,
//         bool _data
//     ) external {    
//         _setData(_key, _data, true);
//     }

//     /**
//      * @notice Inserts multiple uint256 elements to the array identified by the respective keys.
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be inserted in arrays of the respective keys
//      */
//     function insertUint256Multi (
//         bytes32[] memory _keys,
//         uint256[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], true);
//         }
//     }

//     /**
//      * @notice Inserts multiple bytes32 elements to the array identified by the respective keys.
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be inserted in arrays of the respective keys
//      */
//     function insertBytes32Multi (
//         bytes32[] memory _keys,
//         bytes32[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], true);
//         }
//     }

//     /**
//      * @notice Inserts multiple addresses to the array identified by the respective keys.
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be inserted in arrays of the respective keys
//      */
//     function insertAddressMulti (
//         bytes32[] memory _keys,
//         address[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], true);
//         }
//     }

//     /**
//      * @notice Inserts multiple bool values to the array identified by the respective keys.
//      *
//      * @param _keys Array of keys to identify the data
//      * @param _data Array of data to be inserted in arrays of the respective keys
//      */
//     function insertBoolMulti (
//         bytes32[] memory _keys,
//         bool[] memory _data
//     ) public validArrayLength(_keys.length, _data.length) {
        
//         for (uint256 i = 0; i < _keys.length; i++) {
//             _setData(_keys[i], _data[i], true);
//         }
//     }

//     // ========== Deletters ==========
//     /**
//      * @notice Deletes an element from the array identified by the key.
//      * @dev When an element is deleted from an array,
//      * last element of that array is moved to the index of deleted element.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _index Index of the element to delete.
//      */
//     function deleteUint256 (
//         bytes32 _key,
//         uint256 _index
//     ) external {
//         _deleteUint(_key, _index);
//     }

//     /**
//      * @notice Deletes an element from the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _index Index of the element to delete.
//      */
//     function deleteBytes32 (
//         bytes32 _key,
//         uint256 _index
//     ) external {    
//         _deleteBytes32(_key, _index);
//     }

//     /**
//      * @notice Deletes an element from the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _index Index of the element to delete.
//      */
//     function deleteAddress (
//         bytes32 _key,
//         uint256 _index
//     ) external {    
//         _deleteAddress(_key, _index);
//     }

//     /**
//      * @notice Deletes an element from the array identified by the key.
//      *
//      * @param _key Unique key to identify the array.
//      * @param _index Index of the element to delete.
//      */
//     function deleteBool (
//         bytes32 _key,
//         uint256 _index
//     ) external {    
//         _deleteBool(_key, _index);
//     }

//     // ========== Getters ==========
//     /**
//      * @notice Gets an uint256 value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios. 
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getUint256 (
//         bytes32 _key
//     ) external view returns (
//         uint256 _value
//     ) {
//         return uint256Data[_key];
//     }

//     /**
//      * @notice Gets a bytes32 value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios. 
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getBytes32 (
//         bytes32 _key
//     ) external view returns (
//         bytes32 _value
//     ) {
//         return bytes32Data[_key];
//     }
    
//     /**
//      * @notice Gets an address value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios. 
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getAddress (
//         bytes32 _key
//     ) external view returns (
//         address _value
//     ) {
//         return addressData[_key];
//     }

//     /**
//      * @notice Gets a string value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios. 
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getString (
//         bytes32 _key
//     ) external view returns (
//         string memory _value
//     ) {
//         return stringData[_key];
//     }

//     /**
//      * @notice Gets a bytes value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getBytes (
//         bytes32 _key
//     ) external view returns (
//         bytes memory _value
//     ) {
//         return bytesData[_key];
//     }

//     /**
//      * @notice Gets a bool value identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getBool (
//         bytes32 _key
//     ) external view returns (
//         bool _value
//     ) {
//         return boolData[_key];
//     }

//     /**
//      * @notice Gets an uint256 array identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getUint256Array (
//         bytes32 _key
//     ) external view returns (
//         uint256[] memory _value
//     ) {
//         return uint256ArrayData[_key];
//     }

//     /**
//      * @notice Gets a bytes32 array identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getBytes32Array (
//         bytes32 _key
//     ) external view returns (
//         bytes32[] memory _value
//     ) {
//         return bytes32ArrayData[_key];
//     }

//     /**
//      * @notice Gets an address array identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getAddressArray (
//         bytes32 _key
//     ) external view returns (
//         address[] memory _value
//     ) {
//         return addressArrayData[_key];
//     }

//     /**
//      * @notice Gets a bool array identified by the given key.
//      * @dev A mapping might return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _value The previously stored value or a default value.
//      */
//     function getBoolArray (
//         bytes32 _key
//     ) external view returns (
//         bool[] memory _value
//     ) {
//         return boolArrayData[_key];
//     }

//     /**
//      * @notice Gets the lenght of an uint256 array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _len The length of the array kept at the given key.
//      */
//     function getUint256ArrayLength (
//         bytes32 _key
//     ) external view returns (
//         uint256 _len
//     ) {
//         return uint256ArrayData[_key].length;
//     }

//     /**
//      * @notice Gets the lenght of a bytes32 array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _len The length of the array kept at the given key.
//      */
//     function getBytes32ArrayLength (
//         bytes32 _key
//     ) external view returns (
//         uint256 _len
//     ) {
//         return bytes32ArrayData[_key].length;
//     }

//     /**
//      * @notice Gets the lenght of an address array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _len The length of the array kept at the given key.
//      */
//     function getAddressArrayLength (
//         bytes32 _key
//     ) external view returns (
//         uint256 _len
//     ) {
//         return addressArrayData[_key].length;
//     }

//     /**
//      * @notice Gets the lenght of an uint256 array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      *
//      * @return _len The length of the array kept at the given key.
//      */
//     function getBoolArrayLength (
//         bytes32 _key
//     ) external view returns (
//         uint256 _len
//     ) {
//         return boolArrayData[_key].length;
//     }

//     /**
//      * @notice Gets a value at the given index from an specified uint256 array.
//      * @dev A mapping could return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the array.
//      * @param _index The index of the desired item.
//      *
//      * @return _value The value at the given index.
//      */
//     function getUint256ArrayElement (
//         bytes32 _key,
//         uint256 _index
//     ) external view returns (
//         uint256 _value
//     ) {
//         return uint256ArrayData[_key][_index];
//     }

//     /**
//      * @notice Gets a value at the given index from an specified bytes32 array.
//      * @dev A mapping could return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the array.
//      * @param _index The index of the desired item.
//      *
//      * @return _value The value at the given index.
//      */
//     function getBytes32ArrayElement (
//         bytes32 _key,
//         uint256 _index
//     ) external view returns (
//         bytes32 _value
//     ) {
//         return bytes32ArrayData[_key][_index];
//     }

//     /**
//      * @notice Gets a value at the given index from an specified address array.
//      * @dev A mapping could return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the array.
//      * @param _index The index of the desired item.
//      *
//      * @return _value The value at the given index.
//      */
//     function getAddressArrayElement (
//         bytes32 _key,
//         uint256 _index
//     ) external view returns (
//         address _value
//     ) {
//         return addressArrayData[_key][_index];
//     }

//     /**
//      * @notice Gets a value at the given index from an specified bool array.
//      * @dev A mapping could return a value even though the key is not
//      * present in the mapping. For arrays is obvious as it would be empty,
//      * but for primitives is not. Each requester is responsible for
//      * handling this scenarios.
//      *
//      * @param _key The key to identify the array.
//      * @param _index The index of the desired item.
//      *
//      * @return _value The value at the given index.
//      */
//     function getBoolArrayElement (
//         bytes32 _key,
//         uint256 _index
//     ) external view returns (
//         bool _value
//     ) {
//         return boolArrayData[_key][_index];
//     }

//     /**
//      * @notice Gets an array of elements at the given range from an specified uint256 array.
//      * @dev If the `_endIndex` exceeds the current lenght, the output is capped
//      * to the current lenght.
//      *
//      * @param _key The key to identify the array.
//      * @param _startIndex The inclusive index to initialize the range.
//      * @param _endIndex The inclusive index to end the range.
//      *
//      * @return _array An array of values for the given range of indexes.
//      */
//     function getUint256ArrayElements (
//         bytes32 _key,
//         uint256 _startIndex,
//         uint256 _endIndex
//     ) public view returns (
//         uint256[] memory _array
//     ) {
//         uint256 size = uint256ArrayData[_key].length;
        
//         if (
//             size == 0 
//             || _startIndex >= _endIndex
//             || _startIndex > size
//         ) {
//             revert Errors.InvalidParameter();
//         }

//         if (size == _startIndex) size = 1;
//         else if (_endIndex >= size) size = size - _startIndex;
//         else  size = _endIndex - _startIndex + 1;

//         _array = new uint256[](size);

//         for(uint256 i; i < size; i++)
//             _array[i] = uint256ArrayData[_key][i + _startIndex];
//     }

//     /**
//      * @notice Gets an array of elements at the given range from an specified bytes32 array.
//      * @dev If the `_endIndex` exceeds the current lenght, the output is capped
//      * to the current lenght.
//      *
//      * @param _key The key to identify the array.
//      * @param _startIndex The inclusive index to initialize the range.
//      * @param _endIndex The inclusive index to end the range.
//      *
//      * @return _array An array of values for the given range of indexes.
//      */
//     function getBytes32ArrayElements (
//         bytes32 _key,
//         uint256 _startIndex,
//         uint256 _endIndex
//     ) public view returns (
//         bytes32[] memory _array
//     ) {
//         uint256 size = bytes32ArrayData[_key].length;
        
//         if (
//             size == 0 
//             || _startIndex >= _endIndex
//             || _startIndex > size
//         ) {
//             revert Errors.InvalidParameter();
//         }
        
//         if (size == _startIndex) size = 1;
//         else if (_endIndex >= size) size = size - _startIndex;
//         else  size = _endIndex - _startIndex + 1;
        
//         _array = new bytes32[](size);
//         for(uint256 i; i < size; i++)
//             _array[i] = bytes32ArrayData[_key][i + _startIndex];
//     }

//     /**
//      * @notice Gets an array of elements at the given range from an specified address array.
//      * @dev If the `_endIndex` exceeds the current lenght, the output is capped
//      * to the current lenght.
//      *
//      * @param _key The key to identify the array.
//      * @param _startIndex The inclusive index to initialize the range.
//      * @param _endIndex The inclusive index to end the range.
//      *
//      * @return _array An array of values for the given range of indexes.
//      */
//     function getAddressArrayElements (
//         bytes32 _key,
//         uint256 _startIndex,
//         uint256 _endIndex
//     ) public view returns (
//         address[] memory _array
//     ) {
//         uint256 size = addressArrayData[_key].length;
        
//         if (
//             size == 0 
//             || _startIndex >= _endIndex
//             || _startIndex > size
//         ) {
//             revert Errors.InvalidParameter();
//         }
        
//         if (size == _startIndex) size = 1;
//         else if (_endIndex >= size) size = size - _startIndex;
//         else  size = _endIndex - _startIndex + 1;

//         _array = new address[](size);
//         for(uint256 i; i < size; i++)
//             _array[i] = addressArrayData[_key][i + _startIndex];
//     }

//     /**
//      * @notice Gets an array of elements at the given range from an specified bool array.
//      * @dev If the `_endIndex` exceeds the current lenght, the output is capped
//      * to the current lenght.
//      *
//      * @param _key The key to identify the array.
//      * @param _startIndex The inclusive index to initialize the range.
//      * @param _endIndex The inclusive index to end the range.
//      *
//      * @return _array An array of values for the given range of indexes.
//      */
//     function getBoolArrayElements (
//         bytes32 _key,
//         uint256 _startIndex,
//         uint256 _endIndex
//     ) public view returns (
//         bool[] memory _array
//     ) {
//         uint256 size = boolArrayData[_key].length;
        
//         if (
//             size == 0 
//             || _startIndex >= _endIndex
//             || _startIndex > size
//         ) {
//             revert Errors.InvalidParameter();
//         }
        
//         if (size == _startIndex) size = 1;
//         else if (_endIndex >= size) size = size - _startIndex;
//         else  size = _endIndex - _startIndex + 1;

//         _array = new bool[](size);
//         for(uint256 i; i < size; i++)
//             _array[i] = boolArrayData[_key][i + _startIndex];
//     }

//     // ========== Internal Functions ==========
//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for uint256 type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      * @param _insert True for array elements. False for primitive mappings.
//      */
//     function _setData (
//         bytes32 _key,
//         uint256 _data,
//         bool _insert
//     ) internal validKey(_key) {
//         if (_insert) uint256ArrayData[_key].push(_data);
//         else uint256Data[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for bytes32 type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      * @param _insert True for array elements. False for primitive mappings.
//      */
//     function _setData (
//         bytes32 _key,
//         bytes32 _data,
//         bool _insert
//     ) internal validKey(_key) {
//         if (_insert) bytes32ArrayData[_key].push(_data);
//         else bytes32Data[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for address type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      * @param _insert True for array elements. False for primitive mappings.
//      */
//     function _setData (
//         bytes32 _key,
//         address _data,
//         bool _insert
//     ) internal validKey(_key) {
//         if (_insert) addressArrayData[_key].push(_data);
//         else addressData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for bool type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      * @param _insert True for array elements. False for primitive mappings.
//      */
//     function _setData (
//         bytes32 _key,
//         bool _data,
//         bool _insert
//     ) internal validKey(_key) {
//         if (_insert) boolArrayData[_key].push(_data);
//         else boolData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for string type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         string memory _data
//     ) internal validKey(_key) {
//         stringData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for bytes type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         bytes memory _data
//     ) internal validKey(_key) {
//         bytesData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for uint256[] type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         uint256[] memory _data
//     ) internal validKey(_key) {
//         uint256ArrayData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for bytes32[] type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         bytes32[] memory _data
//     ) internal validKey(_key) {
//         bytes32ArrayData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for address[] type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         address[] memory _data
//     ) internal validKey(_key) {
//         addressArrayData[_key] = _data;
//     }

//     /**
//      * @notice Sets a value for the given key.
//      * @dev Overload for bool[] type data.
//      *
//      * @param _key The key to identify the value.
//      * @param _data The value to be set.
//      */
//     function _setData (
//         bytes32 _key,
//         bool[] memory _data
//     ) internal validKey(_key) {
//         boolArrayData[_key] = _data;
//     }

//     /**
//      * @notice Deletes a value from a uint256 array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      * @param _index The index of the element to delete.
//      */
//     function _deleteUint (
//         bytes32 _key,
//         uint256 _index
//     ) internal validKey(_key) {
//         if (uint256ArrayData[_key].length > _index) revert Errors.InvalidParameter();
//         // Replace element to delete with last element.
//         uint256ArrayData[_key][_index] = uint256ArrayData[_key][uint256ArrayData[_key].length - 1]; 
//         uint256ArrayData[_key].pop();
//     }

//     /**
//      * @notice Deletes a value from a bytes32 array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      * @param _index The index of the element to delete.
//      */
//     function _deleteBytes32 (
//         bytes32 _key,
//         uint256 _index
//     ) internal validKey(_key) {
//         if (bytes32ArrayData[_key].length > _index) revert Errors.InvalidParameter();
//         // Replace element to delete with last element.
//         bytes32ArrayData[_key][_index] = bytes32ArrayData[_key][bytes32ArrayData[_key].length - 1];
//         bytes32ArrayData[_key].pop();
//     }

//     /**
//      * @notice Deletes a value from an address array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      * @param _index The index of the element to delete.
//      */
//     function _deleteAddress (
//         bytes32 _key,
//         uint256 _index
//     ) internal validKey(_key) {
//         if (addressArrayData[_key].length > _index) revert Errors.InvalidParameter();
//         // Replace element to delete with last element.
//         addressArrayData[_key][_index] = addressArrayData[_key][addressArrayData[_key].length - 1];
//         addressArrayData[_key].pop();
//     }

//     /**
//      * @notice Deletes a value from a bool array identified by the given key.
//      *
//      * @param _key The key to identify the value.
//      * @param _index The index of the element to delete.
//      */
//     function _deleteBool(bytes32 _key, uint256 _index) internal validKey(_key) {
//         if (boolArrayData[_key].length > _index) revert Errors.InvalidParameter();
//         // Replace element to delete with last element.
//         boolArrayData[_key][_index] = boolArrayData[_key][boolArrayData[_key].length - 1];
//         boolArrayData[_key].pop();
//     }
// }
