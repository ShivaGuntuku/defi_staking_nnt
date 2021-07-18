// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./SGToken.sol";

contract SimpleStake {
	SGToken private sgtoken;

	// events
	event StakeDeposit(address indexed user, uint etherAmount, uint timeStart);
	event StakeWithdraw(address indexed user, uint256 etherAmount, uint depositTime, uint interest);

	// mappings
	mapping(address => bool) public isStaked;
	mapping(address => uint) public depositBalanceof;
	mapping(address => uint) public depositStartFrom;


	constructor(SGToken _token) public {
		sgtoken = _token;
	}

	function deposit() payable public {
		// any active stakes
		require(isStaked[msg.sender] == false,'Error, your Stake account active');
		
		// check minimum stake amount
		require(msg.value >= 1e16, "Low Balance Error, Stake must be >= 0.1 ETH");

		// user address update stake balance
		depositBalanceof[msg.sender] = depositBalanceof[msg.sender] + msg.value;

		// user address update stake start time
		depositStartFrom[msg.sender] = depositStartFrom[msg.sender] + block.timestamp;

		// update user stake status
		isStaked[msg.sender] = true;

		// call the event: for transaction logs
		emit StakeDeposit(msg.sender, msg.value, block.timestamp);
	}

	function withdraw() payable public {
		// check any stakes active or not
		require(isStaked[msg.sender] == true, "No, previous stake is deposited");
		
		// store the user balance in local variable
		uint userBalance = depositBalanceof[msg.sender];

		// check user hold time
		uint depositStakedTime = block.timestamp - depositStartFrom[msg.sender];

		// interest calculation
		// 10% interest for 0.01 eth 
		uint interestPerSecond = 60 * 60 * 24 * 365.25 * (depositBalanceof[msg.sender] * 1e16);
		uint interest = interestPerSecond * depositStakedTime;

		// send eth to user
		msg.sender.transfer(userBalance);
		sgtoken.mint(msg.sender, interest); // mint interest token for user address

		// reset deposit data
		depositStartFrom[msg.sender] = 0;
		depositBalanceof[msg.sender] = 0;
		isStaked[msg.sender] = false;

		// call the event: for transaction logs
		emit StakeWithdraw(msg.sender, userBalance, depositStakedTime, interest);
	}
}