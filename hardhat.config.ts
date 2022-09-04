import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config()

const config: HardhatUserConfig = {
  solidity: "0.8.10",
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
