const ethers = require("ethers");
const { sandwichContract } = require("./trade_variables.js");

const simulateTransaction = async (
  amountIn,
  amoutOutMin,
  path,
  maxPriorityFeePerGas,
  maxFeePerGas,
  nonce
) => {
  try {
    await sandwichContract.callStatic.swap(amountIn, amoutOutMin, path, {
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
    });
    const gasEstimate = sandwichContract.estimateGas.swap(
      amountIn,
      amoutOutMin,
      path
    );
    return gasEstimate;
  } catch (e) {
    if (e.code == ethers.errors.CALL_EXCEPTION) {
      console.log("Simulation failed.");
    }
  }
};

const swap = async (
  amountIn,
  amoutOutMin,
  path,
  maxPriorityFeePerGas,
  maxFeePerGas,
  nonce
) => {
  const tx = await sandwichContract.swap(amountIn, amoutOutMin, path, {
    maxPriorityFeePerGas,
    maxFeePerGas,
    nonce,
    gasLimit: 250000,
  });
  return tx;
};

exports.simulateTransaction = simulateTransaction;
exports.swap = swap;
