// Test expected behavior from the `OwnableNFT` abstract contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { OwnableNFTFixture } from "../../helpers/types";
import { OwnedSetupFixture } from "./ownableNFT.spec"

export async function shouldBehaveLikeOwnableNFT (
    fixtureSetup: any,
    ownedFixture: any
) {
    context("Successful calls", async () => {
        it("Should correctly set address", async () => {
            const { ownableNft, 
                mockNft }: OwnableNFTFixture = await loadFixture(fixtureSetup);

            await expect ( ownableNft.owner() )
                .to.be.reverted;

            await ownableNft.testSetNft(mockNft.address);

            expect ( await ownableNft.ownershipToken() )
                .to.equal(mockNft.address);
        });

        it("Should correctly get owner", async () => {
            const { ownableNft, 
                mockNft, owner }: OwnableNFTFixture = await loadFixture(fixtureSetup);

            await ownableNft.testSetNft(mockNft.address);
            
            const coder = ethers.utils.defaultAbiCoder;
            const tokenId = coder.encode(
                ["uint256"],
                [   
                    coder.encode(
                        ["uint160"],
                        [ownableNft.address]
                    )
                ]
            );
            
            await expect ( mockNft.mint(
                owner.address,
                BigNumber.from(tokenId)
            ) )
                .to.emit(mockNft, "Transfer")
                .withArgs(
                    ethers.constants.AddressZero,
                    owner.address,
                    BigNumber.from(tokenId)
                );

            expect ( await ownableNft.owner() )
                .to.equal(owner.address);
        });

        it("Should allow changing owner", async () => {
            const { ownableNft, 
                mockNft, owner,
                extra, tokenId }: OwnedSetupFixture = await loadFixture(ownedFixture);

            const ownerMockNft = mockNft.connect(owner);
            await expect ( ownerMockNft.transferFrom(
                owner.address,
                extra.address,
                BigNumber.from(tokenId)
            ) )
                .to.emit(mockNft, "Transfer")
                .withArgs(
                    owner.address,
                    extra.address,
                    BigNumber.from(tokenId)
                );

            expect ( await ownableNft.owner() )
                .to.equal(extra.address);
        });
    });

    context("Failing scenarios", async () => {
        it("Ownership token address is wrong", async () => {
            const { ownableNft, 
                mockNft, owner, tokenId,
                extra }: OwnedSetupFixture = await loadFixture(ownedFixture);
            
            await ownableNft.testSetNft(extra.address);

            await expect ( ownableNft.owner() )
                .to.be.reverted;

            await ownableNft.testSetNft(mockNft.address);

            expect ( await ownableNft.owner() )
                .to.equal(owner.address);
        });
    });
}
