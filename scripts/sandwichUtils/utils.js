const ethers = require("ethers");

const UniswapV2PairAbi = require("../../abi/UniswapV2Pair.json");
const { wallet } = require("./trade_variables.js");

const uniswapV2Pair = new ethers.Contract(
  ethers.constants.AddressZero,
  UniswapV2PairAbi,
  wallet
);

const sortTokens = (tokenA, tokenB) => {
  if (ethers.BigNumber.from(tokenA).lt(ethers.BigNumber.from(tokenB))) {
    return [tokenA, tokenB];
  }
  return [tokenB, tokenA];
};

const getUniv2PairAddress = (tokenA, tokenB) => {
  const [token0, token1] = sortTokens(tokenA, tokenB);

  const salt = ethers.utils.keccak256(token0 + token1.replace("0x", ""));
  const address = ethers.utils.getCreate2Address(
    "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Factory address (contract creator)
    salt,
    "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
  );

  return address;
};

const getUniv2Reserves = async (pair, tokenA, tokenB) => {
  const [token0] = sortTokens(tokenA, tokenB);
  const [reserve0, reserve1] = await uniswapV2Pair.attach(pair).getReserves();

  if (tokenA.toLowerCase() === token0.toLowerCase()) {
    return [reserve0, reserve1];
  }
  return [reserve1, reserve0];
};

const getUniv2DataGivenAmountIn = (amountIn, reserveA, reserveB) => {
  const amountInWithFee = amountIn.mul(997); // 0.3% swap fee
  const numerator = amountInWithFee.mul(reserveB);
  const denominator = amountInWithFee.add(reserveA.mul(1000));
  const amountOut = numerator.div(denominator);

  const newReserveA = reserveA.add(amountIn);
  const newReserveB = reserveB.sub(amountOut);

  return {
    amountOut,
    newReserveA,
    newReserveB,
  };
};

const encodeFunctionData = (abi, funcName, funcParams) => {
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData(funcName, funcParams);
  return calldata;
};

const getRawTransaction = (tx) => {
  const addKey = (accum, key) => {
    if (tx[key]) {
      if (key === "v") {
        accum[key] = parseFloat(tx[key]);
      }
      accum[key] = tx[key];
    }
    return accum;
  };

  // Extract the relevant parts of the transaction and signature
  const txFields =
    "chainId data gasPrice gasLimit maxFeePerGas maxPriorityFeePerGas nonce to type value".split(
      " "
    );
  const sigFields = "v r s".split(" ");

  // Seriailze the signed transaction
  const raw = ethers.utils.serializeTransaction(
    txFields.reduce(addKey, {}),
    sigFields.reduce(addKey, {})
  );

  // Double check things went well
  if (ethers.utils.keccak256(raw) !== tx.hash) {
    throw new Error("serializing failed!");
  }

  return raw;
};

exports.getUniv2Reserves = getUniv2Reserves;
exports.getUniv2PairAddress = getUniv2PairAddress;
exports.getUniv2DataGivenAmountIn = getUniv2DataGivenAmountIn;
exports.encodeFunctionData = encodeFunctionData;
exports.getRawTransaction = getRawTransaction;
