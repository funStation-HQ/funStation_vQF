// Set of functions and interfaces/types used in fixtures across the tests.

import { ethers, upgrades } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { getEmittedArgument } from "./utils";
import {
    deriveSelector,
    getQrngData,
    getRoleId
} from "../../scripts/utils";
import { TokenType } from "./dataTypes";
import {
    AirnodeSetupFixture,
    DApiManagerSetupFixture,
    AccessControlSetupFixture,
    OwnableNFTFixture,
    WinnerAirnodeFixture,
    PickerAirnodeFixture,
    VaultSetupFixture,
    DepositRouterFixture,
    DistributorSetup,
    RaffleFixture
} from "./types";
import { 
    Events__factory,
    Errors__factory,
    MockOwnableNFT__factory,
    MockAirnodeLogic__factory,
    MockAirnodeRrpV0__factory,
    MockApi3ServerV1__factory,
    MockDApiProxy__factory,
    MockWinnerAirnode__factory,
    MockNFT__factory,
    MockERC20__factory,
    MockPickerAirnode__factory,
    WinnerAirnode__factory,
    AssetVault__factory,
    Distributor__factory,
    Raffle__factory,
    RaffleBeacon__factory,
    MockERC20,
    AccessManager,
    MockRestrictedFuncs,
    VaultFactory,
    AssetVault,
    VaultDepositRouter,
    Distributor,
    FairHub,
    Raffle,
    DApiManager
} from "../../typechain";

/**
 * Fixture to get accounts from hardhat network.
 * 
 * @returns An object containing 5 wallets for usage.
 */
export async function getAccounts() {
    const [ deployer, user, creator, additional, 
        external, extra, treasury, opt ] = await ethers.getSigners();
    return { deployer, user, creator,
        additional, external, extra, treasury, opt }
}

/**
 * Fixture to get `Events` library contract.
 * 
 * @notice Event library deployment is only needed for testing
 * and is not reproduced in the live environment.
 * @returns An instance of Events contract.
 */
export async function getEventsLibrary() {
    const { deployer } = await loadFixture(getAccounts)
    return await new Events__factory(deployer).deploy();
}

export async function getErrorsLibrary() {
    const { deployer } = await loadFixture(getAccounts);
    return await new Errors__factory(deployer).deploy();
}

/**
 * Basic setup fixture for airnode related contracts.
 * @see {@link AirnodeSetupFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `AirnodeSetupFixture`.
 */
export async function airnodeLogicSetup (
): Promise<AirnodeSetupFixture> {
    const { 
        deployer, 
        user: mock,
        external: sponsor,
        extra: derived } = await loadFixture(getAccounts);
    const eventsLib = await loadFixture(getEventsLibrary);
    const errorsLib = await loadFixture(getErrorsLibrary);

    const mockRrpV0 = await new MockAirnodeRrpV0__factory(deployer).deploy();
    const airnodeLogic = await new MockAirnodeLogic__factory(deployer
        ).deploy(
        mockRrpV0.address
    );

    return { airnodeLogic, eventsLib, errorsLib,
        mockRrpV0, deployer, mock, 
        sponsor, derived }
}

/**
 * Setup fixture for `OwnableNFT` tests.
 * @see {@link OwnableNFTFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `OwnableNFTFixture`.
 */
export async function ownableNFTSetup (
): Promise<OwnableNFTFixture> {
    const { deployer,
        external: owner,
        user,
        extra } = await loadFixture(getAccounts);
    const errorsLib = await loadFixture(getErrorsLibrary);

    const ownableNft = await new MockOwnableNFT__factory(deployer).deploy();
    const mockNft = await new MockNFT__factory(deployer).deploy(
        "Mock NFT",
        "MOCK"
    );
    
    return { ownableNft, mockNft, 
        errorsLib, owner,
        user, extra }
}

/**
 * Setup fixture for `Distributor` tests.
 * @see {@link DistributorSetup} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `DistributorSetup`.
 */
