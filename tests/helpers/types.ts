import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { BigNumber } from "ethers";
import type {
    Events,
    Errors,
    MockAirnodeLogic,
    MockAirnodeRrpV0,
    MockOwnableNFT,
    MockNFT,
    MockERC20,
    VaultFactory,
    AssetVault,
    VaultDepositRouter,
    Distributor,
    FairHub,
    Raffle,
    MockWinnerAirnode,
    MockPickerAirnode,
    WinnerAirnode,
    DApiManager,
    MockApi3ServerV1,
    MockDApiProxy,
    AccessManager,
    MockRestrictedFuncs
} from "../../typechain";

/**
 * Interface to be inherited by any other test fixture interface definition.
 * Includes the basic components for any setup fixture logic.
 * 
 * @param eventsLib The Events library contract use across the package.
 * @param deployer The deployer wallet for the contracts.
 */
interface BasicSetupFixture {
    eventsLib: Events,
    errorsLib: Errors,
    deployer: SignerWithAddress
}

/**
 * Interface for airnode module related tests.
 * Can be extended for specific airnode contracts.
 * @see {@link BasicSetupFixture} for the extended interface.
 * 
 * @param airnodeLogic A deployed instance of the AirnodeLogic mock contract.
 * @param rrpAddress The address for the rrp to be used by the requester.
 * @param mock The mock signer to use instead of an actual airnode address.
 * @param sponsor The signer for the simulated sponsor wallet.
 * @param derived The signer for the derived wallet from the sponsor to use.
 */
export interface AirnodeSetupFixture extends BasicSetupFixture {
    airnodeLogic: MockAirnodeLogic,
    mockRrpV0: MockAirnodeRrpV0,
    mock: SignerWithAddress,
    sponsor: SignerWithAddress,
    derived: SignerWithAddress
}


/**
 * Interface for DApiManager contract related tests.
 * 
 * @param dapiManager A deployed instance of the DApiManager contract.
 * @param mockApi3Server A deployed instance of the MockApi3ServerV1 contract.
 * @param dapiProxies A list of deployed instances of the MockDApiProxy contract.
 * @param ops The signer to be used as the operational address.
 */
export interface DApiManagerSetupFixture extends BasicSetupFixture {
    dapiManager: DApiManager,
    mockApi3Server: MockApi3ServerV1,
    dapiProxies: {
        [index: string]: {
            [index: string]: MockDApiProxy | MockERC20 | BigNumber
        }
    },
    ops: SignerWithAddress
}

/**
 * Interface for AccessControlLogic (ACL) module related tests.
 *
 * @param accessManager A deployed instance of the AccessManager contract.
 * @param mockContract A deployed instance of the MockRestrictedFuncs contract.
 * @param roleAdmin The signer to be used as the role admin.
 * @param supervisor The signer to be used as the supervisor.
 * @param user The signer to be used as a user.
 * @param testRoleId The test role id to be used in the tests.
 */
export interface AccessControlSetupFixture extends BasicSetupFixture {
    accessManager: AccessManager,
    mockContract: MockRestrictedFuncs,
    roleAdmin: SignerWithAddress,
    supervisor: SignerWithAddress,
    user: SignerWithAddress,
    testRoleId: string
}

/**
 * Interface for OwnableNFT related tests.
 * 
 * @param ownableNft A deployed instance of the OwnableNFT mock contract.
 * @param mockNFt A deployed instance of a MockNFT contract.
 * @param owner The signer to be used as owner of the NFT contract.
 * @param user A second signer to test modifier against.
 * @param extra An extra signer in case is required for further experimentation.
 */
export interface OwnableNFTFixture {
    ownableNft: MockOwnableNFT,
    mockNft: MockNFT,
    errorsLib: Errors,
    owner: SignerWithAddress,
    user: SignerWithAddress,
    extra: SignerWithAddress 
}

/**
 * Type definition for the qrngData object.
 * @see {@link scripts/utils/getQrngData} for function return value.
 */
type qrngDataType = {
    [index: string]: string
}


