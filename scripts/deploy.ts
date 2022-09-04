import { ethers } from "hardhat";
import {createWhitelist} from "./whitelist";

async function main() {

  const whitelistRoot = await createWhitelist()
  console.log('whitelistRoot', whitelistRoot)

  const BlackGlove = await ethers.getContractFactory("BlackGlove");
  const blackglove = await BlackGlove.deploy(whitelistRoot, "0x0000000000000000000000000000000000001010");

  await blackglove.deployed();

  console.log(`BlackGlove deployed to ${blackglove.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
