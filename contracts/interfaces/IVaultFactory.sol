// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

interface IVaultFactory {
    // ================ Initialize ================
    /**
     * @notice Initializer for the logic contract trough the UUPS Proxy.
     *
     * @param _vaultAddress The template to use for the factory cloning of vaults.
     */
    function initialize (
        address _vaultAddress
    ) external;

    // ================ Upgrade Functions ================
    /**
     * @notice Updates the AssetVault logic contract address.
     *
     * @param newImplementation The address of the upgraded version of the contract.
     */
    function upgradeVault (
        address newImplementation
    ) external;

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

    // ================ Core Functions ================
    /**
     * @notice Creates a new vault contract.
     *
     * @param to The address that will own the new vault.
     *
     * @return vaultId The id of the vault token, derived from the initialized clone address.
     * @return vaultAddress The address of the proxy vault created.
     */
    function create (
        address to
    ) external returns (
        uint256 vaultId,
        address vaultAddress
    );

    // ================ Get/Set Functions ================
    /**
     * @notice Check if the given address is a vault instance created by this factory.
     *
     * @param instance The address to check.
     *
     * @return validity Whether the address is a valid vault instance.
     */
    function isInstance (
        address instance
    ) external view returns (
        bool validity
    );

    /**
     * @notice Return the address of the instance for the given token ID.
     *
     * @param tokenId The token ID for which to find the instance.
     *
     * @return instance The address of the derived instance.
     */
    function instanceAt (
        uint256 tokenId
    ) external view returns (
        address instance
    );

    /**
     * @notice Return the address of the instance for the given index.
     * Allows for enumeration over all instances.
     *
     * @param index The index for which to find the instance.
     *
     * @return instance The address of the instance, derived from the corresponding
     * token ID at the specified index.
     */
    function instanceAtIndex (
        uint256 index
    ) external view returns (
        address instance
    );

    /**
     * @notice Return the address of the distributor contract.
     *
     * @return distributorAddress The address of the distributor contract.
     */
    function getDistributor ()
     external view returns (
        address distributorAddress
    );

    /**
     * @notice Set the distributor address to be used by the vaults.
     * @dev This function is only callable by the owner of the factory.
     *
     * @param _distributorAddress The address of the distributor contract.
     */
    function setDistributor (
        address _distributorAddress
    ) external;

    // ================ Overrides ================
    /**
     * @notice Visibility for owner function from Ownable contract.
     * @dev See { Ownable-owner }.
     */
    function owner ()
     external view returns (
        address
    );

    /**
     * @notice Visibility for transfer function from ERC721Enumerable contract.
     * @dev See { ERC721Enumerable-safeTransferFrom }.
     */
    function safeTransferFrom (
        address from,
        address to,
        uint256 tokenId
    ) external;
}