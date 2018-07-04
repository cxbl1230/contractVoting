pragma solidity ^0.4.17;
contract Voting {
    //-------------------------------------------------------------------------
    //存储每个投票人的信息
    struct voter {
        //投票人持有的投票通证数量
    	uint tokensBought;
    	//投票人账户地址
    	address voterAddress;     
    	//为每个候选人消耗的股票通证数量
    	uint[] tokensUsedPerCandidate;
    }
    //投票人信息
    mapping (address => voter) public voterInfo;
    //-------------------------------------------------------------------------


    //每个候选人获得的投票
    mapping (bytes32 => uint) public votesReceived;
    //候选人名单
    bytes32[] public candidateList;

    //发行的投票通证总量
    uint public totalTokens; 
    //投票通证剩余数量
    uint public balanceTokens;
    //投票通证单价
    uint public tokenPrice;

    //构造方法，合约部署时执行一次， 初始化投票通证总数量、通证单价、所有候选人信息
    constructor(uint tokens, uint pricePerToken, bytes32[] candidateNames) public {
        candidateList = candidateNames;
        totalTokens = tokens;
        balanceTokens = tokens;
        tokenPrice = pricePerToken;
    }

    //购买投票通证，此方法使用 payable 修饰，在Sodility合约中，
    //只有声明为payable的方法， 才可以接收支付的货币（msg.value值）
    function buy() payable public returns (uint) {
        //uint tokensToBuy = msg.value;
        uint tokensToBuy = msg.value / tokenPrice;         //根据购买金额和通证单价，计算出购买量
        require(tokensToBuy <= balanceTokens);             //继续执行合约需要确认合约的通证余额不小于购买量
        voterInfo[msg.sender].voterAddress = msg.sender;   //保存购买人地址
        voterInfo[msg.sender].tokensBought += tokensToBuy; //更新购买人持股数量
        balanceTokens -= tokensToBuy;                      //将售出的通证数量从合约的余额中剔除
        //return tokensToBuy;                                //返回本次购买的通证数量
    }

    //获取候选人获得的票数
    function totalVotesFor(bytes32 candidate) view public returns (uint) {
        return votesReceived[candidate];
    }

    //为候选人投票，并使用一定数量的通证表示其支持力度
    function voteForCandidate(bytes32 candidate,uint votesInTokens) public {
        //判断被投票候选人是否存在
        uint index = indexOfCandidate(candidate);
        require(index != uint(-1));
        //初始化 tokensUsedPerCandidate
        if (voterInfo[msg.sender].tokensUsedPerCandidate.length == 0) {
            for(uint i = 0; i < candidateList.length; i++) {
                voterInfo[msg.sender].tokensUsedPerCandidate.push(0);
            }
        }
        //uint votesInTokens = 1;
        //验证投票人的余额是否足够（购买总额-已花费总额>0）
        uint availableTokens = voterInfo[msg.sender].tokensBought - totalTokensUsed(voterInfo[msg.sender].tokensUsedPerCandidate);
        require (availableTokens >= votesInTokens);
        votesReceived[candidate] += votesInTokens;
        voterInfo[msg.sender].tokensUsedPerCandidate[index] += votesInTokens;
    }

    // 计算 投票人总共花费了多少 投票通证
    function totalTokensUsed(uint[] _tokensUsedPerCandidate) private pure returns (uint) {
        uint totalUsedTokens = 0;
        for(uint i = 0; i < _tokensUsedPerCandidate.length; i++) {
            totalUsedTokens += _tokensUsedPerCandidate[i];
        }
        return totalUsedTokens;
    }

    //获取候选人的下标
    function indexOfCandidate(bytes32 candidate) view public returns (uint) {
        for(uint i = 0; i < candidateList.length; i++) {
            if (candidateList[i] == candidate) {
                return i;
            }
        }
        return uint(-1);
    }
    //方法声明中的 view 修饰符，这表明该方法是只读的,即方法的执行 
    //并不会改变区块链的状态，因此执行这些交易不会耗费任何gas
    function tokensSold() view public returns (uint) {
        return totalTokens - balanceTokens;
    }
    function getBa() view public returns (uint) {
        return balanceTokens;
    }
    //投票者详情
    function voterDetails(address user) view public returns (uint, uint[]) {
        return (voterInfo[user].tokensBought, voterInfo[user].tokensUsedPerCandidate);
    }

    //将合约里的资金转移到指定账户
    function transferTo(address account) public {
        //account.transfer(this.balance);
        account.transfer(balanceTokens);
    }
    //获取所有竞选者
    function allCandidates() view public returns (bytes32[]) {
        return candidateList;
    }
    //test
    function voteFor(bytes32 user,uint tokenNumber) public {
        uint index = indexOfCandidate(user);
        require(index != uint(-1));
        votesReceived[user] += tokenNumber;
    }
}