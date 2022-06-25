const ethers = require("ethers");
require("dotenv").config();
const {
  provider,
  wallet,
  TOKENS_TO_MONITOR,
  WETH,
  UNISWAPV2_ROUTER,
  UNISWAPV3_ROUTER,
} = require("./sandwichUtils/trade_variables.js");
const {
  getUniv2PairAddress,
  getUniv2Reserves,
} = require("./sandwichUtils/utils.js");
const {
  calcOptimalSandwichAmount,
  calcSandwichStates,
} = require("./sandwichUtils/calculation.js");
const { swap, simulateTransaction } = require("./sandwichUtils/swap.js");
const SwapRouter02Abi = require("../abi/SwapRouter02.json");

const iface = new ethers.utils.Interface(SwapRouter02Abi);

async function filterTx(tx) {
  const { to, data, maxFeePerGas, maxPriorityFeePerGas, gasPrice, type } = tx;
  let amountIn, amountOutMin, path, token0, token1;

  if (to == UNISWAPV3_ROUTER) {
    const inputData = iface.parseTransaction({ data: data });
    const inputArgs = inputData["args"];
    if (
      inputData["sighash"].toLowerCase() === "0x5ae401dc" &&
      inputArgs["data"] !== undefined
    ) {
      let swapArgs = inputArgs["data"][0];
      const swapSigHash = swapArgs.slice(0, 10);
      if (swapSigHash.toLowerCase() === "0x472b43f3") {
        const swapInputData = iface.parseTransaction({ data: swapArgs });
        [amountIn, amountOutMin, path] = swapInputData["args"];
        token0 = path[0];
        token1 = path[path.length - 1];
      }
    }
  }

  if (to == UNISWAPV2_ROUTER) {
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
    // swapExactTokensForTokens(uint256,uint256,address[],address,uint256)
    if (sigHash.toLowerCase() == "0x38ed1739") {
      [amountIn, amountOutMin, path] = ethers.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "address[]", "address", "uint256"],
        ethers.utils.hexDataSlice(data, 4)
      );
      token0 = path[0];
      token1 = path[path.length - 1];
    }
  }

  if (
    amountIn == undefined ||
    amountOutMin == undefined ||
    token1 == undefined ||
    token0 == undefined
  ) {
    return;
  }

  if (
    !TOKENS_TO_MONITOR.map((token) => {
      return token.toLowerCase();
    }).includes(token1.toLowerCase())
  ) {
    return;
  }

  console.log("Potential sandwich transaction found...");
  console.log(
    JSON.stringify(
      {
        swap: token0,
        target: token1,
        amountIn: ethers.utils.formatEther(amountIn.toString()),
        amountOutMin: ethers.utils.formatEther(amountOutMin),
      },
      null,
      "\t"
    )
  );

  const pairAddress = getUniv2PairAddress(WETH, token1);
  const [reserveWETH, reserveToken] = await getUniv2Reserves(
    pairAddress,
    WETH,
    token1
  );

  const optimalSandwichAmount = calcOptimalSandwichAmount(
    amountIn,
    amountOutMin,
    reserveWETH,
    reserveToken
  );
  console.log(
    "Optimal Sandwich amount: ",
    ethers.utils.formatEther(optimalSandwichAmount.toString())
  );

  const sandwichStates = calcSandwichStates(
    amountIn,
    amountOutMin,
    reserveWETH,
    reserveToken,
    optimalSandwichAmount
  );

  if (sandwichStates === null) {
    console.log("Victim receives less than minimum amount");
    return;
  }

  /* First profitability check */
  const rawProfits = sandwichStates.backrunState.amountOut.sub(
    optimalSandwichAmount
  );
  console.log(
    "Profits before gas costs: ",
    ethers.utils.formatEther(rawProfits).toString()
  );

  // if (rawProfits < 0) {
  // console.log("Not profitable to sandwich before transaction costs");
  // return;
  // }

  // Sandwich (x3 Gas multiplier for front run)
  const block = await provider.getBlock();
  const baseFeePerGas = block.baseFeePerGas; // wei
  const nonce = await provider.getTransactionCount(wallet.address);

  const frontrunMaxPriorityFeePerGas =
    type === 2 ? maxPriorityFeePerGas.mul(3) : gasPrice.mul(3);
  const frontrunMaxFeePerGas = frontrunMaxPriorityFeePerGas.add(baseFeePerGas);
  const frontrunGasEstimate = await simulateTransaction(
    sandwichStates.optimalSandwichAmount,
    sandwichStates.frontrunState.amountOut,
    [WETH, token1],
    frontrunMaxPriorityFeePerGas,
    frontrunMaxFeePerGas,
    nonce
  );
  if (frontrunGasEstimate == undefined) {
    return;
  }

  const backrunMaxPriorityFeePerGas =
    type === 2 ? maxPriorityFeePerGas : gasPrice;
  const backrunMaxFeePerGas = backrunMaxPriorityFeePerGas.add(baseFeePerGas);
  // const backrunGasEstimate = await simulateTransaction(
  // sandwichStates.frontrunState.amountOut,
  // sandwichStates.backrunState.amountOut,
  // [WETH, token1],
  // backrunMaxPriorityFeePerGas,
  // backrunMaxFeePerGas,
  // nonce + 1
  // );
  // if (backrunGasEstimate == undefined) {
  // return;
  // }

  /* Second profitability check */
  // const frontrunTxCostEstimate = frontrunMaxFeePerGas.mul(frontrunGasEstimate);
  // const backrunTxCostEstimate = backrunMaxFeePerGas.mul(backrunGasEstimate);
  // const netProfitsEstimate = rawProfits
  // .sub(frontrunTxCostEstimate)
  // .sub(backrunTxCostEstimate);
  // if (netProfitsEstimate < 0) {
  // console.log("Sandwich estimate is not profitable");
  // return;
  // }
  // console.log(
  // "Estimated sandwich profits: ",
  // ethers.utils.formatEther(netProfitsEstimate).toString()
  // );

  const frontrunTx = await swap(
    sandwichStates.optimalSandwichAmount,
    sandwichStates.frontrunState.amountOut,
    [WETH, token1],
    frontrunMaxPriorityFeePerGas,
    frontrunMaxFeePerGas,
    nonce
  );
  let frontrunTxCost;
  try {
    const frontrunReceipt = await frontrunTx.wait();
    const frontrunGasUsed = frontrunReceipt.gasUsed;
    const frontrunGasPrice = frontrunReceipt.effectiveGasPrice;
    frontrunTxCost = frontrunGasUsed.mul(frontrunGasPrice);
    const frontrunTxHash = frontrunReceipt.transactionHash;
    console.log(
      `Frontrun Transaction: https://goerli.etherscan.io/tx/${frontrunTxHash}`
    );
  } catch (e) {
    if (e.code == ethers.errors.CALL_EXCEPTION) {
      console.log("Frontrun Swap failed.");
    }
    return;
  }

  setTimeout(() => {}, "10");

  const backrunTx = await swap(
    sandwichStates.frontrunState.amountOut,
    sandwichStates.backrunState.amountOut,
    [token1, WETH],
    backrunMaxPriorityFeePerGas,
    backrunMaxFeePerGas,
    nonce + 1
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
    const netProfits = rawProfits.sub(frontrunTxCost).sub(backrunTxCost);
    console.log(
      "Net Profits: ",
      ethers.utils.formatEther(netProfits).toString()
    );
  } catch (e) {
    if (e.code == ethers.errors.CALL_EXCEPTION) {
      console.log("Backrun Swap failed.");
    }
    return;
  }
}

async function main() {
  console.log("Scanning mempool...");
  provider.on("pending", function (hash) {
    provider.getTransaction(hash).then(function (tx) {
      if (tx == null) return;
      filterTx(tx);
    });
  });
}

main();