/**
 * Interface for WinnerAirnode related tests.
 * @see {@link AirnodeSetupFixture} for the extended interface.
 * 
 * @param winnerAirnode A deployed instance of the MockWinnerAirnode contract.
 * @param qrngData The qrngData object to be used in the tests.
 */
export interface WinnerAirnodeFixture extends AirnodeSetupFixture {
    winnerAirnode: MockWinnerAirnode,
    qrngData: qrngDataType
}


/**
 * Interface for PickerAirnode related tests.
 * @see {@link AirnodeSetupFixture} for the extended interface.
 * 
 * @param pickerAirnode A deployed instance of the MockPickerAirnode contract.
 * @param qrngData The qrngData object to be used in the tests.
 */
export interface PickerAirnodeFixture extends AirnodeSetupFixture {
    pickerAirnode: MockPickerAirnode,
    qrngData: qrngDataType
}


/**
 * Interface for vault related modules.
 * Might be extended for the specific contract inside the module.
 * @see {@link BasicSetupFixture} for the extended interface.
 * 
 * @param vaultFactory The deployed `VaultFactory` contract instance.
 * @param assetVault The deployed `AssetVault` contract instance.
 * @param user A signer to be use as a user wallet.
 */
export interface VaultSetupFixture extends BasicSetupFixture {
    vaultFactory: VaultFactory,
    assetVault: AssetVault,
    distributor: Distributor,
    mockNft: MockNFT,
    mockErc20: MockERC20,
    user: SignerWithAddress,
    extra: SignerWithAddress
}

/**
 * Interface for `VaultDepositRouter` contract tests.
 * @see {@link VaultSetupFixture} for the extended interface.
 * 
 * @param vaultDepositRouter A deployed instance from `VaultDepositRouter` contract.
 */
export interface DepositRouterFixture extends VaultSetupFixture {
    vaultDepositRouter: VaultDepositRouter
}

/**
 * Interface for `Distributor` contract tests.
 * @see {@link BasicSetupFixture} for the extended interface.
 */
export interface DistributorSetup extends BasicSetupFixture {
    distributor: Distributor,
    mockErc20: MockERC20,
    user: SignerWithAddress,
    extra: SignerWithAddress
}

/**
 * Interface for `FairHub` contract tests.
 * @see {@link BasicSetupFixture} for the extended interface.
 * 
 * @param fairHub The FairHub deployed instance.
 * @param creator The address to be used for creating raffles.
 * @param extra Another address to use in the raffle dynamics. 
 */
export interface FairHubFixture extends BasicSetupFixture {
    fairHub: FairHub,
    creator: SignerWithAddress,
    extra: SignerWithAddress,
    opt: SignerWithAddress,
    treasury: SignerWithAddress
}

/**
 * Interface for `Raffle` contract tests.
 * @see {@link FairHubFixture} for the extended interface.
 * 
 * @param raffle A Raffle instance created from the FairHub.
 * @param fairHub A FairHub instance from which the raffle was created.
 * @param mockRrpV0 An instance of the RrpV0 protocol contract.
 * @param winnerAirnode An instance of the WinnerAirnode contract to be used as requester.
 * @param vaultFactory An instance of the VaultFactory contract.
 * @param depositRouter An instance of the VaultDepositRouter contract.
 * @param mockNft A MockNFT deployed instance.
 * @param mockErc20 A MockERC20 deployed instance.
 * @param participant An address to mimick a participant in a raffle.
 * @param raffleStart The startTime parameter for the instantiated `Raffle`.
 * @param rafflePrice The price parameter for the instantiated `Raffle`.
 * @param dapiProxies A list of information regarding the dApi proxy module.
 */
export interface RaffleFixture extends FairHubFixture {
    raffle: Raffle,
    fairHub: FairHub,
    mockRrpV0: MockAirnodeRrpV0,
    winnerAirnode: WinnerAirnode,
    vaultFactory: VaultFactory,
    depositRouter: VaultDepositRouter,
    mockNft: MockNFT,
    mockErc20: MockERC20,
    participant: SignerWithAddress,
    raffleStart: number,
    rafflePrice: BigNumber,
    dapiProxy: {
        [index: string]: MockDApiProxy | MockApi3ServerV1 | BigNumber
    }
}