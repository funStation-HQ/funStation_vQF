// Task  to deploy the contracts

import { task } from "hardhat/config";
import { getPrivateKey,
    getProviderURL, writeJsonFile } from "../scripts/utils";

task("mock", "Deploys the mock contracts")
    .setAction(async (taskArgs, hre) => {
        const pk = getPrivateKey();
        const provider = new hre.ethers.providers.JsonRpcProvider(
            getProviderURL(hre.network.name)
        );
        const wallet = new hre.ethers.Wallet(
            pk.privateKey, 
            provider
        );

        const nftFactory = await hre.ethers.getContractFactory(
            "MockNFT",
            wallet
        );
        const nft = await nftFactory.deploy(
            "MockNFT",
            "MockNFT"
        );

        await nft.deployed();

        const erc20Factory = await hre.ethers.getContractFactory(
            "MockERC20",
            wallet
        );
        const erc20 = await erc20Factory.deploy();
        await erc20.deployed();

        console.log(`\
        ============================================================\n\
        Contracts deployed: \n\n\
        NFT: ${nft.address}\n\
        ERC20: ${erc20.address}\n\n\
        ============================================================\n`
        );

        const filePath = `addresses/mocks-${hre.network.name}.json`;
        writeJsonFile(
            {
                "nft": nft.address,
                "erc20": erc20.address
            },
            filePath,
            "w"
        );
    });