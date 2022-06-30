const { ethers } = require("ethers");
const { SandwichBot } = require("./Sandwich")
const { swap, simulateTransaction } = require("./swap.js");

const { WETH, CYANIDE, wallet, provider } = require('./trade_variables');



class NaiveBot extends SandwichBot {
    profitCheck() {
        return true;
    }

    async testSwap() {
        const nonce = await provider.getTransactionCount(wallet.address);

        const test = await swap(
            ethers.utils.parseUnits('1', 'ether'),
            ethers.utils.parseUnits('0.5', 'ether'),
            [WETH, CYANIDE, WETH],
            ethers.utils.parseUnits('0.5', 'gwei'),
            ethers.utils.parseUnits('2.0', 'gwei'),
            nonce
        );

        const rec = await test.wait();
        console.log(test.wait());
    }
}


module.exports = { NaiveBot };