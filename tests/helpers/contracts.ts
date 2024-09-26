// Set of helpers functions for setting up and creating contract instances.

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockNFT__factory } from "../../typechain";

/**
 * Generates a mock NFT contract.
 * 
 * @param amount Amount of contracts to be created. Defaults to 1.
 */
export async function generateMockNft(
    wallet: SignerWithAddress,
    amount?: number
) {
    const total = amount === undefined ? 1 : amount;  

    try {
        return await Promise.all(new Array(total).map(async (i) => {
            let number = Math.floor(Math.random() * 1000);

            return await new MockNFT__factory(wallet).deploy(
                `Mock NFT ${number}`,
                `MOCK${number}`
            );
        }));
    } catch (err) {
        console.error(`generateMockNft: ${err}`);
    }
}
