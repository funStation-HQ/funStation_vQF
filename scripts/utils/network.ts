// Utilities related with objects and instances to interact with an EVM network.

import { utils } from "ethers";

/**
 * Gets the Private Key from the `.env` file.
 * 
 * @returns A SigningKey instance with the PK provided.
 */
export function getPrivateKey() {
    require("dotenv").config();
    const inputKey = process.env['WALLET_PK'] 
        ? process.env['WALLET_PK'] : null;
    let privateKey;
    if (inputKey) {
        privateKey = utils.isHexString(inputKey) ? inputKey : "0x" + inputKey;
        return new utils.SigningKey(privateKey);
    }
    else {
        throw Error(`Theres no Private Key available`)
    }
};

/*
 * Returns the provider URL from `.env` file.
 * 
 * @param network The name of network to get the provider url from.
 * @param mode Optional parameter t o indicate connection type.
 *  Use `1` for HTTP and `2` for WebSockets.
 * 
 * @returns The URL for the indicated provider.
*/
export function getProviderURL(
    network: string, 
    mode?: number
) {
    require("dotenv").config();
    if (mode === 1 || mode === undefined) {
        return process.env[`${network.toUpperCase()}_URL`] || "";
    } else {
        return process.env[`${network.toUpperCase()}WS_URL`] || "";
    }
}
