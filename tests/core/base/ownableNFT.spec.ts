// Test specification for `OwnableNFT` abstract contract,
// including the parametrization, functionalities and behavior.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ownableNFTSetup } from "../../helpers/fixtures";
import { OwnableNFTFixture } from "../../helpers/types";
import { shouldBehaveLikeOwnableNFT } from "./ownableNFT.behavior";
import { BigNumber } from "ethers";

export interface OwnedSetupFixture extends OwnableNFTFixture {
    tokenId : string
}

describe("OwnableNFT Tests", () => {
    async function getOwnedContract(): Promise<OwnedSetupFixture> {
        const { ownableNft, mockNft,
            errorsLib, owner, user, 
            extra }: OwnableNFTFixture = await loadFixture(ownableNFTSetup);
        
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

        await mockNft.mint(
            owner.address,
            BigNumber.from(tokenId)
        );

        return {
            ownableNft, mockNft,
            errorsLib, tokenId, owner, 
            user, extra
        }
            
    }

    describe("Behavior Tests", async () => {
        await shouldBehaveLikeOwnableNFT(
            ownableNFTSetup,
            getOwnedContract
        )
    });

    describe("Modifiers Tests", () => {
        context("onlyOwner", () => {
            it("Should fail when not owner", async () => {
                const { ownableNft, 
                    errorsLib, user } = await loadFixture(getOwnedContract);
                
                const userOwnableNft = ownableNft.connect(user);
                await expect ( userOwnableNft.testOnlyOwner() )
                    .to.be.revertedWithCustomError(
                        errorsLib,
                        "CallerNotOwner"
                    ).withArgs(user.address);
            });
            
            it("Should return when owner", async () => {
                const { ownableNft, 
                    owner } = await loadFixture(getOwnedContract);
                    
                const ownerOwnableNft = ownableNft.connect(owner);
                expect ( await ownerOwnableNft.testOnlyOwner() )
                    .to.equal(true);
            });
        });
    });
});
