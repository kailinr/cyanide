const ethers = require("ethers");
require("dotenv").config();


const {
    wallet,
    TOKENS_TO_MONITOR,
    WETH,
    UNISWAPV2_ROUTER,
} = require("./trade_variables.js");


const {
    getUniv2PairAddress,
    getUniv2Reserves,
} = require("./utils.js");


const {
    calcOptimalSandwichAmount,
    calcSandwichStates,
} = require("./calculation.js");

const { swap, simulateTransaction } = require("./swap.js");
const SwapRouter02Abi = require("../../abi/SwapRouter02.json");

const iface = new ethers.utils.Interface(SwapRouter02Abi);
const provider = new ethers.providers.WebSocketProvider(process.env.GOERLI_WSS);




class SandwichBot {
    constructor(wallet) {
        this.wallet = wallet;
        this.updateState = this.updateState.bind(this);
    }


    async updateState(tx, swapInfo) {

        this.tx = tx;
        this.swapInfo = swapInfo;

        await this.getReserves();
        this.getOptimalSandwichAmount();
        this.getSandwichState();
        if(this.sandwichStates == undefined) return;
        await this.getGasNeeded();
        if(this.profitCheck()) {
            await this.executeForwardSwap();
            await this.executeBackwardSwap();
        }

    }



    async getGasNeeded() {
        // Sandwich (x3 Gas multiplier for front run)
        const block = await provider.getBlock();
        const baseFeePerGas = block.baseFeePerGas; // wei
        const nonce = await provider.getTransactionCount(wallet.address);
        this.nonce = nonce;
    
        const frontrunMaxPriorityFeePerGas = this.tx.type === 2 ? this.tx.maxPriorityFeePerGas.mul(3) : this.tx.gasPrice.mul(3);
        const frontrunMaxFeePerGas = frontrunMaxPriorityFeePerGas.add(baseFeePerGas);
        const frontrunGasEstimate = await simulateTransaction(
            this.sandwichStates.optimalSandwichAmount,
            this.sandwichStates.frontrunState.amountOut,
            [WETH, this.swapInfo.token1],
            frontrunMaxPriorityFeePerGas,
            frontrunMaxFeePerGas,
            nonce
        );
        if (frontrunGasEstimate == undefined) {
            return;
        }
    
        const backrunMaxPriorityFeePerGas = this.tx.type === 2 ? this.tx.maxPriorityFeePerGas : this.tx.gasPrice;
        const backrunMaxFeePerGas = backrunMaxPriorityFeePerGas.add(baseFeePerGas);

        this.gasNeeded = {frontrunMaxPriorityFeePerGas, frontrunMaxFeePerGas, backrunMaxPriorityFeePerGas, backrunMaxFeePerGas};

        return this.gasNeeded;
    }






    async getReserves() {
        const pairAddress = getUniv2PairAddress(WETH, this.swapInfo.token1);
        const [WETHReserves, TokenReserves] = await getUniv2Reserves(
            pairAddress,
            WETH,
            this.swapInfo.token1
        );
        this.reserves = {WETH: WETHReserves, Token: TokenReserves};
        return this.reserves;
    }



    getOptimalSandwichAmount() {
        const optimalSandwichAmount = calcOptimalSandwichAmount(
            this.swapInfo.amountIn,
            this.swapInfo.amountOutMin,
            this.reserves.WETH,
            this.reserves.Token
        );

        console.log(parseInt(this.swapInfo.amountIn), parseInt(this.swapInfo.amountOutMin));
        console.log(
            "Optimal Sandwich amount: ",
            ethers.utils.formatEther(optimalSandwichAmount.toString())
        );
        this.optimalSandwichAmount = optimalSandwichAmount;
        return this.optimalSandwichAmount;
    }



    getSandwichState() {
        //TODO: MUST NOT CONTINUE IF SANDWICH STATE IS NULL.

        const sandwichStates = calcSandwichStates(
            this.swapInfo.amountIn,
            this.swapInfo.amountOutMin,
            this.reserves.WETH,
            this.reserves.Token,
            this.optimalSandwichAmount
        );

        if (sandwichStates === null) {
            console.log("Victim receives less than minimum amount");
            return;
        }

        this.sandwichStates = sandwichStates;
        return this.sandwichStates;
    }



    async executeForwardSwap() {
        //TODO: FORWARD SWAP FAILING SHOULD NOT ALLOW BACKWARD TO COMMENCE.
        const frontrunTx = await swap(
            this.sandwichStates.optimalSandwichAmount,
            this.sandwichStates.frontrunState.amountOut,
            [WETH, this.swapInfo.token1],
            this.gasNeeded.frontrunMaxPriorityFeePerGas,
            this.gasNeeded.frontrunMaxFeePerGas,
            this.nonce
        );
    
        let frontrunTxCost;
        try {
            const frontrunReceipt = await frontrunTx.wait();
            const frontrunGasUsed = frontrunReceipt.gasUsed;
            const frontrunGasPrice = frontrunReceipt.effectiveGasPrice;
            frontrunTxCost = frontrunGasUsed.mul(frontrunGasPrice);
            this.frontrunTxCost = frontrunTxCost;
            const frontrunTxHash = frontrunReceipt.transactionHash;
            console.log(
                `Frontrun Transaction: https://goerli.etherscan.io/tx/${frontrunTxHash}`
        );
        }
        catch (e) {
            if (e.code == ethers.errors.CALL_EXCEPTION) {
                console.log("Frontrun Swap failed.");
            }
            return;
        }
    }


    async executeBackwardSwap() {
        const backrunTx = await swap(
            this.sandwichStates.frontrunState.amountOut,
            this.sandwichStates.backrunState.amountOut,
            [this.swapInfo.token1, WETH],
            this.gasNeeded.backrunMaxPriorityFeePerGas,
            this.gasNeeded.backrunMaxFeePerGas,
            this.nonce + 1
        );
    
        try {
            const backrunReceipt = await backrunTx.wait();
            const backrunGasUsed = backrunReceipt.gasUsed;
            const backrunGasPrice = backrunReceipt.effectiveGasPrice;
            const backrunTxCost = backrunGasUsed.mul(backrunGasPrice);
            const backrunTxHash = backrunReceipt.transactionHash;
            console.log(
                `Backrun Transaction: https://goerli.etherscan.io/tx/${backrunTxHash}`
            );
            const netProfits = this.rawProfits.sub(this.frontrunTxCost).sub(backrunTxCost);
            console.log(
                "Net Profits: ",
                ethers.utils.formatEther(netProfits).toString()
            );
        }
        catch (e) {
            if (e.code == ethers.errors.CALL_EXCEPTION) {
                console.log("Backrun Swap failed.");
            }
            return;
        }
    }





    profitCheck() {
        /* First profitability check */
        const rawProfits = parseInt(this.sandwichStates.backrunState.amountOut.sub(
            this.optimalSandwichAmount
        ));
        this.rawProfits = rawProfits;


        console.log(
            "Profits before gas costs: ",
            rawProfits
        );

        if(rawProfits < 0) {
            return false;
        }
        return true;


        
        }





}


module.exports = { SandwichBot };