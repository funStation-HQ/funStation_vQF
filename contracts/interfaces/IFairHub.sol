// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import { DataTypes } from '../libraries/DataTypes.sol';

/**
 * @title IRaffleHub
 * @author API3 Latam
 *
 * @notice This is the interface for the Raffle Manager,
 * The contract from which users will be able to create raffles.
 */
interface IFairHub {
    // ================ Initialize ================
    /**
     * @notice Initializer for the logic contract trough the UUPS Proxy.
     *
     * @param _raffleBeacon The beacon to use for raffle proxies.
     * @param _accessManager The access manager to use for FairHub ACL.
     */
    function initialize (
        address _raffleBeacon,
        address _accessManager
    ) external;

    // ================ Upgrade Functions ================
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

    // ========== Get/Set Functions ==========
    /**
     * @notice Gets the current counter for the raffle ids.
     *
     * @return _counter The current counter value.
     */
    function getRaffleCount ()
     external view returns (
        uint256 _counter
    );

    /**
     * @notice Gets the current counter for the yolo raffle ids.
     *
     * @return _counter The current counter value.
     */
    function getYoloRaffleCount ()
     external view returns (
        uint256 _counter
    );

    /**
     * @notice Gets the address from the raffle proxy of a given id.
     * 
     * @param _raffleId The raffle id.
     *
     * @return _proxyAddress The address of the proxy.
     */
    function getRaffleAddress (
        uint256 _raffleId
    ) external view returns (
        address _proxyAddress
    );

    /**
     * @notice Gets the address from the yolo raffle proxy of a given id.
     * 
     * @param _yoloRaffleId The yolo raffle id.
     *
     * @return _proxyAddress The address of the proxy.
     */
    function getYoloRaffleAddress (
        uint256 _yoloRaffleId
    ) external view returns (
        address _proxyAddress
    );

    /**
     * @notice Gets the function caller owned raffle ids.
     *
     * @return _raffleIds An array of raffle ids.
     */
    function getOwnedRaffles () 
     external view returns (
        uint256[] memory _raffleIds
    );

    /**
     * @notice Gets the function caller owned yolo raffle ids.
     *
     * @return _yoloRaffleIds An array of yolo raffle ids.
     */
    function getOwnedYoloRaffles () 
     external view returns (
        uint256[] memory _yoloRaffleIds
    );

    /**
     * @notice Gets the current Quantum Fair treasury address.
     *
     * @return _treasury The current treasury address.
     */
    function getTreasury ()
     external view returns (
        address _treasury
    );

    /**
      * @notice Gets the current raffle cut.
      *
      * @return _raffleCut The current raffle cut.
      */
    function getRaffleCut ()
     external view returns (
        uint256 _raffleCut
    );

    /**
     * @notice Gets the current yolo raffle cut.
     *
     * @return _yoloRaffleCut The current yolo raffle cut.
     */
    function getYoloRaffleCut ()
     external view returns (
        uint256 _yoloRaffleCut
    );

    /**
     * @notice Gets the current cancelation fee.
     *
     * @return _cancelationFee The current cancelation fee.
     */
    function getCancelationFee ()
     external view returns (
        uint256 _cancelationFee
    );

    /**
     * @notice Gets the current yolo raffle duration.
     * 
     * @return _roundDuration The current yolo raffle duration.
     */
    function getYoloRaffleDuration ()
     external view returns (
        uint256 _roundDuration
    );

    /**
     * @notice Gets the current winner airnode address.
     *
     * @return _winnerAirnodeAddress The current winner airnode address.
     */
    function getWinnerAirnodeAddress ()
     external view returns (
        address _winnerAirnodeAddress
    );

    /**
     * @notice Gets the current vault factory address.
     *
     * @return _vaultFactory The current vault factory address.
     */
    function getVaultFactory ()
     external view returns (
        address _vaultFactory
    );

    /**
     * @notice Gets the current deposit router address.
     * 
     * @return _depositRouter The current deposit router address.
     */
    function getVaultDepositRouter ()
     external view returns (
        address _depositRouter
    );

    /**
     * @notice Gets the current DAPI manager address.
     *
     * @return _dApiManager The current DAPI manager address.
     */
    function getDApiManager (
    ) external view returns (
        address _dApiManager
    );

