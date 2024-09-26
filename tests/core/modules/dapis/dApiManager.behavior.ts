// Test expected behavior from the `DApiManager` contract core functions.

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { MockDApiProxy, MockERC20 } from "../../../../typechain";
import { DApiManagerSetupFixture } from "../../../helpers/types";

export async function shouldBehaveLikeDApiManager(
    setupFunction: () => Promise<DApiManagerSetupFixture>
) {
    context("Successful calls", () => {
        it("Should set a new DAPI proxy", async () => {
            const {
                dapiManager,
                dapiProxies,
                eventsLib
            } = await loadFixture(setupFunction);

            const tokenInstance = dapiProxies.secondProxyHash['token'] as MockERC20;
            const proxyInstance = dapiProxies.secondProxyHash['proxy'] as MockDApiProxy;

            // Check the DAPI proxy is not registered.
            expect (
                await dapiManager.tokenToAddress(
                    tokenInstance.address
                )
            ).to.equal(
                ethers.constants.AddressZero
            );
            
            // Set the DAPI proxy.
            expect (
                await dapiManager.setDApi(
                    tokenInstance.address,
                    proxyInstance.address
                )
            ).to.emit(
                eventsLib,
                'DApiRegistered'
            ).withArgs(
                tokenInstance.address,
                proxyInstance.address
            );

            // Check the DAPI proxy is registered.
            expect (
                await dapiManager.tokenToAddress(
                    tokenInstance.address
                )
            ).to.equal(
                proxyInstance.address
            );
        });

        it("Should get exiting DApi proxy", async () => {
            const {
                dapiManager,
                dapiProxies
            } = await loadFixture(setupFunction);

            expect (
                await dapiManager.getDApi(
                    (
                        dapiProxies.firstProxyHash['token'] as MockERC20
                    ).address
                )
            ).to.equal(
                (
                    dapiProxies.firstProxyHash['proxy'] as MockDApiProxy
                ).address
            );
        });

        it("Should read the DAPI proxy value", async () => {
            const {
                dapiManager,
                dapiProxies
            } = await loadFixture(setupFunction);

            expect (
                await dapiManager.readDApi(
                    (
                        dapiProxies.firstProxyHash['token'] as MockERC20
                    ).address
                )
            ).to.equal(
                dapiProxies.firstProxyHash['value']
            );
        });
    });

    context("Unsuccessful calls", () => {
        context("setDApi", () => {
            it("Should revert when the token address is zero", async () => {
                const {
                    dapiManager,
                    dapiProxies,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    dapiManager.setDApi(
                        ethers.constants.AddressZero,
                        (
                            dapiProxies.firstProxyHash['proxy'] as MockDApiProxy
                        ).address
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "ZeroAddress"
                );
            });

            it("Should revert when the proxy address is zero", async () => {
                const {
                    dapiManager,
                    dapiProxies,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    dapiManager.setDApi(
                        (
                            dapiProxies.firstProxyHash['token'] as MockERC20
                        ).address,
                        ethers.constants.AddressZero
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "ZeroAddress"
                );
            });

            it("Should revert when the proxy is already registered", async () => {
                const {
                    dapiManager,
                    dapiProxies,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    dapiManager.setDApi(
                        (
                            dapiProxies.firstProxyHash['token'] as MockERC20
                        ).address,
                        (
                            dapiProxies.firstProxyHash['proxy'] as MockDApiProxy
                        ).address
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "ParameterAlreadySet"
                );
            });

            it("Should revert when not owner", async () => {
                const {
                    dapiManager,
                    dapiProxies,
                    ops
                } = await loadFixture(setupFunction);
                
                await expect (
                    dapiManager.connect(
                        ops
                    ).setDApi(
                        (
                            dapiProxies.secondProxyHash['token'] as MockERC20
                        ).address,
                        (
                            dapiProxies.secondProxyHash['proxy'] as MockDApiProxy
                        ).address
                    )
                ).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
        });

        context("getDApi", () => {
            it("Should revert when the token address is zero", async () => {
                const {
                    dapiManager,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    dapiManager.getDApi(
                        ethers.constants.AddressZero
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "ZeroAddress"
                );
            });

            it("Should revert when proxy is not registered", async () => {
                const {
                    dapiManager,
                    dapiProxies,
                    errorsLib
                } = await loadFixture(setupFunction);

                await expect (
                    dapiManager.getDApi(
                        (
                            dapiProxies.secondProxyHash['token'] as MockERC20
                        ).address
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "DApiNotRegistered"
                );
            });
        });

        context("readDApi", () => {
            it("Should revert when value is under zero", async () => {
                const {
                    mockApi3Server,
                    dapiProxies,
                    dapiManager,
                    errorsLib
                } = await loadFixture(setupFunction);

                // Register negative value.
                await mockApi3Server.updateBeaconWithSignedData(
                    await (
                        dapiProxies.firstProxyHash['proxy'] as MockDApiProxy
                    ).dapiNameHash(),
                    Date.now(),
                    ethers.utils.parseEther("-1")
                );
                    
                // Check the error on negative update.
                await expect (
                    dapiManager.readDApi(
                        (
                            dapiProxies.firstProxyHash['token'] as MockERC20
                        ).address
                    )
                ).to.be.revertedWithCustomError(
                    errorsLib,
                    "CannotCastUint"
                );
            });

            it("Should revert with uninitialized proxies", async () => {
                const {
                    mockApi3Server,
                    dapiProxies,
                    dapiManager
                } = await loadFixture(setupFunction);

                const proxyInstance = dapiProxies.secondProxyHash['proxy'] as MockDApiProxy;
                const tokenInstance = dapiProxies.secondProxyHash['token'] as MockERC20;

                // Check proxy not registered.
                const dataFeedData = await mockApi3Server._dataFeeds(
                    await proxyInstance.dapiNameHash()
                );
                expect (
                    dataFeedData.value
                ).to.equal(
                    0
                );
                expect (
                    dataFeedData.timestamp
                ).to.equal(
                    0
                );

                // Register uninitialized proxy.
                dapiManager.setDApi(
                    tokenInstance.address,
                    proxyInstance.address
                );

                // Check the error on uninitialized proxy.
                await expect (
                    dapiManager.readDApi(
                        tokenInstance.address
                    )
                ).to.be.revertedWith(
                    "Data feed not initialized"
                );
            });
        });
    });
}