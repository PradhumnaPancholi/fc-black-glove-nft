//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./BlackGlove.sol";

///@title Fight Club's Black Glove - Mock Contract for testing //

contract BlackGloveMock is BlackGlove {
    using Counters for Counters.Counter;

    constructor(
        bytes32 _root,
        address[] memory _devs,
        uint256 _discountedPrice,
        uint256 _price,
        address _fcWallet,
        uint256 _discountDuration
    ) BlackGlove (_root, _devs, _discountedPrice, _price, _fcWallet, _discountDuration) {}

    // this function is made for testing totalSupply limit //
    function setTokenIdToMaxSupply() public {
		for(uint256 i = 0; i < MAX_SUPPLY; i++) {
		    _tokenIds.increment();
		}
	}

    // function to undo the effects of 'setTokenIdToMaxSupply' 
    function resetTokenId() public {
        while(_tokenIds.current() > 0){
            _tokenIds.decrement();
        }
    }

}
 
