# QuantumFair Contracts

Contracts for QuantumFair platform from API3 Latam.

## Contracts

### Technical Design Considerations

- The layout of the package follows a structured inspired by Lens Protocol, in which we compartmentalize the constants values shared across different modules in libraries packs.
- The safe keeping of assets is greatly based out of arcadexyz protocol, you can find more regarding the vaults in their [github](https://github.com/arcadexyz/v2-contracts/tree/main/contracts/vault).
- The access control logic is inspired by the latest openzeppelin v5 contracts for ACL management, copying most of the original code from their [repo](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/v5.0.1/contracts/access/manager).
- Regarding the airnode requester and dApis you can find more on the API3 docs for each respective technology.
  - [Airnode/QRNG](https://docs.api3.org/reference/qrng/)
  - [DApis](https://docs.api3.org/reference/dapis/understand/)
- The distributor contract is inspired by a reputable dapp called Dispersed, you can find more about their implementation on their published [paper](https://disperse.app/disperse.pdf). The contract is also available on [etherscan](https://etherscan.io/address/0xD152f549545093347A162Dce210e7293f1452150#code).

### Contract Package Layout

- `core`: The main contracts for the platform handling all the business logic.
  - `FairHub.sol:FairHub`: Entry point for all interactions with the platform. Initializes proxies for each available service.
  - `Raffle.sol:Raffle`: Main logic definitions for individual raffles. Implemented trough a BaconProxy pattern.
  - `Distributor.sol:Distributor`: Distributor responsible for handling the batch transfer of native ETH and ERC20 tokens.
  - `storage`: Storage layout for core contracts.
    - `FairHubStorage.sol:FairHubStorage`: Abstract layout for FairHub implementation.
    - `RaffleStorage.sol:RaffleStorage`: Abstract layout for Raffle implementation.
  - `base`: Base abstract contracts to be inherited by core implementations, containing reusable logic.
    - `AirnodeLogic.sol:AirnodeLogic`: Common functions for a requester implementation. Contains basic utilities and critical outlines for function implementations.
    - `OwnableNFT.sol:OwnableNFT`: Logic for ACL trough token ownership.
  - `modules`
    - `acl`: Access control logic for the platform.
      - `AccessManaged.sol:AccessManaged`: Entity dependency to be managed by the AccessManager. It should be applied to any contract that needs to be managed by the AccessManager.
      - `AccessManager.sol:AccessManager`: Manages the access control logic for the platform at a granular level.
    - `airnodes`: All the airnode implementations being used across the platform.
      - `WinnerAirnode.sol:WinnerAirnode`: QRNG Airnode implementation for picking a 'winner' out of an array of addresses.
    - `dapis`: Contracts related with dAPIs.
      - `DApiManager.sol:DApiManager`: Manages the dAPIs available for the platform.
    - `vault`: Vault module for safekeeping assets across the platform.
      - `AssetVault.sol:AssetVault`: Single vault implementation, intended to be used trough the clonable pattern for instantiating new vaults.
      - `VaultDepositRouter.sol:VaultDepositRouter`: Router for depositing assets into the vaults, helps with tracking and logging.
      - `VaultFactory.sol:VaultFactory`: Factory logic for creating new AssetVaults.
- `development`: Contracts under development, yet to be fully implemented nor tested.
- `interfaces`: Different interfaces for the core contracts.
- `libraries`: Set of utilities shared across the package.
  - `DataTypes.sol:DataTypes`: All the custom data types used across the platform.
  - `Errors.sol:Errors`: All the custom errors used across the platform.
  - `Events.sol:events`: All the custom defined events used across the platform.
- `mocks`: Mocks for testing purposes.
- `upgradeability`: **DEPRECATED**.

## Development Framework: Hardhat

For the development framework we picked Hardhat as it was the tool we were more familiarized with and also provides all the required tools for the job.

### Testing

Until this point we have not kept and exactly metric on test coverage, but most of the critical logic has been tested and we are working on increasing the coverage. We expect to introduce additional tooling for keeping track of exact metrics on coverage and testing.

**Overview**
The tests folder follows the same pattern as the contract layout, under the path `tests/core`. Each contract has two files, one for the test *spec* which kind of orchestrate the test execution and defined any additional functionality for the tests to run, in addition to testing the most basic things like parametrization of a contract, and there's the other file for the actual behavioral testing, which goes trough each critical function and tests the expected behavior under different scenarios.

**Utilities**
You can find all the utilities for the tests under the path `test/helpers`. For this scenarios we rely on the *fixtures* functionalities from hardhat by using the async/await implementation, there's no any technical consideration under following this approach instead of using a more traditional approach like using `beforeEach` and `beforeAll` hooks.
You can also find an actual `utils.ts` file which has utility function specifically for dealing with event testing, as we follow an unorthodox pattern for libraries, we relied on some of the code provided by lens for their own test suite that's adapted to our necessities.
