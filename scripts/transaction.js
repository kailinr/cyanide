const ethers = require("ethers");
const fs = require("fs");
const {
  UNISWAP,
  WETH,
  ChainId,
  Token,
  TokenAmount,
  Trade,
  Fetcher,
  Route,
  Percent,
  TradeType,
} = require("@uniswap/sdk");
require("dotenv").config();

async function main() {
  // provider and wallet setup
  const url = process.env.GOERLI_ALCHEMY_URL;
  const provider = new ethers.providers.JsonRpcProvider(url);
  const privateKey = process.env.GOERLI_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);

  // get token to swap for
  const chainId = ChainId.GÖRLI;
  const uniTokenAddress = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";
  const UNI = await Fetcher.fetchTokenData(
    chainId,
    uniTokenAddress,
    provider,
    "UNI",
    "Uniswap Token"
  );

  // make trade
  await createTrade(UNI, 0.002, provider, wallet);
}

async function createTrade(toxicToken, tokenAmount, provider, wallet) {
  try {
    UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    UNISWAP_ROUTER_ABI = fs.readFileSync("./abis/router.json").toString();
    UNISWAP_ROUTER_CONTRACT = new ethers.Contract(
      UNISWAP_ROUTER_ADDRESS,
      UNISWAP_ROUTER_ABI,
      provider
    );

    const pair = await Fetcher.fetchPairData(
      toxicToken,
      WETH[toxicToken.chainId],
      provider
    );
    const route = new Route([pair], WETH[toxicToken.chainId]);
    console.log("reached here1");

    let amountIn = ethers.utils.parseEther(tokenAmount.toString()); //helper function to convert ETH to Wei
    amountIn = amountIn.toString();
    const trade = new Trade(
      route,
      new TokenAmount(WETH[toxicToken.chainId], amountIn),
      TradeType.EXACT_INPUT
    );

    console.log("reached here2");

    const slippageTolerance = new Percent("1000", "10000"); // 1000 bips, or 10%
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
    const amountOutMinHex = ethers.BigNumber.from(
      amountOutMin.toString()
    ).toHexString();
    const path = [WETH[toxicToken.chainId].address, toxicToken.address];
    const to = process.env.TEST_WALLET_ADDRESS; // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 10; // 5 seconds from now(?)
    const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
    const valueHex = await ethers.BigNumber.from(
      value.toString()
    ).toHexString(); //convert to hex string

    const rawTxn =
      await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(
        amountOutMinHex,
        path,
        to,
        deadline,
        {
          value: valueHex,
        }
      );

    rawTxn.gasPrice = 8;

    console.log("rawTx: ", rawTxn);

    let sendTxn = (await wallet).sendTransaction(rawTxn);

    let reciept = (await sendTxn).wait();

    //Logs the information about the transaction it has been mined.
    if (reciept) {
      console.log(
        " - Transaction is mined - " + "\n" + "Transaction Hash:",
        (await sendTxn).hash +
          "\n" +
          "Block Number: " +
          (await reciept).blockNumber +
          "\n" +
          "Navigate to https://goerli.etherscan.io/txn/" +
          (await sendTxn).hash,
        "to see your transaction"
      );
    } else {
      console.log("Error submitting transaction");
    }
  } catch (e) {
    console.log("reached here :(");
    console.log(e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
