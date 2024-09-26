// Task  to deploy the contracts

import { task } from "hardhat/config";
import { AirnodeRrpAddresses } from '@api3/airnode-protocol';
import { getPrivateKey,
    getProviderURL, writeJsonFile } from "../scripts/utils";
import { FairHub } from "../typechain";

task("deploy", "Deploys the contracts from the platform")
    .setAction(async (_, hre) => {
        const pk = getPrivateKey();
        const provider = new hre.ethers.providers.JsonRpcProvider(
            getProviderURL(hre.network.name)
        );
        const wallet = new hre.ethers.Wallet(
            pk.privateKey, 
            provider
        );
        
        console.log("Deploying contracts...\n\n");
        console.log("- Events\n");
        const eventsFactory = await hre.ethers.getContractFactory(
            "Events",
            wallet
        );
        const events = await eventsFactory.deploy();
        await events.deployed();

        console.log("- AccessManager\n");
        const accessManager = await hre.upgrades.deployProxy(
            await hre.ethers.getContractFactory(
                "AccessManager",
                wallet
            ),
            [
                wallet.address
            ],
            {
                initializer: "initialize",
                kind: "uups",
                unsafeAllow: ["constructor"]
            }
        );
        await accessManager.deployed();

        console.log(`\
        ============================================================\n\
        Contracts deployed: \n\n\
        Events: ${events.address}\n\
        AccessManager: ${accessManager.address}\n\n\
        ============================================================\n`
        );

        console.log("- RaffleBeacon\n");
        const raffleBeacon = await hre.upgrades.deployBeacon(
            await hre.ethers.getContractFactory(
                "Raffle",
                wallet
            ),
            {
                unsafeAllow: ["constructor"]
            }
        );
        await raffleBeacon.deployed();
        const raffleLogic = await hre.upgrades.beacon.getImplementationAddress(
            raffleBeacon.address
        );
        console.log("- FairHub\n");
        const fairHub = await hre.upgrades.deployProxy(
            await hre.ethers.getContractFactory(
                "FairHub",
                wallet
            ),
            [
                raffleBeacon.address,
                accessManager.address
            ],
            {
                initializer: "initialize",
                kind: "uups",
                unsafeAllow: ["constructor"]
            }
        ) as FairHub;
        await fairHub.deployed();

        console.log(`\
        ============================================================\n\
        Contracts deployed: \n\n\
        Raffle Logic: ${raffleLogic}\n\
        RaffleBeacon: ${raffleBeacon.address}\n\
        FairHub Proxy: ${fairHub.address}\n\n\
        ============================================================\n`
        );

        const distributorFactory = await hre.ethers.getContractFactory(
            "Distributor",
            wallet
        );
        const winnerAirnodeFactory = await hre.ethers.getContractFactory(
            "WinnerAirnode",
            wallet
        );

        console.log("- AssetVault\n");
        const assetVaultLogic = await hre.upgrades.deployImplementation(
            await hre.ethers.getContractFactory(
                "AssetVault",
                wallet
            ),
            {
                unsafeAllow: ["constructor"]
            }
        );
        console.log("- Distributor\n");
        const distributor = await distributorFactory.deploy();
        await distributor.deployed();
        console.log("- DApiManager\n");
        const dApiManager = await hre.upgrades.deployProxy(
            await hre.ethers.getContractFactory(
                "DApiManager",
                wallet
            ),
            [],
            {
                initializer: "initialize",
                kind: "uups",
                unsafeAllow: ["constructor"]
            }
        );
        await dApiManager.deployed();
        console.log("- WinnerAirnode\n");
        const winnerAirnode = await winnerAirnodeFactory.deploy(
            AirnodeRrpAddresses[
                hre.network.config.chainId || 10
            ]
        );
        await winnerAirnode.deployed();
        console.log("- VaultFactory\n");
        const vaultFactory = await hre.upgrades.deployProxy(
            await hre.ethers.getContractFactory(
                "VaultFactory",
                wallet
            ),
            [
                assetVaultLogic
            ],
            {
                initializer: "initialize",
                kind: "uups",
                unsafeAllow: ["constructor"]
            }
        );
        await vaultFactory.deployed();
        console.log("- VaultDepositRouter\n");
        const vaultDepositRouter = await hre.upgrades.deployProxy(
            await hre.ethers.getContractFactory(
                "VaultDepositRouter",
                wallet
            ),
            [
                vaultFactory.address
            ],
            {
                initializer: "initialize",
                kind: "uups",
                unsafeAllow: ["constructor"]
            }
        );
        await vaultDepositRouter.deployed();

        console.log(`\
        ============================================================\n\
        Contracts deployed: \n\n\
        Distributor: ${distributor.address}\n\
        DApiManager: ${dApiManager.address}\n\
        WinnerAirnode: ${winnerAirnode.address}\n\
        AssetVault Logic: ${assetVaultLogic}\n\
        VaultFactory Proxy: ${vaultFactory.address}\n\
        VaultDepositRouter Proxy: ${vaultDepositRouter.address}\n\n\
        ============================================================\n`
        );
        
        const accessManagerImp = await hre.upgrades.erc1967.getImplementationAddress(
            accessManager.address
        );
        const fairHubImp = await hre.upgrades.erc1967.getImplementationAddress(
            fairHub.address
        );
        const dapiManagerImp = await hre.upgrades.erc1967.getImplementationAddress(
            dApiManager.address
        );
        const vaultFactoryImp = await hre.upgrades.erc1967.getImplementationAddress(
            vaultFactory.address
        );
        const vaultDepositRouterImp = await hre.upgrades.erc1967.getImplementationAddress(
            vaultDepositRouter.address
        );

        const filePath = `addresses/${hre.network.name}.json`;
        console.log(`Saving addresses to ${filePath}...\n`);
        writeJsonFile(
            {
                "eventsLibrary": events.address,
                "raffleLogic": raffleLogic,
                "raffleBeacon": raffleBeacon.address,
                "fairHubImp": fairHubImp,
                "fairHubProxy": fairHub.address,
                "accessManagerImp": accessManagerImp,
                "accessManagerProxy": accessManager.address,
                "distributor": distributor.address,
                "dApiManagerProxy": dApiManager.address,
                "dApiManagerImp": dapiManagerImp,
                "winnerAirnode": winnerAirnode.address,
                "assetVaultLogic": assetVaultLogic,
                "vaultFactoryImp": vaultFactoryImp,
                "vaultFactoryProxy": vaultFactory.address,
                "vaultDepositRouterImp": vaultDepositRouterImp,
                "vaultDepositRouterProxy": vaultDepositRouter.address
            },
            filePath,
            "w"
        );
        console.log("Done with deployment!\n");
    });
