//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

///@title Fight Club's Black Glove

contract BlackGlove is ERC721URIStorage, Ownable{
    using Counters for Counters.Counter;
    using Strings for uint256;

    /// @notice To keep track of token ids
    Counters.Counter public _tokenIds;

    ///@notice For MATIC token interface
    IERC20 MATIC;

    /// @notice discounted cost for NFT in MATIC//
    uint256 public discountedPrice = 600 ether;

    /// @notice regular cost for NFT in MATIC//
    uint256 public price = 650 ether;

    //URI to read metadata of images to be deployed
    string constant public TOKEN_URI = "ipfs://QmWPhrAFNjS3JkyEMZSKe4zWGSjXHncUyFiJiSDWyU3qnW";

    ///@notice Maximum supply of NFTs 
    uint16 constant public MAX_SUPPLY = 1000;

    ///@notice For managing "Pause" state //
    bool public paused = false;

    ///@notice For root hash of the merkle tree that stores whitelist address 
    bytes32 public root;

    ///@notice List of holders//
    mapping(address => uint256) public holders;

    ///@notice duration of discoount for whitelisted address//
    uint256 public discountDuration;
    
    ///@notice For timestamp at which discount period ends for whitelisted //
    uint256 public immutable end;

    ///@notice dev addresses for 1% commission //
    address[] public devs ;


    ///@notice Where funds from mint will go to //
    address public beneficiary;

    ///@notice Event will be triggered whenever funds were deployed//
    event Withdraw(address indexed caller, uint256 amount);

    ///@notice Event will be triggered when commission is paid to dev on a mint//
    event CommisionPaid(address indexed dev, uint16 amount);

    constructor(
        bytes32 _root,
        address[] memory _devs,
        address _fcWallet,
        uint256 _discountDuration
    ) ERC721 ("Fight Club Black Glove", "FCBG") {
        root = _root;
        // set address for MATIC token //
        //MATIC = IERC20(_tokenAddress);- this wass just used for Mock MATIC during testing//
        //set value for dev address to pay 1% commission on a mint //
        devs = _devs; 
        //fight club wallet address//
        beneficiary = _fcWallet;
        //set discountDuration//
        discountDuration = _discountDuration;
        // set timestamp to end discountDuration//
        end = block.timestamp + discountDuration;

    }


    ///@notice To get totalSupply
    function totalSupply() view public returns (uint256){
        return _tokenIds.current();
    }
    ///@notice A unitly function to convert address into bytes32 to verify merkle proof//
    function toBytes32(address addr) pure internal returns (bytes32) {
       return bytes32(uint256(uint160(addr))); 
    }

    ///@dev create tokens of token type `id` and assigns them to `to`
    /// `to` cannot be a zero address

    function mint(bytes32[] calldata proof) public payable {
        require(!paused, "Black Glove is paused");
        require(holders[msg.sender] == 0, "A wallet can not mint more than 1 Black Glove");
        holders[msg.sender] = 1;
        // if not, add addr to the holders list with token id//
        // the logic will be required for _safeMint too. Hence, performing it here is optimization
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        holders[msg.sender] == id;
        //check if totalSupply is reached//
        require ( _tokenIds.current() <= MAX_SUPPLY, "Max supply reached!");
        // check if the merkle proof is valid //
        bool whitelisted = MerkleProof.verify(proof, root, toBytes32(msg.sender)) == true;
        // if the caller is a whitelisted address and under discoount duration, then set cost to 600 MATIC //
        // otherwise 650 MATIC //
        uint256 cost = whitelisted && block.timestamp > end ? discountedPrice : price;
        // get funds //
        require(msg.value >= cost, "Insufficient funds!");
        // ToDo: commissions for dev //
        //require(IERC20(MATIC).transferFrom(msg.sender, address(this), cost), "MATIC transfer failed"); 
        //_handleCommissions(cost);
        // safemint and transfer//
        _safeMint(msg.sender, id);
        _setTokenURI(id, TOKEN_URI);
    }
    
    ///@notice To pay each dev 1% on a mint
    function _handleCommissions(uint16 _cost) internal {
        uint16 amount = _cost * 1/100;
        for (uint16 i = 0; i < devs.length; i++){
            require(IERC20(MATIC).transfer(devs[i], amount), "Commision Transaction Failed!");
            emit CommisionPaid(devs[i], amount);
        }
    }

    
    function pause() public onlyOwner {
        paused = true;
    }

    function unpause() public onlyOwner {
        paused =false;
    }

    function withdraw() public payable onlyOwner{
        address owner = owner();
        uint256 amount = IERC20(MATIC).balanceOf(address(this));
        (bool success) = IERC20(MATIC).transfer(owner, amount);
        emit Withdraw(msg.sender, address(this).balance);
    }

    receive() external payable {
    }
}
