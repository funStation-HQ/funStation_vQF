// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.15;

// // Package imports
// import { Errors } from "../../libraries/Errors.sol";
// // Third party imports
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/introspection/ERC1820Implementer.sol";

// /**
//  * @title InterfaceRegistry
//  * @author API3 Latam.
//  *
//  * @notice This contract is a modified implementation of the ERC1820 Registry.
//  * @dev For more details, see https://eips.ethereum.org/EIPS/eip-1820
//  */
// contract InterfaceRegistry is
//     Ownable
// {
//     // ========== Storage ==========
//     // Magic value which is returned if a contract implements an interface on behalf of some other address.
//     bytes32 constant internal ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

//     // Mapping from addresses and interface hashes to their implementers.
//     mapping(address => mapping(bytes32 => address)) internal interfaces;
//     mapping(address => address) internal managers; // Mapping from addresses to their manager.

//     /// @notice Indicates a contract is the 'implementer' of 'interfaceHash' for 'addr'.
//     event InterfaceImplementerSet(address indexed addr, bytes32 indexed interfaceHash, address indexed implementer);
//     /// @notice Indicates 'newManager' is the address of the new manager for 'addr'.
//     event ManagerChanged(address indexed addr, address indexed newManager);

//     // ========== Core Functions ==========
//     /**
//      * @notice Query if an address implements an interface and through which contract.
//      *
//      * @param _addr Address being queried for the implementer of an interface.
//      * @param _interfaceHash Keccak256 hash of the name of the interface. E.g., 'keccak256("Raffle")'.
//      *
//      * @return _implementor The address of the contract which implements the interface or '0' if not register.
//      */
//     function getInterfaceImplementer (
//         address _addr,
//         bytes32 _interfaceHash
//     ) external view returns (
//         address _implementor
//     ) {
//         if (_addr == address(0)) revert Errors.ZeroAddress();
        
//         return interfaces[addr][_interfaceHash];
//     }

//     /** 
//      * @notice Sets the contract which implements a specific interface for an address.
//      * Only the manager defined for that address can set it.
//      * @dev Each address is the manager for itself until it sets a new manager.
//      *
//      * @param _addr Address for which to set the interface. 
//      * @param _interfaceHash Keccak256 hash of the name of the interface as a string.
//      * @param _implementer Contract address implementing '_interfaceHash' for '_addr'.
//      */
//     function setInterfaceImplementer (
//         address _addr,
//         bytes32 _interfaceHash,
//         address _implementer
//     ) external {
//         if (_addr == address(0)) revert Errors.ZeroAddress();
//         require(getManager(addr) == msg.sender, "Not the manager"); // Change to revert Errors.Something();
//         if (isERC165Interface(_interfaceHash)) revert Errors.InvalidInterface();
//         if (_implementer != msg.sender) {
//             if(ERC1820ImplementerInterface(_implementer)
//                 .canImplementInterfaceForAddress(_interfaceHash, addr)
//                 == ERC1820_ACCEPT_MAGIC) revert Errors.InvalidInterface();
//         }
//         interfaces[addr][_interfaceHash] = _implementer;
//         emit InterfaceImplementerSet(addr, _interfaceHash, _implementer);
//     }

//     /// @notice Sets '_newManager' as manager for '_addr'.
//     /// The new manager will be able to call 'setInterfaceImplementer' for '_addr'.
//     /// @param _addr Address for which to set the new manager.
//     /// @param _newManager Address of the new manager for 'addr'. (Pass '0x0' to reset the manager to '_addr'.)
//     function setManager(address _addr, address _newManager) external onlyOwner {
//         require(getManager(_addr) == msg.sender, "Not the manager");
//         managers[_addr] = _newManager == _addr ? address(0) : _newManager;
//         emit ManagerChanged(_addr, _newManager);
//     }

//     /**
//      * @notice Get the manager of an address.
//      *
//      * @param _addr Address for which to return the manager.
//      *
//      * @return Address of the manager for a given address.
//      */
//     function getManager(address _addr) public view returns(address) {
//         // By default the manager of an address is the same address
//         if (managers[_addr] == address(0)) {
//             return _addr;
//         } else {
//             return managers[_addr];
//         }
//     }

//     /// @notice Compute the keccak256 hash of an interface given its name.
//     /// @param _interfaceName Name of the interface.
//     /// @return The keccak256 hash of an interface name.
//     function interfaceHash(string calldata _interfaceName) external pure returns(bytes32) {
//         return keccak256(abi.encodePacked(_interfaceName));
//     }

//     // ========== Utilities Functions ==========
//     /**
//      * @notice Checks whether the hash is an ERC165 interface (ending with 28 zeroes) or not.
//      *
//      * @param _interfaceHash Hash to check.
//      *
//      * @return _isERC165 True if the hash is an ERC165 interface, false otherwise.
//      */
//     function isERC165Interface (
//         bytes32 _interfaceHash
//     ) internal pure returns (
//         bool _isERC165
//     ) {
//         return _interfaceHash 
//             & 0x00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
//             == 0;
//     }
// }