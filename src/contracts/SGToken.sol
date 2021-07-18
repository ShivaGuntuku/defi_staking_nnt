// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SGToken is ERC20 {
	address public minter; //State Variable

	// this method executed only once
	constructor() public payable ERC20("SG Token", "SGT") {
		minter = msg.sender;
	}

	function mint(address account, uint256 amount) public {
		// check minter address has permission or not
		// require(msg.sender == minter, "Access Error, msg.sender does not have permission to mint new tokens");
		_mint(account, amount); // mint new tokens
	}
}