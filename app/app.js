App = {
  web3Provider: null,
  candidates:{},
  tokenPrice:null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Initialize web3 and set the provider to the testRPC.
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider('http:/127.0.0.1:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },
    initContract:function(){//初始化合约
        $.getJSON('Voting.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract.
          var voting_artifacts = data;
          App.contracts.Voting = TruffleContract(voting_artifacts);

          // Set the provider for our contract.
          App.contracts.Voting.setProvider(App.web3Provider);


          return App.populateCandidates();
          // Use our contract to retieve and mark the adopted pets.
          ///return App.getBalances();
        });
        //return App.bindEvents();
    },
    populateCandidates:function() {
        var voteInstance;
        App.contracts.Voting.deployed().then(function(instance) {
            voteInstance = instance;//领养实例
            return voteInstance.allCandidates.call();
        }).then(function(candidateArray) {
            for(var i=0;i< candidateArray.length;i++){
               App.candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
            }
            App.setupCandidateRows();
            App.populateCandidateVotes();
            App.populateTokenData();

        }).catch(function(err) {
            console.log(err.message);
        });
        App.bindEvents();
    },
    setupCandidateRows:function() {
        Object.keys(App.candidates).forEach( (candidate) => { 
            $("#candidate-rows").append("<tr><td>" + candidate + "</td><td id='" + App.candidates[candidate] + "'></td></tr>");
        });
    },
    populateCandidateVotes:function() {
        let candidateNames = Object.keys(App.candidates);
        App.contracts.Voting.deployed().then(function(voteInstance) {
            for (var i = 0; i < candidateNames.length; i++) {    
                let name = candidateNames[i];
                voteInstance.totalVotesFor.call(name).then(function(vl){
                   $("#" + App.candidates[name]).html(vl.toString());
                });
            }
        });
    },
    populateTokenData:function(){
        App.contracts.Voting.deployed().then(function(contractInstance) {
            contractInstance.totalTokens().then(function(v) {//token总数 
                $("#tokens-total").html(v.toString());
            });
            contractInstance.tokensSold.call().then(function(v) {//调用合约函数
                $("#tokens-sold").html(v.toString());
            });
            contractInstance.tokenPrice().then(function(v) {//合约公共变量
                App.tokenPrice = parseFloat(web3.fromWei(v.toString()));
                $("#token-cost").html(App.tokenPrice + " Ether");
            });
            web3.eth.getBalance(contractInstance.address, function(error, result) {
                $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
            });
        });
    },
    bindEvents:function(){
        //购买token
        $(document).on("click","#voter_buyTokens",function(){
            let tokensToBuy = $("#buy").val();
            let price = tokensToBuy * App.tokenPrice;
            App.contracts.Voting.deployed().then(function(instance){
                instance.buy( { value : web3.toWei( price,'ether' ), from : web3.eth.accounts[0] } ).then(function(){
                    web3.eth.getBalance(instance.address,function(error,result){
                        $("#contract-balance").html(web3.fromWei(result.toString()) + 'Ether');
                    });
                    $("#buy-msg").fadeIn(300);
                    setTimeout(function(){$("#buy-msg").fadeOut(1000);},1000);
                });
            });
            //App.populateTokenData();
        });
        //查看候选人情况
        $(document).on("click","#voter-lookup-btn",function(){
            let address = $("#voter-info").val();
            App.contracts.Voting.deployed().then(function(instance){
                instance.voterDetails.call(address).then(function(v){
                    $("#tokens-bought").html("<br>总共购买投票通证数量："+v[0].toString());
                    let votesPerCandidate = v[1];
                    $("#votes-cast").empty();
                    $("#votes-cast").append("通证已经用于投票记录如下： <br>");
                    let table_data="<table class='table table-striped table-bordered table-condensed'>";
                    let allCandidates = Object.keys(App.candidates);
                    for(let i=0; i < allCandidates.length; i++) {
                        table_data+="<tr><td>"+allCandidates[i]+"</td><td>"+(votesPerCandidate[i] ? votesPerCandidate[i]:0 )+"</td></tr>";
                    }
                    table_data+="</table>";
                    $("#votes-cast").append(table_data);
                });
            });
        });
        //投票
        $(document).on("click","#voter-send",function(){
            let candidateName = $("#candidate").val(); //获取被投票的候选人
            let voteTokens = $("#vote-tokens").val();  //获取票数
            $("#candidate").val("");
            $("#vote-tokens").val("");
            App.contracts.Voting.deployed().then(function(instance){
                instance.voteForCandidate(candidateName,voteTokens,{ from:web3.eth.accounts[0] } ).then(function(v){
                    let div_id = App.candidates[candidateName];
                    instance.totalVotesFor.call(candidateName).then(function(result){
                        $("#"+div_id).html(result.toString());
                        $("#msg").fadeIn(300);
                        setTimeout(function(){$("#msg").fadeOut(1000);},1000);
                    });
                });
            });

        });
    }
};
$(function() {
    $(window).load(function() {
        App.init();
    });
});