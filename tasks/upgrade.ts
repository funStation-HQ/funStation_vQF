// Task to upgrade a given contract

import { task } from "hardhat/config";
import { getPrivateKey,
    getProviderURL, loadJsonFile
} from "../scripts/utils";

task("upgrade", "Upgrades a given contract")
    .addParam("contract", "The contract to upgrade")
    .setAction(async (taskArgs, hre) => {
        try {
            const pk = getPrivateKey();
            const provider = new hre.ethers.providers.JsonRpcProvider(
                getProviderURL(hre.network.name)
            );
            const wallet = new hre.ethers.Wallet(
                pk.privateKey,
                provider
            );
            const contracts = loadJsonFile(
                `addresses/${hre.network.name}.json`
            ) as {[index : string]: string};

            const targetContract = taskArgs.contract;

            if (targetContract === "Raffle") {
                console.log(`Upgrading Raffle...`);
                const raffleLogic = await hre.upgrades.upgradeBeacon(
                    contracts['raffleBeacon'],
                    await hre.ethers.getContractFactory(
                        "Raffle",
                        wallet
                    ),
                    {
                        unsafeAllow: ["constructor"]
                    }
                );
            } else if (targetContract === "VaultDepositRouter") {
                console.log(`Upgrading VaultDepositRouter...`);
                const newVaultDepositRouter = await hre.upgrades.prepareUpgrade(
                    contracts['vaultDepositRouterProxy'],
                    await hre.ethers.getContractFactory(
                        "VaultDepositRouter",
                        wallet
                    ),
                    {
                        unsafeAllow: ["constructor"]
                    }
                );
                const vaultDepositRouter = await hre.ethers.getContractAt(
                    "VaultDepositRouter",
                    contracts['vaultDepositRouterProxy'],
                    wallet
                );
                await (
                    await vaultDepositRouter.upgradeTo(
                        newVaultDepositRouter as string
                    )
                ).wait();
                console.log(`VaultDepositRouter upgraded to: ${newVaultDepositRouter}`);
            } else if (targetContract === "VaultFactory") {
                console.log(`Upgrading VaultFactory...`);
                const newVaultFactory = await hre.upgrades.prepareUpgrade(
                    contracts['vaultFactoryProxy'],
                    await hre.ethers.getContractFactory(
                        "VaultFactory",
                        wallet
                    ),
                    {
                        kind: 'uups',
                        unsafeAllow: ["constructor"]
                    }
                );
                const vaultFactory = await hre.ethers.getContractAt(
                    "VaultFactory",
                    contracts['vaultFactoryProxy'],
                    wallet
                );
                await (
                    await vaultFactory.upgradeTo(
                        newVaultFactory as string
                    )
                ).wait();
                console.log(`VaultFactory upgraded to: ${newVaultFactory}`);
            } else if (targetContract === "AssetVault") {
                console.log(`Upgrading AssetVault...`);
                const assetVaultLogic = await hre.upgrades.deployImplementation(
                    await hre.ethers.getContractFactory(
                        "AssetVault",
                        wallet
                    ),
                    {
                        unsafeAllow: ["constructor"]
                    }
                );
                const vaultFactory = await hre.ethers.getContractAt(
                    "VaultFactory",
                    contracts['vaultFactoryProxy'],
                    wallet
                );
                await (
                    await vaultFactory.upgradeVault(
                        assetVaultLogic as string
                    )
                ).wait();
                console.log(`AssetVault upgraded to: ${assetVaultLogic}`);
            } else if (targetContract === "FairHub") {
                console.log(`Upgrading FairHub...`);
                const newFairHub = await hre.upgrades.prepareUpgrade(
                    contracts['fairHubProxy'],
                    await hre.ethers.getContractFactory(
                        "FairHub",
                        wallet
                    ),
                    {
                        unsafeAllow: ["constructor"]
                    }
                );
                const fairHub = await hre.ethers.getContractAt(
                    "FairHub",
                    contracts['fairHubProxy'],
                    wallet
                );
                await (
                    await fairHub.upgradeTo(
                        newFairHub as string
                    )
                ).wait();
                console.log(`FairHub upgraded to: ${newFairHub}`);
            } else {
                throw Error(`Invalid contract: ${targetContract}`);
            }
        } catch (err) {
            console.log(err);
        }
    });