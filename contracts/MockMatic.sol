//SPDX-License-Identifier:GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMatic is ERC20 {
    
    constructor() ERC20("Mock Matic", "MOCK MATIC") {
        //mint 100,000 and send them to deploying account//
        _mint(msg.sender, 100000);
    }    
}

