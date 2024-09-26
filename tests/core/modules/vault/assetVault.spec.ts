// Test specification for `AssetVault` contract,
// including the deployment, parametrization, functionalities and behavior.

import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { assetVaultSetup } from "../../../helpers/fixtures";
import { VaultSetupFixture } from "../../../helpers/types";
import { shouldBehaveLikeAssetVault } from "./assetVault.behavior";
import { getEmittedArgument } from "../../../helpers/utils";
import { AssetVault } from "../../../../typechain";
    
describe("AssetVault Tests", () => {
    async function getFundedVault(): Promise<VaultSetupFixture> {
        const { eventsLib, errorsLib,
            deployer, vaultFactory,
            assetVault, distributor, mockNft, mockErc20,
            user, extra } = await loadFixture(assetVaultSetup);
        // NFT Funding
        await mockNft.mint(
            deployer.address,
            100
        );
        await mockNft.mint(
            deployer.address,
            200
        );

        await mockNft.transferFrom(
            deployer.address,
            assetVault.address,
            100
        );
        await mockNft.transferFrom(
            deployer.address,
            assetVault.address,
            200
        );

        // Native Funding
        await setBalance(
            assetVault.address,
            ethers.utils.parseEther("10.0")
        );

        // ERC20 Funding
        await mockErc20.transfer(
            assetVault.address,
            ethers.utils.parseEther("10.0")
        );
        await assetVault.callApprove(
            mockErc20.address,
            distributor.address,
            ethers.utils.parseEther("10.0")
        );

        await assetVault.enableWithdraw();

        return { eventsLib, errorsLib,
            deployer, vaultFactory,
            assetVault, distributor, mockNft, mockErc20,
            user, extra }
    }

    describe("Behavior Tests", async () => {
        await shouldBehaveLikeAssetVault (
            assetVaultSetup,
            getFundedVault
        );
    });

    describe("Deployment Tests", () => {
        context("Shouldn't allow reinitialization", () => {
            it("From proxy clone", async () => {
                const { assetVault } = await loadFixture(assetVaultSetup);
                
                await expect (
                    assetVault.initialize()
                ).to.be.revertedWith(
                        "Initializable: contract is already initialized"
                );
            });

            it("From implementation deploy", async () => {
                const vaultFactory = await ethers.getContractFactory("AssetVault");
                const vaultImp = await vaultFactory.deploy();

                await expect (
                    vaultImp.initialize()
                ).to.be.revertedWith(
                        "Initializable: contract is already initialized"
                );
            });
        });

        it("Should set sender as owner", async () => {
            const { vaultFactory, 
                user, eventsLib } = await loadFixture(assetVaultSetup);

            const txCreation = await (await vaultFactory.create(
                user.address
            )).wait();

            const vaultCreationArgs = getEmittedArgument(
                txCreation,
                eventsLib,
                "VaultCreated",
                1
            ) as string[];
            const vaultAddress = vaultCreationArgs.filter(arg => {
                if (arg !== undefined) {
                    return arg
                }
            });

            const assetVault = await ethers.getContractAt(
                "AssetVault", 
                vaultAddress[0]
            ) as AssetVault;
            
            expect ( await assetVault.owner() )
                .to.equal(user.address);
            expect ( await assetVault.ownershipToken() )
                .to.equal(vaultFactory.address);
        });
    });
});