export async function distributorSetup (
): Promise<DistributorSetup> {
        const { deployer, user, 
            extra } = await loadFixture(getAccounts);
        const eventsLib = await loadFixture(getEventsLibrary);
        const errorsLib = await loadFixture(getErrorsLibrary);
    
        const distributor = (await (
            new Distributor__factory(deployer)
        ).deploy()) as Distributor;
    
        const mockErc20 = await (
            new MockERC20__factory(deployer)
        ).deploy() as MockERC20;
    
        return { eventsLib, errorsLib, deployer, user, extra,
            distributor, mockErc20 }
    }


/**
 * Setup fixture for `WinnerAirnode` tests.
 * @see {@link WinnerAirnodeFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `WinnerAirnodeFixture`.
 */
export async function winnerAirnodeSetup(
): Promise<WinnerAirnodeFixture> {
    const {
        airnodeLogic,
        eventsLib,
        errorsLib,
        mockRrpV0,
        deployer,
        mock,
        sponsor,
        derived
    } = await airnodeLogicSetup();

    const qrngData = getQrngData(-1);

    const winnerAirnode = await new MockWinnerAirnode__factory(deployer).deploy(
        mockRrpV0.address
    );

    await (
        await winnerAirnode.setRequestParameters(
            mock.address,
            sponsor.address,
            derived.address
        )
    ).wait();
    
    await(
        await winnerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256"],
            "getIndividualWinner(bytes32,bytes)"
        )
    ).wait();

    await(
        await winnerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256Array"],
            "getMultipleWinners(bytes32,bytes)"
        )
    ).wait();

    return {
        airnodeLogic,
        eventsLib,
        errorsLib,
        mockRrpV0,
        deployer,
        mock,
        sponsor,
        derived,
        winnerAirnode,
        qrngData
    }
}


/**
 * Setup fixture for `PickerAirnode` tests.
 * @see {@link PickerAirnodeFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `PickerAirnodeFixture`.
 */
export async function pickerAirnodeSetup(
): Promise<PickerAirnodeFixture> {
    const {
        airnodeLogic,
        eventsLib,
        errorsLib,
        mockRrpV0,
        deployer,
        mock,
        sponsor,
        derived
    } = await airnodeLogicSetup();

    const qrngData = getQrngData(-1);

    const pickerAirnode = await new MockPickerAirnode__factory(
        deployer
    ).deploy(
        mockRrpV0.address
    );

    await (await pickerAirnode.setRequestParameters(
        mock.address,
        sponsor.address,
        derived.address
    )).wait();
    
    await(
        await pickerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256"],
            "getNumber(bytes32,bytes)"
        )
    ).wait();

    await(
        await pickerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256Array"],
            "getMultipleNumbers(bytes32,bytes)"
        )
    ).wait();

    return {
        airnodeLogic,
        eventsLib,
        errorsLib,
        mockRrpV0,
        deployer,
        mock,
        sponsor,
        derived,
        pickerAirnode,
        qrngData
    }
}


/**
 * Setup fixture for `DApiManager` tests.
 * @see {@link DApiManagerSetupFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `DApiManagerSetupFixture`.
 */
