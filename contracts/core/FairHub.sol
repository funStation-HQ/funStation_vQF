// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { Raffle } from "./modules/games/Raffle.sol";
import { AccessManaged } from "./modules/acl/AccessManaged.sol";
import { IDApiManager } from "../interfaces/IDApiManager.sol";
import { FairHubStorage } from "./storage/FairHubStorage.sol";
import { IFairHub } from "../interfaces/IFairHub.sol";
import { IVaultFactory } from "../interfaces/IVaultFactory.sol";
import { DataTypes } from '../libraries/DataTypes.sol';
import { Events } from "../libraries/Events.sol";
import { Errors } from "../libraries/Errors.sol";
// Third party imports
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title FairHub
 * @author API3 Latam
 *
 * @notice Entrypoint to the Fair Platform made by API3 Latam Team.
 * @dev Contracts are expected to provide a proxy for each user journey.
 * So it will differ per product and time, so make sure to know which
 * proxy you're using in each interaction.
 */
contract FairHub is
    UUPSUpgradeable,
    PausableUpgradeable,
    AccessManaged,
    FairHubStorage,
    IFairHub
{
    using Counters for Counters.Counter;

    // ========== Initializer/Constructor ==========
    /**
     * @dev Run the initializer instead of constructor in an upgradeable contract.
     */
    constructor () {
        _disableInitializers();
    }
    
    /**
     * @dev See { IFairHub-initialize }.
     */
    function initialize (
        address _raffleBeacon,
        address _accessManager
    ) external override initializer {
        // Parameters validation.
        if (_raffleBeacon == address(0)) {
            revert Errors.InvalidProxyAddress(_raffleBeacon);
        }
        if (_accessManager == address(0)) {
            revert Errors.ZeroAddress();
        }

        // Set raffle beacon address.
        raffleBeacon = _raffleBeacon;
        ownerAddress = msg.sender;

        // Initialization chain.
        __AccessManaged_init(
            _accessManager
        );
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    // ========== Upgrade Functions ==========
    /**
     * @dev See { UUPSUpgradeable-_authorizeUpgrade }.
     */
    function _authorizeUpgrade (
        address
    ) internal override restricted {}

    /**
     * @dev See { IFairHub-getVersion }.
     */
    function getVersion ()
     external pure override returns (
        uint256 version
    ) {
        return 2;
    }

        // ========== Get/Set Functions ==========
    /**
     * @dev See { IFairHub-getRaffleCount }.
     */
    function getRaffleCount()
     external view override returns (
        uint256 _counter
    ) {
        return _raffleCounter.current();
    }

    /**
     * @dev See { IFairHub-getYoloRaffleCount }.
     */
    function getYoloRaffleCount ()
     external view override returns (
        uint256 _counter
    ) {
        return _yoloRaffleCounter.current();
    }

    /**
     * @dev See { IFairHub-getRaffleAddress }.
     */
    function getRaffleAddress (
        uint256 _raffleId
    ) external view override returns (
        address _proxyAddress
    ) {
        return raffles[_raffleId];
    }

    /**
     * @dev See { IFairHub-getYoloRaffleAddress }.
     */
    function getYoloRaffleAddress (
        uint256 _yoloRaffleId
    ) external view returns (
        address _proxyAddress
    ) {
        return yoloRaffles[_yoloRaffleId];
    }

    /**
     * @dev See { IFairHub-getOwnedRaffles }.
     */
    function getOwnedRaffles ()
     external view override returns (
        uint256[] memory _raffleIds
    ) {
        return ownedRaffles[msg.sender];
    }

    /**
     * @dev See { IFairHub-getOwnedYoloRaffles }.
     */
    function getOwnedYoloRaffles ()
     external view returns (
        uint256[] memory _yoloRaffleIds
    ) {
        return ownedYoloRaffles[msg.sender];
    }

    /**
     * @dev See { IFairHub-getTreasury }.
     */
    function getTreasury ()
     external view override returns (
        address _treasury
    ) {
        return treasuryAddress;
    }

    /**
      * @dev See { IFairHub-getRaffleCut }.
      */
    function getRaffleCut ()
     external view override returns (
        uint256 _raffleCut
    ) {
        return raffleCut;
    }

    /**
     * @dev See { IFairHub-getYoloRaffleCut }.
     */
    function getYoloRaffleCut ()
     external view returns (
        uint256 _yoloRaffleCut
    ) {
        return yoloRaffleCut;
    }

    /**
     * @dev See { IFairHub-getCancelationFee }.
     */
    function getCancelationFee ()
     external view override returns (
        uint256 _cancelationFee
    ) {
        return cancelationFee;
    }

    /**
     * @dev See { IFairHub-getYoloRaffleDuration }.
     */
    function getYoloRaffleDuration ()
     external view returns (
        uint256 _yoloRoundDuration
    ) {
        return yoloRoundDuration;
    }

    /**
     * @dev See { IFairHub-getWinnerAirnodeAddress }.
     */
    function getWinnerAirnodeAddress ()
     external view returns (
        address _winnerAirnodeAddress
    ) {
        return winnerAirnodeAddress;
    }

    /**
     * @dev See { IFairHub-getVaultFactory }.
     */
    function getVaultFactory ()
     external view override returns (
        address _vaultFactory
    ) {
        return vaultFactoryAdress;
    }

    /**
     * @dev See { IFairHub-getVaultDepositRouter }.
     */
    function getVaultDepositRouter ()
     external view override returns (
        address _depositRouter
    ) {
        return depositRouterAddress;
    }

    /**
     * @dev See { IFairHub-getRaffleToken }.
     */
    function getRaffleToken (
        address _raffle
    ) external view override returns (
        address _token
    ) {
        return tokenRaffles[_raffle];
    }

    /**
     * @dev See { IFairHub-getDApiManager }.
     */
    function getDApiManager ()
     external view override returns (
        address _dApiManager
    ) {
        return dApiManagerAddress;
    }

    function owner ()
     external view override returns (
        address _owner
    ) {
        return ownerAddress;
    }

    /**
     * @dev See { IFairHub-setWinnerAirnodeAddress }.
     */
    function setWinnerAirnodeAddress (
        address _winnerAirnodeAddress
    ) external override restricted {
        // Parameters validation.
        if (
            _winnerAirnodeAddress == address(0)
        ) revert Errors.InvalidParameter();
        if (
            _winnerAirnodeAddress == winnerAirnodeAddress
        ) revert Errors.SameValueProvided();

        // Set new winner airnode address.
        winnerAirnodeAddress = _winnerAirnodeAddress;
    }

    /**
     * @dev See { IFairHub-setVaultFactoryAddress }.
     */
    function setVaultFactoryAddress (
        address _vaultFactoryAddress
    ) external override restricted {
        vaultFactoryAdress = _vaultFactoryAddress;
    }

    /**
     * @dev See { IFairHub-setDepositRouterAddress }.
     */
    function setDepositRouterAddress (
        address _depositRouterAddress
    ) external override restricted {
        depositRouterAddress = _depositRouterAddress;
    }

    /**
     * @dev See { IFairHub-setDApiManagerAddress }.
     */
    function setDApiManagerAddress (
        address _dApiManagerAddress
    ) external override restricted {
        dApiManagerAddress = _dApiManagerAddress;
    }

    /**
     * @dev See { IFairHub-setTreasuryAddress }
     */
    function setTreasuryAddress (
        address _treasuryAddress
    ) external override restricted {
        // Parameters validation.
        if (
            _treasuryAddress == address(0)
        ) revert Errors.InvalidParameter();
        if (
            _treasuryAddress == treasuryAddress
        ) revert Errors.SameValueProvided();

        // Set new treasury address.
        treasuryAddress = _treasuryAddress;
    }   

    /**
     * @dev See { IFairHub-setRaffleCut }
     */ 
    function setRaffleCut (
        uint256 _raffleCut
    ) external override restricted {
        // Parameters validation.
        if (
            _raffleCut > 100
        ) revert Errors.InvalidParameter();
        if (
            _raffleCut == raffleCut
        ) revert Errors.SameValueProvided();

        // Set new raffle cut.
        raffleCut = _raffleCut;
    }

    /**
     * @dev See { IFairHub-setCancelationFee }
     */ 
    function setCancelationFee (
        uint256 _cancelationFee
    ) external override restricted {
        // Parameters validation.
        if (
            _cancelationFee == cancelationFee
        ) revert Errors.SameValueProvided();

        // Set new raffle cut.
        cancelationFee = _cancelationFee;
    }

    /**
     * @dev See { IFairHub-setYoloRaffleCut }
     */
    function setYoloRaffleCut (
        uint256 _yoloRaffleCut
    ) external override restricted {
        // Parameters validation.
        if (
            _yoloRaffleCut > 100
        ) revert Errors.InvalidParameter();
        if (
            _yoloRaffleCut == yoloRaffleCut
        ) revert Errors.SameValueProvided();

        // Set new raffle cut.
        yoloRaffleCut = _yoloRaffleCut;
    }

    /**
     * @dev See { IFairHub-setYoloRaffleDuration }
     */
    function setYoloRaffleDuration (
        uint256 _roundDuration
    ) external override restricted {
        // Parameters validation.
        if (
            _roundDuration == 0
        ) revert Errors.InvalidParameter();
        if (
            _roundDuration == yoloRoundDuration
        ) revert Errors.SameValueProvided();

        // Set new raffle cut.
        yoloRoundDuration = _roundDuration;
    }

    /**
     * @dev See { IFairHub-setOwner }
     */
    function setOwner (
        address _owner
    ) external override restricted {
        // Parameters validation.
        if (
            _owner == address(0)
        ) revert Errors.InvalidParameter();
        if (
            _owner == ownerAddress
        ) revert Errors.SameValueProvided();

        // Set new owner address.
        ownerAddress = _owner;
    }

    // ========== Utilities Functions ==========
    /**
     * @dev See { IFairHub-pauseRaffles }.
     */
    function pauseRaffles ()
     external override restricted {
        _pause();
    }

    /**
     * @dev See { IFairhub-unpauseRaffles }.
     */
    function unpauseRaffles ()
     external override restricted {
        _unpause();
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IFairHub-createRaffle }.
     */
    function createRaffle (
        uint256 startTime,
        uint256 expectedEndTime,
        uint256 winnerNumber,
        uint256 ticketPrice,
        uint256 requiredBalance,
        DataTypes.Multihash memory metadata,
        DataTypes.TokenType currency,
        address tokenAddress
    ) external whenNotPaused {
        // Check for supported currency.
        if (
            currency != DataTypes.TokenType.ERC20 &&
            currency != DataTypes.TokenType.Native &&
            currency != DataTypes.TokenType.dApi
        ) revert Errors.InvalidCurrency();
        // Check for parameters.
        if (
            (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) &&
            tokenAddress == address(0)
        ) revert Errors.ZeroAddress();
        // Validate dApi token.
        if (
            currency == DataTypes.TokenType.dApi &&
            IDApiManager(dApiManagerAddress).getDApi(tokenAddress) == address(0)
        ) revert Errors.DApiNotRegistered();
        // Increment raffle counter.
        _raffleCounter.increment();
        uint256 _id = _raffleCounter.current();
        // Create raffle.
        bytes memory _data = abi.encodeWithSelector(
            Raffle.initialize.selector,
            msg.sender,
            _id,
            DataTypes.RaffleType.Traditional,
            startTime,
            expectedEndTime,
            winnerNumber,
            ticketPrice,
            requiredBalance,
            metadata,
            currency,
            address(this)
        );
        BeaconProxy _raffle = new BeaconProxy (
            address(raffleBeacon),
            _data
        );
        // Set token address.
        tokenRaffles[address(_raffle)] = tokenAddress;
        // Set raffle address.
        raffles[_id] = address(_raffle);
        ownedRaffles[msg.sender].push(_id);
        // Emit event.
        emit Events.RaffleCreated(
            _id,
            address(_raffle),
            DataTypes.RaffleType.Traditional
        );
    }

    /**
     * @dev See { IFairHub-createYoloRaffle }.
     */
    function createYoloRaffle(
        uint256 ticketPrice,
        DataTypes.TokenType currency,
        address tokenAddress
    ) external whenNotPaused restricted {
        // Check for supported currency.
        if (
            currency != DataTypes.TokenType.ERC20 &&
            currency != DataTypes.TokenType.Native &&
            currency != DataTypes.TokenType.dApi
        ) revert Errors.InvalidCurrency();
        // Check for parameters.
        if (
            (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) &&
            tokenAddress == address(0)
        ) revert Errors.ZeroAddress();
        // Validate dApi token.
        if (
            currency == DataTypes.TokenType.dApi &&
            IDApiManager(dApiManagerAddress).getDApi(tokenAddress) == address(0)
        ) revert Errors.DApiNotRegistered();
        // Increment yolo raffle counter.
        _yoloRaffleCounter.increment();
        uint256 _id = _yoloRaffleCounter.current();
        // Create raffle.
        bytes memory _data = abi.encodeWithSelector(
            Raffle.initialize.selector,
            address(this),
            _id,
            DataTypes.RaffleType.Yolo,
            block.timestamp,
            block.timestamp + yoloRoundDuration,
            1,
            ticketPrice,
            0,
            DataTypes.Multihash(
                bytes32(0),
                18,
                32
            ),
            currency,
            address(this)
        );
        BeaconProxy _raffle = new BeaconProxy (
            address(raffleBeacon),
            _data
        );
        // Create Vault for Prize.
        address[] memory _prizesTokens = new address[](1);
        address[] memory _assetVaults = new address[](1);
        uint256[] memory _prizesIds = new uint256[](1);
        (uint256 vaultId, address vaultAddress) = IVaultFactory(
            vaultFactoryAdress
        ).create(
            address(this)
        );
        _prizesTokens[0] = vaultFactoryAdress;
        _assetVaults[0] = vaultAddress;
        _prizesIds[0] = vaultId;
        // Approve deposit router to transfer prizes.
        IERC721(
            vaultFactoryAdress
        ).approve(
            depositRouterAddress,
            vaultId
        );
        // Open Raffle.
        Raffle raffleInstance = Raffle(address(_raffle));
        raffleInstance.open(
            _prizesTokens,
            _prizesIds
        );
        // Set Beneficiary.
        uint256[] memory vaultShare = new uint256[](1);
        vaultShare[0] = 100;
        raffleInstance.setBeneficiaries(
            _assetVaults,
            vaultShare
        );
        // Transfer back raffle to owner.
        raffleInstance.transferOwnership(
            msg.sender
        );
        // Set token address.
        tokenRaffles[address(_raffle)] = tokenAddress;
        // Set raffle address.
        yoloRaffles[_id] = address(_raffle);
        ownedYoloRaffles[msg.sender].push(_id);
        // Emit event.
        emit Events.RaffleCreated(
            _id,
            address(_raffle),
            DataTypes.RaffleType.Yolo
        );
    }
}
