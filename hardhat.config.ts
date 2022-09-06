import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-waffle";
require("dotenv").config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.1",
    settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        }
      },
  },
  networks: {
    mumbai: {
      url: process.env.MUMBAI_URL,
      accounts: [`${process.env.PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },
};

export default config;
