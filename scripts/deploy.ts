import { ethers } from "hardhat";
import {createWhitelist} from "./whitelist";

async function main() {

  // merkleroot for whitelist //
  const whitelistRoot = await createWhitelist()
  console.log('whitelistRoot', whitelistRoot)

  //token address - this is for the token that will be used to pay for the NFT //
  // MATIC in this case//
  const tokenAddress = "0x0000000000000000000000000000000000001010"

  // dev addresses for commisions //
  const dev = [
    "0x916134E688a4a866ff57f4F53F16703F9b8AFa99", //prad//
    "0x3Eb231C0513eE1F07306c2919FF5F9Ee9308407F"// emah//
  ]

  //FC - wallet
  const fcWallet = "0x0Abb12C338ee65160c96061051E38a71F49CA471"
  //discount duration for whitelist//
  const discountDuration = 86400


  //deploying the contract //
  const BlackGlove = await ethers.getContractFactory("BlackGlove");
  const blackglove = await BlackGlove.deploy(whitelistRoot, tokenAddress , dev, fcWallet, discountDuration);

  await blackglove.deployed();

  console.log(`BlackGlove deployed to ${blackglove.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
