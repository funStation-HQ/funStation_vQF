// Set of functions to validate paremeters and state of deployed contracts.

import type { Contract, Wallet } from "ethers";
import { sponsorToRequesterToSponsorshipStatus } from "@api3/airnode-admin";
import { AirnodeLogic } from "../../typechain";
import { getAirnodeRrpV0Contract, 
    getBytesSelector } from "../utils";

/**
 * Validates whether a contract is an instance from our implementation of RrpV0Requesters.
 * 
 * @param contract An instantiated contract.
 * @returns True or False.
 */
function _isRrpV0Requester(contract: Contract): boolean {
    return contract.interface.getFunction("setRequestParameters") !== undefined &&
        contract.interface.getFunction("addNewEndpoint") !== undefined;
}

/**
 * Validates wether a requester have all the required endpoints.
 * 
 * @param contract An instantiated requester contract.
 * @param targetFunctionSelectors The target function selectors in full string text.
 * @returns True or False.
 */
async function _validateFunctionSelectors(
    contract: Contract,
    targetFunctionSelectors: string[]
): Promise<boolean> {
    let contractEndpoints: string[] = []
    let currentIndex = 0;

    while (true) {
        try {
            const currentEndpoint = await (contract as AirnodeLogic)
                .endpointsIds(currentIndex);
            contractEndpoints.push(currentEndpoint.functionSelector);
            currentIndex++;
        } catch (err) {
            break;
        }
    }
    
    for (let f of targetFunctionSelectors) {
        let encodeSelector = getBytesSelector(f);
        if (contractEndpoints.includes(encodeSelector)) {
            continue
        } else {
            return false;
        }
    }

    return true;
}

/**
 *  Function to validate parameters for correct functionalities of a requester contract.
 * 
 * @param requesterContract An instance of the target requester contract.
 * @param chainId The id of the network being used.
 * @param sponsorWallet The wallet of the sponsor.
 */
export async function validateRrpV0Requester(
    requesterContract: Contract,
    chainId: number,
    sponsorWallet: Wallet,
    functionSelectors: string[]
) {
    const airnodeRrpV0 = getAirnodeRrpV0Contract(
        chainId,
        sponsorWallet
    )

    if (_isRrpV0Requester(requesterContract)) {
        const sponsorStatus = await sponsorToRequesterToSponsorshipStatus(
            airnodeRrpV0,
            requesterContract.address,
            sponsorWallet.address
        )
        if (sponsorStatus === false) {
            console.error(
                "Requester is not being sponsored!"
            );
        }

        const endpointStatus = await _validateFunctionSelectors(
            requesterContract,
            functionSelectors
        );
        if (endpointStatus === false) {
            console.error(
                "Requester does not have all the required endpoints!"
            );
        }
        
    } else {
        throw Error(
            "The contract is not a valid RrpV0Requester contract."
        )
    }

}

const main = () => {
    console.log(getBytesSelector(
        "getIndividualWinner(bytes32,bytes)"
    ));
}

main();