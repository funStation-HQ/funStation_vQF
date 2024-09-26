import { BigNumber } from "ethers";

/**
 * @notice Safe division for two numbers.
 * @param x First number.
 * @param y Scaling factor.
 * @param denominator Denominator.
 * @return The result of the division.
 */
export function mulDiv(
    x: BigNumber,
    y: BigNumber,
    denominator: BigNumber
): BigNumber {
    return x.mul(y).div(denominator);
}
