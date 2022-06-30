const ethers = require("ethers");
require("dotenv").config();


const {
    WETH,
    CYANIDE,
    UNISWAPV2_ROUTER,
} = require("./trade_variables.js");





class CyanideListener {
    constructor(provider, callbacks) {
        this.listen(provider, callbacks);
    }


    listen(provider, callbacks) {
        provider.on("pending", (hash) => {
    
            provider.getTransaction(hash).then(tx =>  {
                const swapInfo = this.processTransaction(tx);

                //ignore non swap txs, as well as non cyanide swaps.
                if((swapInfo == undefined) || !(this.isCyanideTrade(swapInfo))) return;

                
                callbacks.map(callback => callback(tx, swapInfo));
            });

        });
    }


    processTransaction(tx) {
        const swapInfo = this.getSwapInfo(tx);
        return swapInfo;
    }


    getSwapInfo(tx) {
        if(tx == undefined || tx.to == undefined) return undefined;
        if((tx.to).toLowerCase() !== (UNISWAPV2_ROUTER).toLowerCase()) return undefined;
        return this.processUniV2RouterTransaction(tx);
    }


    processUniV2RouterTransaction(tx) {
        const data = tx.data;
        let amountIn, amountOutMin, path, token0, token1;
        const sigHash = data.slice(0, 10);
    
    
        // swapExactETHForTokens(uint256,address[],address,uint256)
        if (sigHash.toLowerCase() == "0x7ff36ab5") {
            [amountOutMin, path] = ethers.utils.defaultAbiCoder.decode(
              ["uint256", "address[]", "address", "uint256"],
              ethers.utils.hexDataSlice(data, 4)
            );
            amountIn = tx.value;
            token0 = WETH;
            token1 = path[1];
        }
        else {
            return undefined;
        }
    
        return {amountIn, amountOutMin, path, token0, token1};
    }

    isCyanideTrade(swapInfo) {
        if((swapInfo.token0 != CYANIDE) && (swapInfo.token1 != CYANIDE)) return false;
        return true;
    }
    
}


module.exports = { CyanideListener };