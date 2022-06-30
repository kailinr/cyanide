const { ethers } = require("ethers");
const { SandwichBot } = require("./Sandwich")
const { swap, simulateTransaction } = require("../swap.js");

const { WETH, CYANIDE, wallet, provider } = require('../trade_variables');



class NaiveBot extends SandwichBot {
    profitCheck() {
        return true;
    }

    
}


module.exports = { NaiveBot };