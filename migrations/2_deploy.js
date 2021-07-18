const sgToken = artifacts.require("SGToken");
const simpleStake = artifacts.require("SimpleStake.sol");

module.exports = async function(deployer) {
	//deploy SGToken
	await deployer.deploy(sgToken)

	//assign token into variable to get it's address
	const sgtoken = await sgToken.deployed()
	
	//pass token address for SGToken contract(for future minting)
	await deployer.deploy(simpleStake, sgtoken.address)
};