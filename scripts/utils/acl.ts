// Set of utilities related with ACL stack.

import { hexDataSlice,
    keccak256, toUtf8Bytes } from "ethers/lib/utils";

export function getRoleId(
    roleName: string
): string {
    return hexDataSlice(
        keccak256(
            toUtf8Bytes(
                roleName
            )
        ),
        0,
        8
    );
}
