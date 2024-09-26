// Utilities for dealing with contracts functionalities.

import { FunctionFragment, 
    FormatTypes } from "@ethersproject/abi";
import { keccak256, 
    hexDataSlice, toUtf8Bytes } from "ethers/lib/utils";

/**
 * Given a function fragment, returns the selector of the function.
 * 
 * @param fragment The function fragment to derive the selector from.
 * @returns The selector of the given function fragment.
 */
export function deriveSelector(
    fragment: FunctionFragment
): string {
    return hexDataSlice(
        keccak256(
            toUtf8Bytes(
                fragment.format(
                    FormatTypes.sighash
                )
            )
        ),
        0,
        4
    )
}