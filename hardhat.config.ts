import type { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
// import "hardhat-gas-reporter";
// import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import dotenv from "dotenv";

import "./tasks";

dotenv.config();

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            accounts: {}
        },
        mumbai: {
            url: `${process.env.MUMBAI_URL}`,
            chainId: 80001,
            accounts: [process.env.WALLET_PK || ""]
        },
        polygon: {
            url: `${process.env.POLYGON_URL}`,
            chainId: 137,
            accounts: [process.env.WALLET_PK || ""]
        },
        sepolia: {
            url: `${process.env.SEPOLIA_URL}`,
            chainId: 11155111,
            accounts: [process.env.WALLET_PK || ""]
        },
        arbitrum: {
            url: `${process.env.ARBITRUM_URL}`,
            chainId: 42161,
            accounts: [process.env.WALLET_PK || ""]
        },
        optimism: {
            url: `${process.env.OPTIMISM_URL}`,
            chainId: 10,
            accounts: [process.env.WALLET_PK || ""]
        }
    },
    paths: {
        artifacts: "./artifacts",
        cache: "./cache",
        sources: "./contracts",
        tests: "./tests",
    },
    typechain: {
        outDir: "./typechain",
        target: "ethers-v5",
    },
    solidity: {
        compilers: [
            {
                version: "0.8.15",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 2000
                    }
                }
            },
            {
                version: "0.8.9",
                settings: {}
            }
        ]
    },
    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_KEY || "",
            optimisticEthereum: process.env.OPTIMISM_KEY || ""
        }
    }
};

export default config;