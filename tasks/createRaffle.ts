// Task to create a raffle given an address as owner

import { task } from "hardhat/config";
import { getProviderURL,
    getPrivateKey, loadJsonFile,
    StringIndexToString } from "../scripts/utils";

task(
    "createRaffle",
    "Creates a one day Raffle from the Hub inmediatly starting",
    async(taskArgs: StringIndexToString, hre) => 
    {
        const pk = getPrivateKey();
        const provider = new hre.ethers.providers.JsonRpcProvider(
            getProviderURL(hre.network.name)
        );
        const wallet = new hre.ethers.Wallet(
            pk.privateKey, 
            provider
        );
        const deployedAddresses = loadJsonFile(
            `addresses/${hre.network.name}.json`
        ) as StringIndexToString;;

        const fairHub = await hre.ethers.getContractAt(
            "FairHub",
            deployedAddresses["fairHubProxy"],
            wallet
        );
        const initialTimestamp = (await provider.getBlock("latest")).timestamp + 60;
        const currentId = await fairHub.raffles();

        const raffle = await fairHub.createRaffle(
            initialTimestamp,
            initialTimestamp + (24 * 60 * 60),
            Number(taskArgs.winnerNumber),
            {
                hash: hre.ethers.utils.randomBytes(32),
                hash_function: 18,
                size: 32
            }
        )
});
