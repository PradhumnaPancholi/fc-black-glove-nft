import { ethers } from "hardhat";
import {createWhitelist} from "./whitelist";

async function main() {

  // merkleroot for whitelist //
  const whitelistRoot = await createWhitelist()
  console.log('whitelistRoot', whitelistRoot)

  // dev addresses for commisions //
  const dev = [
    "0x916134E688a4a866ff57f4F53F16703F9b8AFa99", //prad//
    "0x3Eb231C0513eE1F07306c2919FF5F9Ee9308407F",// emah//
    "0x13eef4ef8fca471f242ab0f8f49a3db6017ada33" //wiznav//   
  ]

  //FC - wallet
  const fcWallet = "0x6F4B6536cA5bd14631584BE382353e4683843575" //Make sure to change this //
  //discount duration for whitelist//
  const discountDuration = 200

  // variable for price //
  const discountedPrice = ethers.utils.parseUnits("0.5", 18)
  const price = ethers.utils.parseUnits("1", 18) 
  
  //deploying the contract //
  const BlackGlove = await ethers.getContractFactory("BlackGlove");
  const blackglove = await BlackGlove.deploy(whitelistRoot, dev, discountedPrice, price, fcWallet, discountDuration);

  await blackglove.deployed();

  console.log(`BlackGlove deployed to ${blackglove.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