    /**
     * @notice Gets the currency token address for a given raffle or yolo raffle.
     *
     * @param _raffle The raffle address.
     *
     * @return _token The currency token address.
     */
    function getRaffleToken (
        address _raffle
    ) external view returns (
        address _token
    );

    /**
     * @notice Get's the current wallet set as owner of the platform.
     * 
     * @return _owner The current owner address.
     */
    function owner ()
     external view returns (
        address _owner
    );

    /**
     * @notice Set a new airnode address to pick raffle winners.
     * @dev This function is only callable by the owner.
     * 
     * @param _winnerAirnodeAddress The new winner airnode address.
     */
    function setWinnerAirnodeAddress (
        address _winnerAirnodeAddress
    ) external;

    /**
     * @notice Sets the current vault factory address.
     * @dev This function is only callable by the owner.
     *
     * @param _vaultFactoryAddress The new vault factory address.
     */
    function setVaultFactoryAddress (
        address _vaultFactoryAddress
    ) external;

    /**
     * @notice Sets the current deposit router address.
     * @dev This function is only callable by the owner.
     *
     * @param _depositRouterAddress The new deposit router address.
     */
    function setDepositRouterAddress (
        address _depositRouterAddress
    ) external;

    /**
     * @notice Sets the current DAPI manager address.
     * @dev This function is only callable by the owner.
     *
     * @param _dApiManagerAddress The new DAPI manager address.
     */
    function setDApiManagerAddress (
        address _dApiManagerAddress
    ) external;

    /**
     * @notice Sets the current treasury address.
     * @dev This function is only callable by the owner.
     *
     * @param _treasuryAddress The new treasury address.
     */
    function setTreasuryAddress (
        address _treasuryAddress
    ) external;

    /**
     * @notice Sets the current raffle cut.
     * @dev This function is only callable by the owner.
     *
     * @param _raffleCut The new pool cut.
     */
    function setRaffleCut (
        uint256 _raffleCut
    ) external;

    /**
     * @notice Sets the current cancelation fee.
     * @dev This function is only callable by the owner.
     *
     * @param _cancelationFee The new cancelation fee.
     */
    function setCancelationFee (
        uint256 _cancelationFee
    ) external;


    /**
     * @notice Sets the current yolo raffle cut.
     * @dev This function is only callable by the owner.
     *
     * @param _yoloRaffleCut The new yolo raffle cut.
     */
    function setYoloRaffleCut (
        uint256 _yoloRaffleCut
    ) external;

    /**
     * @notice Sets the current yolo raffle duration.
     * @dev This function is only callable by the owner.
     * 
     * @param _roundDuration The new yolo raffle duration.
     */
    function setYoloRaffleDuration (
        uint256 _roundDuration
    ) external;

    /**
     * @notice Sets the current owner address.
     * @dev This function is only callable by the owner.
     *
     * @param _owner The new owner address.
     */
    function setOwner (
        address _owner
    ) external;

    // ========== Utilities Functions ==========
    /**
     * @notice Pauses raffle and yolo raffle creation.
     * @dev This function is only callable by the owner.
     */
    function pauseRaffles () external;

    /**
     * @notice Unpauses raffle and yolo raffle creation.
     * @dev This function is only callable by the owner.
     */
    function unpauseRaffles () external;

    // ========== Core Functions ==========
    /**
     * @notice Creates a new Raffle Proxy from a given implementation.
     * @dev Uses the beacon to get the current implementation contract.
     *
     * @param startTime The starting time for the raffle.
     * @param endTime The end time for the raffle.
     * @param winnerNumber The initial number to set as total winners.
     * @param ticketPrice The price for each ticket.
     * @param requiredBalance The minimum amount of tokens required to close the raffle.
     * @param metadata The `Multihash` information for this raffle metadata.
     * @param currency The `RaffleCurrency` information for this raffle.
     * @param tokenAddress The token address to use for this raffle, in case currency is set to ERC20.
     */
    function createRaffle (
        uint256 startTime,
        uint256 endTime,
        uint256 winnerNumber,
        uint256 ticketPrice,
        uint256 requiredBalance,
        DataTypes.Multihash memory metadata,
        DataTypes.TokenType currency,
        address tokenAddress
    ) external;
}