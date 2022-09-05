import { ethers } from "hardhat";

async function main() {

  //deploying the contract //
  const MockMatic = await ethers.getContractFactory("MockMatic");
  const mockMatic = await MockMatic.deploy();

  await mockMatic.deployed();

  console.log(`BlackGlove deployed to ${mockMatic.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
