var Voting = artifacts.require("./Voting.sol");

module.exports = function(deployer) {
	//初始化合约，提供10000个投票通证，每隔通证单价 0.01 ether，候选人为 'Rama', 'Nick', 'Jose'
	deployer.deploy(Voting,10000, web3.toWei('0.01', 'ether'), ['Rama', 'Nick', 'Jose','Chenxiao','Seven']);
};
