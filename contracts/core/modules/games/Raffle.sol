// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

// Package imports
import { RaffleStorage } from "../../storage/RaffleStorage.sol";
import { IRaffle } from "../../../interfaces/IRaffle.sol";
import { IFairHub } from "../../../interfaces/IFairHub.sol";
import { IDApiManager } from "../../../interfaces/IDApiManager.sol";
import { IWinnerAirnode } from "../../../interfaces/IWinnerAirnode.sol";
import { IAssetVault } from "../../../interfaces/IAssetVault.sol";
import { IVaultFactory } from "../../../interfaces/IVaultFactory.sol";
import { IVaultDepositRouter } from "../../../interfaces/IVaultDepositRouter.sol";
import { DataTypes } from "../../../libraries/DataTypes.sol";
import { Events } from "../../../libraries/Events.sol";
import { Errors } from "../../../libraries/Errors.sol";
// Third party imports
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Raffle
 * @author API3 Latam
 *
 * @notice This is the implementation of the Raffle contract.
 * Including all the logic to operate an individual Raffle.
 */
contract Raffle is
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    RaffleStorage,
    IRaffle
{
    // ========== Libraries ==========
    using Address for address payable;

    // ========== Modifiers ==========
    /**
     * @notice Verifies whether the status is equal to 'Open' or not.
     * @dev Reverts with 'RaffleNotOpen' error.
     */
    modifier isOpen() {
        if (status != DataTypes.RaffleStatus.Open) {
            revert Errors.RaffleNotOpen();
        }
        _;
    }

    /**
     * @notice Verifies wether the status is equal to 'Open' or 'Unintialized'.
     * @dev Reverts with 'RaffleNotAvailable' error.
     */
    modifier isAvailable() {
        if (!(status == DataTypes.RaffleStatus.Unintialized ||
                status == DataTypes.RaffleStatus.Open)) {
            revert Errors.RaffleNotAvailable();
        }
        _;
    }

    /**
     * @notice Verifies wether the time for the raffle is still valid.
     * @dev Reverts with 'RaffleDue' error.
     */
    modifier notDue() {
        if ( block.timestamp > expectedEndTime ) {
            revert Errors.RaffleDue();
        }
        _;
    }

    modifier onlyManagers() {
        if (
            msg.sender != owner() &&
            msg.sender != IFairHub(fairHub).owner() &&
            msg.sender != fairHub
        ) {
            revert Errors.CallerNotOwner(msg.sender);
        }
        _;
    }

    // ========== Constructor/Initializer ==========
    /**
     * @dev Disables initializers, so contract can only be used trough proxies.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev See { IRaffle-initialize }.
     */
    function initialize (
        address _creatorAddress,
        uint256 _raffleId,
        DataTypes.RaffleType _raffleType,
        uint256 _startTime,
        uint256 _expectedEndTime,
        uint256 _winnerNumber,
        uint256 _ticketPrice,
        uint256 _requiredBalance,
        DataTypes.Multihash memory _metadata,
        DataTypes.TokenType _currency,
        address _fairHub
    ) external initializer nonReentrant {
        // Parameters' validations.
        if (
            _startTime < block.timestamp
        ) revert Errors.WrongInitializationParams(
            "Raffle: Invalid `startTime` parameter."
        );
        if (
            _expectedEndTime < _startTime
        ) revert Errors.WrongInitializationParams(
            "Raffle: Invalid `endTime` parameter."
        );
        if (
            _winnerNumber <= 0
        ) revert Errors.WrongInitializationParams(
            "Raffle: Invalid `winnerNumber` parameter."
        );
        if (
            address(_fairHub) == address(0)
        ) revert Errors.WrongInitializationParams(
            "Raffle: Invalid `fairHub` parameter."
        );

        // Set the parameters in storage.
        creatorAddress = _creatorAddress;
        raffleType = _raffleType;
        status = DataTypes.RaffleStatus.Unintialized;
        raffleId = _raffleId;
        startTime = _startTime;
        expectedEndTime = _expectedEndTime;
        winnerNumber = _winnerNumber;
        ticketPrice = _ticketPrice;
        requiredBalance = _requiredBalance;
        metadata = _metadata;
        currency = _currency;
        fairHub = _fairHub;

        // Initialize the inheritance chain.
        __Ownable_init();
        __ReentrancyGuard_init();

        // Execute setup functions.
        _transferOwnership(
            _creatorAddress
        );
    }

    // ========== Upgradability ==========
    /**
     * @dev See { IRaffle-getVersion }.
     */
    function getVersion ()
     external pure returns (
        uint256 version
    ) {
        return 2;
    }

    // ========== Internal Functions ==========
    function _handleBeneficiariesWithdraw ()
     internal view returns (
        uint256[] memory beneficiariesPercentages,
        address payable[] memory payableBeneficiaries,
        address[] memory normalBeneficiaries
    ) {
        // Initialize storage.
        uint256 arraySize = beneficiaries.length + (totalShare < 100 ? 1 : 0);
        
        uint256[] memory _percentages = new uint256[](arraySize);
        address payable[] memory _payableReceivers;
        address[] memory _normalReceivers;


        if (
            currency == DataTypes.TokenType.ERC20 ||
            currency == DataTypes.TokenType.dApi
        ) {
            _normalReceivers = new address [](arraySize);
        } else {
            _payableReceivers = new address payable[](arraySize);
        }

        // Add beneficiaries.
        for (
            uint256 i = 0;
            i < beneficiaries.length;
            i++
        ) {
            _percentages[i] = shares[beneficiaries[i]];
            if (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) {
                _normalReceivers[i] = beneficiaries[i];
            } else {
                _payableReceivers[i] = payable(beneficiaries[i]);
            }
        }

        // If the total share is less than 100, add the creator as beneficiary.
        if (
            totalShare < 100
        ) {
            _percentages[beneficiaries.length] = 100 - totalShare;
            if (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) {
                _normalReceivers[beneficiaries.length] = creatorAddress;
            } else {
                _payableReceivers[beneficiaries.length] = payable(creatorAddress);
            }
        }

        // Return.
        return (
            _percentages,
            _payableReceivers,
            _normalReceivers
        );
    }

    function _getCurrentPrice ()
     internal view returns (
        uint256 price
    ) {
        IFairHub fairHubInstance = IFairHub(fairHub);
        uint256 value = IDApiManager(
            fairHubInstance.getDApiManager()
        ).readDApi(
            fairHubInstance.getRaffleToken(
                address(this)
            )
        );
        // Safe check against zero price.
        if (
            value == 0
        ) {
            // Return a default value (1 WEI) which will be fraction
            // of cents.
            value = 1;
        }
        // Return the value.
        return value;
    }

    // ========== Overrides ==========
    function transferOwnership (
        address newOwner
    ) public onlyManagers isAvailable override {
        // Validate parameters
        if(
            newOwner == address(0)
        ) revert Errors.ZeroAddress();
        // Execute the transfer.
        _transferOwnership(newOwner);
    }

    // ========== Get/Set Functions ==========
    /**
     * @dev See { IRaffle-setRequester }.
     */
    function setRequester ()
     public onlyManagers isAvailable {
        winnerRequester = IFairHub(fairHub).getWinnerAirnodeAddress();
    }

    /**
     * @dev See { IRaffle-updateWinners }.
     */
    function updateWinners (
        uint256 _winnerNumbers
    ) external override onlyOwner {
        if (
            status != DataTypes.RaffleStatus.Unintialized
        ) revert Errors.RaffleAlreadyOpen();
        if (
            _winnerNumbers <= 0
        ) revert Errors.InvalidWinnerNumber();

        winnerNumber = _winnerNumbers;
    }

    /**
     * @dev See { IRaffle-updateMetadata }
     */
    function updateMetadata (
        DataTypes.Multihash memory _metadata
    ) external override onlyOwner {
        metadata = _metadata;
    }

    /**
     * @dev See { IRaffle-setBeneficiaries }
     */
    function setBeneficiaries (
        address[] memory _beneficiaries,
        uint256[] memory _shares
    ) external override onlyOwner isAvailable {
        // Initial validation.
        if (
            _beneficiaries.length != _shares.length
        ) revert Errors.BatchLengthMismatch();

        for (
            uint256 i;
            i < _beneficiaries.length;
            i++
        ) {
            // Additional validations.
            if (
                _beneficiaries[i] == address(0)
            ) revert Errors.ZeroAddress();
            if (
                _shares[i] == 0
            ) revert Errors.InvalidParameter();
            if (
                shares[_beneficiaries[i]] > 0
            ) revert Errors.ParameterAlreadySet();

            // Save the parameters in storage.
            beneficiaries.push(_beneficiaries[i]);
            shares[_beneficiaries[i]] = _shares[i];
            totalShare += _shares[i];
        }

        if (
            totalShare > 100
        ) revert Errors.InvalidParameter();

        // Emit function event.
        emit Events.SetRaffleBeneficiaries (
            _beneficiaries,
            _shares,
            raffleId,
            raffleType
        );
    }

    /**
     * @dev See { IRaffle-updateBeneficiary }
     */
    function updateBeneficiary (
        address _beneficiary,
        uint256 _share
    ) external override onlyOwner isAvailable {
        // Initial validation.
        if (
            _beneficiary == address(0)
        ) revert Errors.ZeroAddress();
        if (
            _share == 0
        ) revert Errors.InvalidParameter();
        if (
            shares[_beneficiary] == 0
        ) revert Errors.ParameterNotSet();

        uint256 oldShare = shares[_beneficiary];

        // Save the parameters in storage.
        totalShare -= shares[_beneficiary];
        shares[_beneficiary] = _share;
        totalShare += _share;

        if (
            totalShare > 100
        ) revert Errors.InvalidParameter();

        emit Events.UpdateRaffleBeneficiary (
            _beneficiary,
            oldShare,
            _share,
            raffleId,
            raffleType
        );
    }

    // ========== Core Functions ==========
    /**
     * @dev See { IRaffle-open }.
     */
    function open (
        address[] memory _tokens,
        uint256[] memory _ids
    ) external onlyOwner nonReentrant notDue {
        // Parameters' Validations.
        if (
            status != DataTypes.RaffleStatus.Unintialized
        ) revert Errors.RaffleAlreadyOpen();
        if (
            _tokens.length != winnerNumber
        ) revert Errors.InvalidWinnerNumber();
        if (
            _tokens.length != _ids.length
        ) revert Errors.BatchLengthMismatch();

        // Create the vaults for the raffle.
        IFairHub fairHubInstance = IFairHub(fairHub);
        IVaultFactory vFactory = IVaultFactory(
            fairHubInstance.getVaultFactory()
        );
        IVaultDepositRouter vRouter = IVaultDepositRouter(
            fairHubInstance.getVaultDepositRouter()
        );

        (prizesVaultId, prizesVaultAddress) = vFactory.create(address(this));
        (ticketsVaultId, ticketsVaultAddress) = vFactory.create(address(this));

        // Deposit the prizes in the vaults.
        vRouter.depositERC721(
            owner(),
            prizesVaultId,
            _tokens,
            _ids
        );

        // Set the requester.
        setRequester();
        
        // Save the parameters in storage.
        status = DataTypes.RaffleStatus.Open;
        tokens = _tokens;
        ids = _ids;

        // Emit function event.
        emit Events.RaffleOpened(
            raffleId,
            raffleType,
            prizesVaultAddress,
            ticketsVaultAddress,
            _tokens.length
        );
    }

    /**
     * @dev See { IRaffle-enter }.
     */
    function enter (
        address _participantAddress,
        uint256 _amount
    ) external override payable nonReentrant isOpen {
        // Validate startTime.
        if (
            block.timestamp < startTime
        ) revert Errors.RaffleNotOpen();
        // Validates the raffle status.
        if (
            (
                requiredBalance == 0 ||
                ticketsVaultAddress.balance > requiredBalance
            ) &&
            block.timestamp > expectedEndTime
        ) revert Errors.RaffleDue();

        // Additional parameters' validations.
        if (
            _amount == 0
        ) revert Errors.InvalidAmount();
        if (
            _participantAddress == address(0)
        ) revert Errors.ZeroAddress();
        
        // Pay for the ticket(s).
        IFairHub fairHubInstance = IFairHub(fairHub);
        IVaultDepositRouter vRouter = IVaultDepositRouter(
            fairHubInstance.getVaultDepositRouter()
        );

        address sender = _msgSender();
        uint256 totalAmount;

        if (
            ticketPrice > 0
        ) {
            // Calculate the total amount to be paid.
            if (
                currency == DataTypes.TokenType.dApi
            ) {
                // Get the current price from the DAPI.
                uint256 currentPrice = _getCurrentPrice();
                // Calculate the amount given a fixed ticket price.
                uint256 pricePerTicket = Math.mulDiv(
                    ticketPrice,
                    1e18,
                    currentPrice
                );
                totalAmount = pricePerTicket * _amount;
            } else {
                totalAmount = ticketPrice * _amount;
            }

            // Check whether the user sent the correct amount.
            if (
                msg.value != totalAmount &&
                currency == DataTypes.TokenType.Native
            ) revert Errors.InvalidAmount();

            // Send the actual funds to the vault.
            if (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) {
                IERC20 token = IERC20(
                    fairHubInstance.getRaffleToken(address(this))
                );
                vRouter.depositERC20(
                    _participantAddress,
                    sender,
                    ticketsVaultAddress,
                    address(token),
                    totalAmount
                );
            } else {
                // Register the transaction in the router.
                vRouter.depositNative{
                    value: totalAmount
                }(
                    _participantAddress,
                    ticketsVaultAddress,
                    totalAmount
                );
            }
        }

        // Save the participant in the raffle storage.
        if (
            entries[_participantAddress] == 0
        ) {
            participants.push(_participantAddress);
            entries[_participantAddress] = _amount;
            totalParticipants++;
        }
        else {
            entries[_participantAddress] += _amount;
        }

        totalEntries += _amount;

        // Save the senders in the raffle storage.
        if (
            totalAmount > 0
        ) {
            bool payerFound = false;
            for (
                uint256 i;
                i < payersAddresses.length;
                i++
            ) {
                // Check whether there's an existing payer entry already.
                if (
                    payersAddresses[i] == sender
                ) {
                    payers[sender] += totalAmount;
                    payerFound = true;
                    break;
                }
            }
            if (
                !payerFound
            ) {
                // If no payer found, create a new entry.
                payers[sender] = totalAmount;
                payersAddresses.push(
                    sender
                );
            }
        }

        // Emit function event.
        emit Events.RaffleEntered(
            raffleId,
            raffleType,
            _participantAddress,
            _amount
        );
    }

    /**
     * @dev See { IRaffle-close }.
     */
    function close ()
     external override nonReentrant isOpen {
        IFairHub fairHubInstance = IFairHub(fairHub);
        IERC20 token = IERC20(
            fairHubInstance.getRaffleToken(address(this))
        );

        // Validates the raffle status.
        if (
            requiredBalance == 0
        ) {
            // When balance is not required, anyone can close the raffle
            // after the expectedEndTime.
            if (
                block.timestamp < expectedEndTime
            ) revert Errors.EarlyClosing();
        } else {
            // As a balance is required, the owner or the fairHub owner
            // must acknowledge the closing, so they might extend the
            // raffle artificially by going above the initial `requiredBalance`
            // or await for the balance to reach the required amount by
            // going after the `expectedEndTime`.
            if (
                msg.sender != owner() &&
                msg.sender != fairHubInstance.owner()
            ) revert Errors.CallerNotOwner(msg.sender);
            // Handle ERC20 validation
            if (
                currency == DataTypes.TokenType.ERC20 &&
                token.balanceOf(ticketsVaultAddress) < requiredBalance
            ) revert Errors.EarlyClosing();
            // Handle dApi validation
            if (
                currency == DataTypes.TokenType.dApi
            ) {
                uint256 currentPrice = _getCurrentPrice();
                uint256 requiredAmount = Math.mulDiv(
                    requiredBalance,
                    1e18,
                    currentPrice
                );
                if (
                    token.balanceOf(ticketsVaultAddress) < requiredAmount
                ) revert Errors.EarlyClosing();
            }
            if (
                currency == DataTypes.TokenType.Native &&
                ticketsVaultAddress.balance < requiredBalance
            ) revert Errors.EarlyClosing();
        }
        
        // Additional parameters' validations.
        if (
            winnerRequester == address(0)
        ) revert Errors.ParameterNotSet();

        status = DataTypes.RaffleStatus.Close;

        IWinnerAirnode airnode = IWinnerAirnode(winnerRequester);
        IAssetVault prizeVault = IAssetVault(prizesVaultAddress);
        IAssetVault ticketVault = IAssetVault(ticketsVaultAddress);
        
        if (
            winnerNumber == 1
        ) {
            requestId = airnode.requestWinners (
                airnode.getIndividualWinner.selector, 
                winnerNumber,
                totalEntries
            );
        } else {
            requestId = airnode.requestWinners (
                airnode.getMultipleWinners.selector, 
                winnerNumber, 
                totalEntries
            );
        }

        // Set allowance for ticketVault if required.
        if (
            currency == DataTypes.TokenType.ERC20 ||
            currency == DataTypes.TokenType.dApi
        ) {
            IVaultFactory vFactory = IVaultFactory(
                fairHubInstance.getVaultFactory()
            );
            ticketVault.callApprove(
                address(token),
                vFactory.getDistributor(),
                token.balanceOf(ticketsVaultAddress)
            );
        }

        // Enable withdraws.
        prizeVault.enableWithdraw();
        ticketVault.enableWithdraw();

        // Emit function event.
        emit Events.RaffleClosed(
            raffleId,
            raffleType,
            requestId
        );
    }

    /**
     * @dev See { IRaffle-finish }.
     */
    function finish () 
     external override nonReentrant {
        // Parameters' validations.
        if (
            status != DataTypes.RaffleStatus.Close
        ) revert Errors.RaffleNotClose();

        IFairHub fairHubInstance = IFairHub(fairHub);

        uint256 pvBalance;
        if (
            currency == DataTypes.TokenType.ERC20 ||
            currency == DataTypes.TokenType.dApi
        ) {
            pvBalance = IERC20(
                fairHubInstance.getRaffleToken(address(this))
            ).balanceOf(ticketsVaultAddress);
        }
        if (
            currency == DataTypes.TokenType.Native
        ) {
            pvBalance = ticketsVaultAddress.balance;
        }

        // TODO: Check what happens with free raffles.
        if (
            pvBalance == 0
        ) revert Errors.InvalidVaultBalance();
        
        uint256 treasuryPercentage;
        if (
            raffleType == DataTypes.RaffleType.Traditional
        ) {
            treasuryPercentage = fairHubInstance.getRaffleCut();
        } else {
            treasuryPercentage = fairHubInstance.getYoloRaffleCut();
        }
        uint256 treasuryCut = (pvBalance * treasuryPercentage) / 100;
        uint256 availableVault = pvBalance - treasuryCut;
        address treasury = fairHubInstance.getTreasury();

        IWinnerAirnode airnode = IWinnerAirnode(winnerRequester);
        IAssetVault prizeVault = IAssetVault(prizesVaultAddress);
        IAssetVault ticketVault = IAssetVault(ticketsVaultAddress);

        // Request results and update winners.
        DataTypes.WinnerReponse memory winnerResults =  airnode.requestResults(
            requestId
        );

        for (
            uint256 i;
            i < winnerNumber;
            i++
        ) {
            winners.push(
                participants[winnerResults.winnerIndexes[i]]
            );
        }

        // Withdraw assets from vaults.
        for (
            uint256 i;
            i < winners.length;
            i++
        ) {
            prizeVault.withdrawERC721(
                tokens[i],
                ids[i],
                winners[i]
            );
        }

        address token = fairHubInstance.getRaffleToken(address(this));

        if (
            treasuryCut > 0
        ) {
            if (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) {
                ticketVault.withdrawERC20(
                    token,
                    treasury,
                    treasuryCut
                );
            } else {
                ticketVault.withdrawNative(
                    treasury,
                    treasuryCut
                );
            }
        }
        
        if (
            beneficiaries.length > 0
        ) {
            (
                uint256[] memory _percentages,
                address payable[] memory _payableReceivers,
                address[] memory _normalRecievers
            ) = _handleBeneficiariesWithdraw();

            ticketVault.batchPercentageWithdraw(
                _payableReceivers,
                _normalRecievers,
                _percentages,
                currency,
                token
            );
        } else {
            if (
                currency == DataTypes.TokenType.ERC20 ||
                currency == DataTypes.TokenType.dApi
            ) {
                ticketVault.withdrawERC20(
                    token,
                    creatorAddress,
                    availableVault
                );
            } else {
                ticketVault.withdrawNative(
                    creatorAddress,
                    availableVault
                );
            }
        }

        status = DataTypes.RaffleStatus.Finish;

        // Emit function event.
        emit Events.RaffleFinished(
            raffleId,
            raffleType,
            winnerResults.winnerIndexes,
            winners,
            availableVault,
            treasuryCut
        );
    }

    /**
     * @dev See { IRaffle-cancel }
     */
    function cancel ()
     external override payable onlyOwner nonReentrant isAvailable {
        // Required instances/values for core logic.
        IFairHub fairHubInstance = IFairHub(fairHub);
        uint256 cancelationFee = fairHubInstance.getCancelationFee();
        address treasury = fairHubInstance.getTreasury();

        // Check whether the creator sent the correct amount.
        if (
            msg.value != cancelationFee
        ) revert Errors.InvalidAmount();
    
        // Pay for cancelation.
        payable(treasury).sendValue(cancelationFee);

        // Workflow for returnal of assets.
        if (
            status == DataTypes.RaffleStatus.Open
        ) {
            // Retrieve additional shared values.
            IAssetVault prizeVault = IAssetVault(prizesVaultAddress);
            IAssetVault ticketVault = IAssetVault(ticketsVaultAddress);
            IVaultFactory vFactory = IVaultFactory(
                fairHubInstance.getVaultFactory()
            );
            address raffleToken = fairHubInstance.getRaffleToken(
                address(this)
            );

            // Transfer back entry tickets.
            if (
                payersAddresses.length > 0
            ) {
                // Get the total number of payers for initializing the array.
                uint256 totalPayers = payersAddresses.length;

                // Initialize the arrays for the batch withdraw.
                uint256[] memory _amounts = new uint256[](totalPayers);
                address payable[] memory _payableReceivers;
                address[] memory _recievers;

                if (
                    currency == DataTypes.TokenType.ERC20 ||
                    currency == DataTypes.TokenType.dApi
                ) {
                    _recievers = new address[](totalPayers);
                } else {
                    _payableReceivers = new address payable[](totalPayers);
                }

                // Fill in the arrays for `amount` based withdraw.
                // Where amount is calculated given the `totalAmount` calculation
                // at the time of `entering` the raffle.
                for (
                    uint256 i;
                    i < totalPayers;
                    i++
                ) {
                    _amounts[i] = payers[payersAddresses[i]];
                    if (
                        currency == DataTypes.TokenType.ERC20 ||
                        currency == DataTypes.TokenType.dApi
                    ) {
                        _recievers[i] = payersAddresses[i];
                    } else {
                        _payableReceivers[i] = payable(payersAddresses[i]);
                    }
                }
                
                // Before transfering back, we need to approve
                // the vault to spend the tokens.
                if (
                    currency == DataTypes.TokenType.ERC20 ||
                    currency == DataTypes.TokenType.dApi
                ) {
                    ticketVault.callApprove(
                        raffleToken,
                        vFactory.getDistributor(),
                        IERC20(raffleToken).balanceOf(
                            ticketsVaultAddress
                        )
                    );
                }

                // Execute the actual return.
                ticketVault.enableWithdraw();
                ticketVault.batchAmountWithdraw(
                    _payableReceivers,
                    _recievers,
                    _amounts,
                    currency,
                    raffleToken
                );
            }

            // Transfer back assets to creator.
            prizeVault.enableWithdraw();
            for (
                uint256 i;
                i < tokens.length;
                i++
            ) {
                prizeVault.withdrawERC721(
                    tokens[i],
                    ids[i],
                    creatorAddress
                );
            }
        }

        status = DataTypes.RaffleStatus.Canceled;

        // Emit function event.
        emit Events.RaffleCanceled(
            raffleId,
            raffleType,
            DataTypes.CancelationReason.CreatorDecision
        );
    }

    /**
     * @dev See { IRaffle-forceRecover }.
     */
    function forceRecover ()
     external override onlyManagers nonReentrant {
        // Validations.
        if (
            status == DataTypes.RaffleStatus.Finish
        ) revert Errors.RaffleAlreadyFinished();
        if (
            status == DataTypes.RaffleStatus.Unintialized
        ) revert Errors.RaffleNotOpen();

        IFairHub fairHubInstance = IFairHub(fairHub);
        address qfWallet = fairHubInstance.owner();
        IERC721 vaultFactory = IERC721(
            fairHubInstance.getVaultFactory()
        );

        vaultFactory.safeTransferFrom(
            address(this),
            qfWallet,
            ticketsVaultId
        );
        vaultFactory.safeTransferFrom(
            address(this),
            qfWallet,
            prizesVaultId
        );

        // Update storage.
        status = DataTypes.RaffleStatus.Canceled;

        // Emit function event.
        emit Events.RaffleCanceled(
            raffleId,
            raffleType,
            DataTypes.CancelationReason.ForcedCancelation
        );
    }
}