export async function dApiManagerSetup (
): Promise<DApiManagerSetupFixture> {
    const { deployer, user: ops } = await loadFixture(getAccounts);
    const eventsLib = await loadFixture(getEventsLibrary);
    const errorsLib = await loadFixture(getErrorsLibrary);

    const mockApi3Server = await new MockApi3ServerV1__factory(
        deployer
    ).deploy();

    const firstProxyHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
            "firstProxy"
        )
    );
    const firstProxy = await new MockDApiProxy__factory(
        deployer
    ).deploy(
        mockApi3Server.address,
        firstProxyHash
    );
    const firstToken = await new MockERC20__factory(
        deployer
    ).deploy() as MockERC20;
    const secondProxyHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
            "secondProxy"
        )
    );
    const secondProxy = await new MockDApiProxy__factory(
        deployer
    ).deploy(
        mockApi3Server.address,
        secondProxyHash
    );
    const secondToken = await new MockERC20__factory(
        deployer
    ).deploy() as MockERC20;

    const dapiManager = await upgrades.deployProxy(
        await ethers.getContractFactory("DApiManager"),
        [],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as DApiManager;

    await dapiManager.deployed();

    const firstProxyValue = ethers.utils.parseEther("1.99");
    await mockApi3Server.updateBeaconWithSignedData(
        firstProxyHash,
        Date.now(),
        firstProxyValue
    );

    await dapiManager.setDApi(
        firstToken.address,
        firstProxy.address
    );

    return {
        dapiManager,
        mockApi3Server,
        dapiProxies: {
            firstProxyHash: {
                "proxy": firstProxy,
                "token": firstToken,
                "value": firstProxyValue
            },
            secondProxyHash: {
                "proxy": secondProxy,
                "token": secondToken
            }
        },
        ops,
        deployer,
        eventsLib,
        errorsLib
    }
}

/**
 * Basic setup fixture for access control related contracts.
 * @see {@link AccessControlSetupFixture} For the expected returned key/values.
 * 
 * @return An object with instances from defined types in `AccessControlSetupFixture`.
 */
