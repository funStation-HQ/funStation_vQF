// Set of utilities related with airnode stack.

import { AirnodeRrpAddresses, 
    AirnodeRrpV0, AirnodeRrpV0Factory } from "@api3/airnode-protocol";
import { deriveSponsorWalletAddress } from '@api3/airnode-admin';
import type { JsonRpcProvider } from "@ethersproject/providers";
import type { Wallet } from "ethers";
import { keccak256, 
    hexDataSlice, toUtf8Bytes } from "ethers/lib/utils";
import { loadJsonFile } from "./json";

export function getQrngData(
    chainId: number
): {[index: string]: string} {
    // @ts-ignore
    const data: {
        [index: string]: {
            [index: string]: string
        }
    } = loadJsonFile("qrng.json");

    if ([5, 11155111, 420, -1].includes(chainId)) {
        return data['testnets'];
    } else if ([1, 42161, 10, 137].includes(chainId)) {
        return data['mainnets'];
    } else {
        throw new Error(`Unsupported chain id: ${chainId}`);
    }
}

/**
 * Returns an instantiated AirnodeRrpV0 of the given network.
 * 
 * @param chainId The chain id of the network being used.
 * @param signer The signer for the contract instance.
 * @returns An instance of AirnodeRrpV0.
 */
export function getAirnodeRrpV0Contract(
    chainId: number,
    signer: Wallet | JsonRpcProvider
): AirnodeRrpV0
{
    const contract = AirnodeRrpV0Factory.getContract(
        AirnodeRrpAddresses[chainId],
        AirnodeRrpV0Factory.abi
    ) as AirnodeRrpV0;
    return contract.connect(signer);
}

/**
 * Returns the address of a sponsor wallet.
 * 
 * @param xpub The xpub of the airnode.
 * @param airnodeAddress The address of the target airnode.
 * @param sponsorAddress The address of the sponsor contract.
 */
export async function getDerivedSponsorAddress(
    xpub: string,
    airnodeAddress: string,
    sponsorAddress: string
) {
    return await deriveSponsorWalletAddress(
        xpub,
        airnodeAddress,
        sponsorAddress
    );
}

/**
 * Creates a Solidity `bytes4` selector from a function string selector.
 * It's useful when working with airnode related contracts.
 * 
 * @param functionSelector The full function selector as string.
 * @returns A string representing the function selector in `bytes4` format.
 */
export function getBytesSelector (
    functionSelector: string
  ) {
    return hexDataSlice(
      keccak256(
        toUtf8Bytes(
          functionSelector
        )
      ),
      0,
      4
    );
  }
