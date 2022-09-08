import {expect} from "chai"
import {ethers, network} from "hardhat"
import {Contract} from "ethers"
import {MerkleTree} from "merkletreejs"
import keccak256 from "keccak256"

describe("BlackGlove Public Mint Tests", function() {

  //Global variables //
  //values will be set inside "before" during setup//
  let blackglove: Contract
  let merkletree: any  
  let owner:  any
  let dev: any
  let fcWallet: any
  let whitelisted: any 
  let nonWhitelisted: any
  const provider = ethers.provider;
  //function ro process addresses for leaf nodes //
  const padBuffer = (addr: any) => {
    return Buffer.from(addr.substr(2).padStart(32*2, 0), 'hex')
  }
  //--------------------------------------------------------------------------------------------------//
  // Setup/Deployment//
  before(async function(){
    // get accounts (10) for test suit
    let accounts:any = await ethers.getSigners()
    console.log('accounts', accounts.length)
    //-------------------------------------//
    // ---------FC-BlackGlove-Deployment-Prep-----------------//
    // -----------------------------------//
    // dev wallet address for commisions testing//
    dev = accounts.slice(12, 15).map(function(account:any){
      return account.address
    })
    console.log("Dev wallets : ", dev)
   // console.log('dev', dev)
   //fc - benficiary wallet//
   fcWallet = accounts[11].address
   console.log("FC Wallet", fcWallet)
   // take first five addresses for whitelist//
   whitelisted = accounts.slice(0, 5)
   // the next five addresses for non-whitelisted accounts
   nonWhitelisted = accounts.slice(6, 10)
   // hash whitelist addresses for creating leaf nodes 
   console.log("Creating MerkleTree for whitelist")
   const leaves = whitelisted.map(function(account:any){
      return padBuffer(account.address)
   })
    //create MerkleTree for whitelisted addresses 
    merkletree = new MerkleTree(leaves, keccak256, {sortPairs: true})
    const rootHash = await merkletree.getHexRoot()
    // discount duration//
    const discountDuration = 172800 // 2 days//
    //-----------------------------------------//
    //---------BlackGlove----------------------//
    //-----------------------------------------//
    //deploy the contract with root hash for whitelisted MerkleTree
    console.log("Deploying BlackGlove with root hash :", rootHash)
    const BlackGlove = await ethers.getContractFactory("BlackGloveMock")
    //setting price and discountedPrice.
    const discountedPrice = ethers.utils.parseUnits("600", 18)
    const price = ethers.utils.parseUnits("650", 18)
    blackglove = await BlackGlove.deploy(rootHash, dev, discountedPrice, price, fcWallet, discountDuration)
  })
  it("Total supply of 1000", async () => {
    //set the _tokenIds to max supply - the variable used for comparison//
    // now id is set to MAX_SUPPLY = 100 //
    await blackglove.setTokenIdToMaxSupply()
    //console.log('current id after mock update', await blackglove.totalSupply())
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[0].address))
    await expect(blackglove.connect(whitelisted[1]).mint(merkleproof)).to.be.revertedWith("Max supply reached!")
    //reset the counter after to rest of the tests can be performed//
    await blackglove.resetTokenId()
    expect(await blackglove.totalSupply()).to.equal(0) 
  })
  it("Non whitelisted gets the cost 650", async () => {
    const merkleproof = await merkletree.getHexProof(padBuffer(nonWhitelisted[0].address))
    const cost = await blackglove.connect(nonWhitelisted[0]).getCost(merkleproof)
    // format the returned value to compare it with the number
    const formattedCost = Number(ethers.utils.formatEther(cost))
    await expect(formattedCost).to.equal(650)
  })
  it("Witelisted gets the cost 600", async () => {
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[0].address))
    const cost = await blackglove.connect(whitelisted[0]).getCost(merkleproof)
    // format the returned value to compare it with the number
    const formattedCost = Number(ethers.utils.formatEther(cost)) 
    expect(formattedCost).to.equal(600)
  })
  it("A whitelisted address can mint the BlackGlove with a discount within the discount period", async () => { 
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[1].address))
    await expect (blackglove.connect(whitelisted[1]).mint(merkleproof, 
      {value: ethers.utils.parseEther("600"), gasLimit: 10000000} 
    )).to.emit(blackglove, "Minted")
  })
  // ALERT! time-sensitive test//
  it("A whitelisted address can not mint at the discount after discount period is over", async () => {
    // we are doing to use a "evm_increaseTime" to increase the time on the blockchain (local) to end + 1 second//
    // at this point, the transaction sent to mint with discountedPrice should be reverted with "Insufficient funds!"
    await network.provider.request({
      method: 'evm_increaseTime', 
      params: [172800 + 1] 
    })
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[2].address)) 
    await expect(blackglove.connect(whitelisted[2]).mint(merkleproof, 
      {value: ethers.utils.parseEther("600"), gasLimit: 10000000}
    )).to.be.revertedWith("Insufficient funds!")
  })
  it("A whitelisted address can mint at regular price after discount period is over", async () => {
     await network.provider.request({
      method: 'evm_increaseTime', 
      params: [172800 + 1] 
    })
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[3].address)) 
    await expect(blackglove.connect(whitelisted[3]).mint(merkleproof, 
      {value: ethers.utils.parseEther("650"), gasLimit: 10000000}
    )).to.emit(blackglove, "Transfer")
  })
  it("A non-whitelisted address can not mint the BlackGlove with a discount", async () => {
    const merkleproof = await merkletree.getHexProof(padBuffer(nonWhitelisted[1].address))
    await expect(blackglove.connect(nonWhitelisted[1]).mint(merkleproof, 
      {value: ethers.utils.parseEther("600"), gasLimit: 10000000})).to.be.revertedWith("Insufficient funds!");
  })
  it("A non-whitelisted address can mint the BlackGlove with a regular price", async() => {
    const merkleproof = await merkletree.getHexProof(padBuffer(nonWhitelisted[2].address))
    await expect(blackglove.connect(nonWhitelisted[2]).mint(merkleproof, {value: ethers.utils.parseEther("650")})).to.emit(blackglove, "Transfer");
  })
  it("A whitelisted address can not mint again", async() => {
    // important to use the account that was used in the previos test to mint//
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[1].address))
    await expect(blackglove.connect(whitelisted[1]).mint(merkleproof, 
      {value: ethers.utils.parseEther("600"), gasLimit: 10000000}
    )).to.be.revertedWith("A wallet can not mint more than 1 Black Glove")
  })
  it("A non-whitelisted address can not mint again", async() => {
    // important to use the account that was used in the previos test to mint//
    const merkleproof = await merkletree.getHexProof(padBuffer(nonWhitelisted[2].address))
    await expect(blackglove.connect(nonWhitelisted[2]).mint(merkleproof)).to.be.revertedWith("A wallet can not mint more than 1 Black Glove")
  })
  it("Minted NFT have the correct URI", async () => {
    expect(await blackglove.tokenURI(1)).to.be.equal(await blackglove.TOKEN_URI())
  })
  it("A non-whitelisted address can not mint at discount rate with merkleproof of whitelisted address", async() => {
    const merkleproof = await merkletree.getHexProof(padBuffer(whitelisted[0].address))
    await expect(blackglove.connect(nonWhitelisted[3]).mint(merkleproof, 
      {value: ethers.utils.parseEther("600"), gasLimit: 10000000}
    )).to.be.revertedWith("Insufficient funds!")
  })
  it("Owner can pause the contract, mint can not be performed in paused state", async() => {
    //first address is the owner and alos happens to be the first whitelisted address//
    //hence it is used here and accessed in the given way//
    await blackglove.connect(whitelisted[0]).pause()
    const merkleproof = await merkletree.getHexProof(padBuffer(nonWhitelisted[2].address))
    await expect(blackglove.connect(nonWhitelisted[2]).mint(merkleproof)).to.be.revertedWith("Black Glove is paused")
  })
  it("Owner can unpause", async() => {
    await blackglove.connect(whitelisted[0]).unpause()
    expect(await blackglove.paused()).to.equal(false)
  })
  it("Owner can withdraw the funds", async() => {
      // get owner blance before calling 'withdraw'//
      const ownerBalance = Number(ethers.utils.formatEther(await provider.getBalance(whitelisted[0].address)))  
      //send blackglove contract 1 eth that will be caught by 'receive' func
      await nonWhitelisted[1].sendTransaction({to: blackglove.address, value: ethers.utils.parseEther("1")})
      //call the withdraw function with owner account
      expect(await blackglove.connect(whitelisted[0]).withdraw()).to.emit(blackglove, "Withdraw")
      // get expected number here in a vairable to keep "expect" clean//
      const expectedBalance  = ownerBalance + Number(ethers.utils.formatEther(ethers.utils.parseEther("1")))
      // get owner balance after Withdraw function
      const newOwnerBalance = Number(ethers.utils.formatEther(await provider.getBalance(whitelisted[0].address)))
      // to fixed is used here to round it to 2 decimal points. - There's a tiny difference without it at the 5th decimal oint due to gas burned during the withdraw transaction//
      // but the difference of 1 ETH is enough to be certain about the test
      expect(newOwnerBalance.toFixed(2)).to.equal(expectedBalance.toFixed(2))
  })
  it("General user can not withdraw the funds", async () => {
    await expect(blackglove.connect(nonWhitelisted[3]).withdraw()).to.be.revertedWith("Ownable: caller is not the owner")
  })
  it("General user can not update beneficiary address", async () => {
    await expect(blackglove.connect(nonWhitelisted[0]).updateBeneficiaryAddress(nonWhitelisted[1].address)).to.be.revertedWith("Ownable: caller is not the owner")
  })  
  it("Owner can update the beneficiary address", async () => {
    const newAddress = whitelisted[1].address
    await expect(blackglove.connect(whitelisted[0]).updateBeneficiaryAddress(newAddress)).to.emit(blackglove, "BeneficiaryUpdated")
    expect(await blackglove.beneficiary()).to.equal(newAddress)
  }) 
})

