// Utils functionalities to use across the tests.

import { BigNumber } from 'ethers';
import { 
  keccak256,
  toUtf8Bytes,
  defaultAbiCoder
} from 'ethers/lib/utils';
import { TransactionReceipt } from '@ethersproject/providers';
import type { Events } from '../../typechain';

/**
 * Checks wether a transaction emitted a desired event or not.
 * NOTE: This function was taken from lens-protocol/core repo.
 * 
 * @param receipt The receipt from the transaction that originates the event.
 * @param name The name of the event looking for.
 * @param eventContract The event library contract.
 * @param expectedArgs An optional list of expected arguments emitted by the event.
 * @param emitterAddress An optional field to pass down the address from the emitter contract.
 * @returns An empty value. It's just helpful for ending/breaking the function flow.
 */
export async function matchEvent (
    receipt: TransactionReceipt,
    name: string,
    eventContract: Events,
    expectedArgs?: any[],
    emitterAddress?: string
  ) {
    const events = receipt.logs;
    if (events != undefined) {
      // match name from list of events in eventContract, when found, compute the sigHash
      let sigHash: string | undefined;
      for (let contractEvent of Object.keys(eventContract.interface.events)) {
        if (contractEvent.startsWith(name) && contractEvent.charAt(name.length) == '(') {
          sigHash = keccak256(toUtf8Bytes(contractEvent));
          break;
        }
      }
      // Throw if the sigHash was not found
      if (!sigHash) {
        throw Error(`Event "${name}" not found in Events libary!`);
      }
  
      // Find the given event in the emitted logs
      let invalidParamsButExists = false;
      for (let emittedEvent of events) {
        // If we find one with the correct sighash, check if it is the one we're looking for
        if (emittedEvent.topics[0] == sigHash) {
          // If an emitter address is passed, validate that this is indeed the correct emitter, if not, continue
          if (emitterAddress) {
            if (emittedEvent.address != emitterAddress) continue;
          }
          const event = eventContract.interface.parseLog(emittedEvent);
          // If there are expected arguments, validate them, otherwise, return here
          if (expectedArgs) {
            if (expectedArgs.length != event.args.length) {
              throw Error(
                `Event "${name}" emitted with correct signature, but expected args are of invalid length`
              );
            }
            invalidParamsButExists = false;
            // Iterate through arguments and check them, if there is a mismatch, continue with the loop
            for (let i = 0; i < expectedArgs.length; i++) {
              // Parse empty arrays as empty bytes
              if (expectedArgs[i].constructor == Array && expectedArgs[i].length == 0) {
                expectedArgs[i] = '0x';
              }
  
              // Break out of the expected args loop if there is a mismatch, this will continue the emitted event loop
              if (BigNumber.isBigNumber(event.args[i])) {
                if (!event.args[i].eq(BigNumber.from(expectedArgs[i]))) {
                  invalidParamsButExists = true;
                  break;
                }
              } else if (event.args[i].constructor == Array) {
                let params = event.args[i];
                let expected = expectedArgs[i];
                if (expected != '0x' && params.length != expected.length) {
                  invalidParamsButExists = true;
                  break;
                }
                for (let j = 0; j < params.length; j++) {
                  if (BigNumber.isBigNumber(params[j])) {
                    if (!params[j].eq(BigNumber.from(expected[j]))) {
                      invalidParamsButExists = true;
                      break;
                    }
                  } else if (params[j] != expected[j]) {
                    invalidParamsButExists = true;
                    break;
                  }
                }
                if (invalidParamsButExists) break;
              } else if (event.args[i] != expectedArgs[i]) {
                invalidParamsButExists = true;
                break;
              }
            }
            // Return if the for loop did not cause a break, so a match has been found, otherwise proceed with the event loop
            if (!invalidParamsButExists) {
              return;
            }
          } else {
            return;
          }
        }
      }
      // Throw if the event args were not expected or the event was not found in the logs
      if (invalidParamsButExists) {
        throw Error (`Event "${name}" found in logs but with unexpected args\n`);
      } else {
        throw Error(
          `Event "${name}" not found emitted by "${emitterAddress}" in given transaction log\n`
        );
      }
    } else {
      throw Error('No events were emitted!\n');
    }
  }

/**
 * Looks trough a TransactionReceipt for an emitted value out from a topic name
 * and a set of position indexes defined in the solidity contract.
 * 
 * @param txReceipt The target transaction.
 * @param eventsLib The Events library for the package.
 * @param eventName The target event name.
 * @param targetArgIndex The positional index of the argument.
 * @returns Any sort of raw value from the parsed events.
 */
export function getEmittedArgument(
  txReceipt: TransactionReceipt,
  eventsLib: Events,
  eventName: string,
  targetArgIndex: number
) {
  try {
    const topicHash = eventsLib.interface.getEventTopic(
      eventName
    );

    const output = txReceipt.logs.map(log => {
      if (log.topics[0] === topicHash) {
        let rawData = eventsLib.interface.parseLog(
          log
        );
        return rawData.args[targetArgIndex];
      }
    });

    return output;
    
  } catch (err) {
    console.error(err)
  }
}

/**
 * Helper function for vault related modules. Parses a vault address
 * into its tokenId format.
 * 
 * @param vaultAddress The string address for the desired vault.
 * @returns A string representing the tokenId from the given vault.
 */
export function getVaultId (
  vaultAddress: string
) {
  return defaultAbiCoder.encode(
    ["uint256"],
    [
      defaultAbiCoder.encode(
        ["uint160"],
        [vaultAddress]
      )
    ]
  );
}