export async function aclSetup (
): Promise<AccessControlSetupFixture> {
    const { 
        deployer, user,
        creator: roleAdmin,
        additional: supervisor
    } = await loadFixture(getAccounts);
    const eventsLib = await loadFixture(getEventsLibrary);
    const errorsLib = await loadFixture(getErrorsLibrary);
    
    const accessManager = await upgrades.deployProxy(
        await ethers.getContractFactory("AccessManager"),
        [
            roleAdmin.address
        ],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as AccessManager;

    await accessManager.deployed();
        
    const mockContract = await upgrades.deployProxy(
        await ethers.getContractFactory("MockRestrictedFuncs"),
        [
            accessManager.address
        ],
        {
            initializer: "initialize",
            "unsafeAllow": ["constructor"],
            kind: "uups"
        }
    ) as MockRestrictedFuncs;

    const testRoleId = getRoleId("TEST_ROLE");
                    
    return {
        accessManager,
        mockContract,
        roleAdmin,
        supervisor,
        user,
        deployer,
        eventsLib,
        errorsLib,
        testRoleId
    }
}

/**
 * Basic setup fixture for vault related contracts.
 * @see {@link VaultSetupFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `AirnodeSetupFixture`.
 */
export async function assetVaultSetup (
): Promise<VaultSetupFixture> {
    const { deployer, 
        user, extra } = await loadFixture(getAccounts);
    const eventsLib = await loadFixture(getEventsLibrary);
    const errorsLib = await loadFixture(getErrorsLibrary);

    // Deploy factory for creating vaults.
    const assetVaultLogic = await new AssetVault__factory(deployer).deploy();

    const vaultFactory = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultFactory"), 
        [assetVaultLogic.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultFactory;

    await vaultFactory.deployed();

    // Deploy distributor for being attached to vaults.
    const distributor = (await (
        new Distributor__factory(deployer)
    ).deploy()) as Distributor;
    await vaultFactory.setDistributor(
        distributor.address
    );
    
    // Deploy vault for testing.
    const vaultCreationTx = await (await vaultFactory.create(
        deployer.address
    )).wait();
    const vaultCreationArgs = getEmittedArgument(
        vaultCreationTx,
        eventsLib,
        "VaultCreated",
        1
    ) as string[];
    const vaultAddress = vaultCreationArgs.filter(arg => {
        if (arg !== undefined) {
            return arg
        }
    });

    // Get vault instance.
    const assetVault = await ethers.getContractAt(
        "AssetVault", 
        vaultAddress[0]
    ) as AssetVault;

    const mockNft = await new MockNFT__factory(deployer).deploy(
        "Mock NFT",
        "MOCK"
    );
    const mockErc20 = await new MockERC20__factory(deployer).deploy(
    ) as MockERC20;

    return {
        eventsLib,
        errorsLib,
        deployer,
        vaultFactory,
        assetVault,
        distributor,
        mockNft,
        mockErc20,
        user,
        extra
    }
}

/**
 * Basic setup fixture for DepositRouter related tests.
 * @see {@link DepositRouterFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `DepositRouterFixture`.
 */
export async function depositRouterSetup (
): Promise<DepositRouterFixture> {
    const { deployer, user,
        extra, eventsLib, errorsLib,
        mockNft, mockErc20, assetVault, 
        vaultFactory, distributor } = await loadFixture(assetVaultSetup);

    const depositRouter = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultDepositRouter"),
        [vaultFactory.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultDepositRouter;

    await depositRouter.deployed();
    
    return { deployer, user, 
        extra, eventsLib, errorsLib,
        mockNft, mockErc20, vaultFactory, assetVault,
        distributor,
        vaultDepositRouter: depositRouter }
}

/**
 * Basic setup fixture for Raffle related tests.
 * @see {@link RaffleFixture} For the expected returned key/values.
 * 
 * @returns An object with instances from defined types in `RaffleFixture`.
 */
export async function raffleSetup (
): Promise<RaffleFixture> {
    const { deployer, user: participant,
        creator, external: mock,
        additional, extra,
        treasury, opt } = await loadFixture(getAccounts);
    const eventsLib = await loadFixture(getEventsLibrary);
    const errorsLib = await loadFixture(getErrorsLibrary);

    // Deploy distributor for being attached to vaults.
    const distributor = (await (
        new Distributor__factory(deployer)
    ).deploy()) as Distributor;

    // ACL
    const accessManager = await upgrades.deployProxy(
        await ethers.getContractFactory("AccessManager"),
        [
            deployer.address
        ],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as AccessManager;
    await accessManager.deployed();

    // Vault related setup
    const assetVaultLogic = await new AssetVault__factory(deployer).deploy();
    
    const vaultFactory = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultFactory"), 
        [assetVaultLogic.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultFactory;
    await vaultFactory.deployed();
    await vaultFactory.setDistributor(
        distributor.address
    );

    const depositRouter = await upgrades.deployProxy(
        await ethers.getContractFactory("VaultDepositRouter"),
        [vaultFactory.address],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as VaultDepositRouter;
    await depositRouter.deployed();

    // Mocks
    const mockNft = await new MockNFT__factory(deployer).deploy(
        "Mock NFT",
        "MOCK"
    );
    const mockErc20 = await new MockERC20__factory(deployer).deploy();

    // Airnode related setup
    const mockRrpV0 = await new MockAirnodeRrpV0__factory(deployer).deploy();
    const winnerAirnode = await new WinnerAirnode__factory(deployer).deploy(
        mockRrpV0.address
    );
    await winnerAirnode.setRequestParameters(
        mock.address,
        deployer.address,
        additional.address
    );

    const qrngData = getQrngData(-1);
    await (
        await winnerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256"],
            "getIndividualWinner(bytes32,bytes)"
        )
    ).wait();
    await (
        await winnerAirnode.addNewEndpoint(
            qrngData["endpointIdUint256Array"],
            "getMultipleWinners(bytes32,bytes)"
        )
    ).wait();

    // DApi Manager
    const mockApi3Server = await new MockApi3ServerV1__factory(
        deployer
    ).deploy();
    const tokenProxyHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
            "TEST"
        )
    );
    const tokenProxyValue = ethers.utils.parseEther("10.0");
    const tokenProxy = await new MockDApiProxy__factory(
        deployer
    ).deploy(
        mockApi3Server.address,
        tokenProxyHash
    );

    const dapiManager = await upgrades.deployProxy(
        await ethers.getContractFactory("DApiManager"),
        [],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as DApiManager;

    await dapiManager.deployed();

    await mockApi3Server.updateBeaconWithSignedData(
        tokenProxyHash,
        Date.now(),
        tokenProxyValue
    );

    await dapiManager.setDApi(
        mockErc20.address,
        tokenProxy.address
    );


    // Raffle related setup
    const raffleLogic = await new Raffle__factory(deployer).deploy();
    const raffleBeacon = await new RaffleBeacon__factory(deployer).deploy(
        raffleLogic.address
    );

    const fairHub = await upgrades.deployProxy(
        await ethers.getContractFactory("FairHub"),
        [
            raffleBeacon.address,
            accessManager.address
        ],
        {
            initializer: "initialize",
            unsafeAllow: ["constructor"],
            kind: "uups"
        }
    ) as FairHub;
    await fairHub.deployed();

    // Setup ACL
    const managerRole = getRoleId("MANAGER_ROLE");

    await accessManager.grantRole(
        managerRole,
        deployer.address
    );
    
    const targetFunctionsNames = [
        "setWinnerAirnodeAddress",
        "setVaultFactoryAddress",
        "setDepositRouterAddress",
        "setDApiManagerAddress",
        "setTreasuryAddress",
        "setRaffleCut",
        "setCancelationFee",
        "setYoloRaffleCut",
        "setYoloRaffleDuration",
        "setOwner",
        "pauseRaffles",
        "unpauseRaffles",
        "createYoloRaffle"
    ]
    const targetFunctionsSelectors = targetFunctionsNames.map(
        name => deriveSelector(
            fairHub.interface.getFunction(
                // @ts-ignore
                name
            )
        )
    );

    await accessManager.setTargetFunctionRole(
        fairHub.address,
        targetFunctionsSelectors,
        managerRole
    );


    // Setup FairHub
    await fairHub.setWinnerAirnodeAddress(
        winnerAirnode.address
    );
    await fairHub.setDApiManagerAddress(
        dapiManager.address
    );
    await fairHub.setVaultFactoryAddress(
        vaultFactory.address
    );
    await fairHub.setDepositRouterAddress(
        depositRouter.address
    );
    await fairHub.setTreasuryAddress(
        treasury.address
    );
    await fairHub.setRaffleCut(5);
    await fairHub.setYoloRaffleCut(5);
    await fairHub.setCancelationFee(
        ethers.utils.parseUnits("1", "gwei")
    );
    await fairHub.setYoloRaffleDuration(
        // 60 seconds * 60 minutes = 1 hour
        60 * 60
    );
    
    const currentTime = await time.latest() + 60;
    const creatorHub = fairHub.connect(creator);
    const ticketPrice = ethers.utils.parseEther("1.0");

    await (await creatorHub.createRaffle(
        currentTime,
        currentTime + 300, // This equals to 5 minutes
        1,
        ticketPrice,
        ethers.utils.parseEther("2.0"),
        {
            hash: ethers.utils.randomBytes(32),
            hash_function: 18,
            size: 32
        },
        TokenType.Native,
        ethers.constants.AddressZero
    )).wait();
    const raffleAddress = await fairHub.getRaffleAddress(1);
    const raffleContract = await ethers.getContractAt(
        "Raffle",
        raffleAddress
    ) as Raffle;
    const raffle = raffleContract.connect(creator);

    await time.increase(60);

    return { deployer, participant, extra, opt,
        creator, treasury, eventsLib, errorsLib, 
        fairHub, raffle, vaultFactory,
        depositRouter, mockNft, mockErc20,
        mockRrpV0, winnerAirnode,
        raffleStart: currentTime,
        rafflePrice: ticketPrice,
        dapiProxy: {
            'value': tokenProxyValue,
            'proxy': tokenProxy,
            'server': mockApi3Server
        }
    }
}
