//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

///@title Fight Club's Black Glove

contract BlackGlove is ERC721URIStorage, ERC721Enumerable, Ownable{
    using Counters for Counters.Counter;
    using Strings for uint256;

    /// @notice To keep track of token ids
    Counters.Counter public _tokenIds;

    ///@notice For MATIC token interface
    IERC20 MATIC;

    /// @notice discounted cost for NFT in MATIC//
    uint16 public discountedPrice = 600;

    /// @notice regular cost for NFT in MATIC//
    uint16 public price = 650;

    //URI to read metadata of images to be deployed
    string constant public TOKEN_URI = "ipfs://QmWPhrAFNjS3JkyEMZSKe4zWGSjXHncUyFiJiSDWyU3qnW";

    ///@notice Maximum supply of NFTs 
    uint16 constant public MAX_SUPPLY = 1000;

    ///@notice For managing "Pause" state //
    bool public paused = false;

    //ToDo: Need to update for FC//
    address payable commissions = payable(0x3Eb231C0513eE1F07306c2919FF5F9Ee9308407F);
   
    ///@notice Percentage for royalties on secondary sales//
    uint256 royaltyFeesinBips = 1000;

    ///@notice Contract URI that contains royalty info//
    string contractURI = "";

    ///@notice For root hash of the merkle tree that stores whitelist address 
    bytes32 public root;

    ///@notice List of holders//
    mapping(address => uint256) public holders;

    //ToDO : need to work on this //
    //For tracking claimed addresses from whitelist//
    mapping(address => bool) public claimed;

    uint256 public constant duration = 86400;
    uint256 public immutable end;


    ///@notice Event will be triggered whenever funds were deployed//
    event Withdraw(address indexed caller, uint256 amount);
    constructor(
        bytes32 _root,
        address _tokenAddress
    ) ERC721 ("Fight Club Black Glove", "FCBG") {
        root = _root;
        end = block.timestamp + duration;
        // set address for MATIC token //
        MATIC = IERC20(_tokenAddress);
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
        uint16 cost = whitelisted && block.timestamp < end ? discountedPrice : price; 
        //ToDO:  commissions dev //
        require(IERC20(MATIC).transferFrom(msg.sender, address(this), cost), "MATIC transfer failed"); 
        // safemint and transfer//
        _safeMint(msg.sender, id);
        _setTokenURI(id, TOKEN_URI);
    }
    
    ///@notice To return value of totalSupply
   // function totalSupply() public view returns (uint256) {
     //   return _tokenIds.current();
    //}


    //----------------Openzeppelin  overrides ------------------------------------//
    // Required as we have imported ERC721Enumerable and ERC721URIStorage//
    // ERC721URIStorage is required for setting tokenURI//
    // ERC721Enumerable is required for supportsInterface - needed for royalties //
    function totalSupply() public view virtual override returns (uint256) {
        return _tokenIds.current();
    }

   function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override (ERC721, ERC721Enumerable){
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override (ERC721, ERC721URIStorage){
        super._burn(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override (ERC721, ERC721URIStorage)returns (string memory) { 
        return super.tokenURI(tokenId);
    }
    //--------------------------------------------------------------------------------//
    
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
