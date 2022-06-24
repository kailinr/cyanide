require("dotenv").config();
const ethers = require("ethers");
const { providers, utils, BigNumber } = ethers;

const provider = new providers.JsonRpcProvider(process.env.GOERLI_ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.GOERLI_PRIVATE_KEY, provider);

async function sendTransaction() {
  const nonce = await wallet.getTransactionCount();
  const value = utils.parseEther("0.00001");
  const to = process.env.TEST_WALLET_ADDRESS;
  const feeData = await provider.getFeeData();
  const { maxFeePerGas, maxPriorityFeePerGas } = feeData;

//Pending Tx Gas Math
  const maxFeeCalc = BigNumber.from(maxFeePerGas).mul(2).div(10);
  const maxPriPerCalc = BigNumber.from(maxPriorityFeePerGas).mul(2).div(10);


   const txData = {
    nonce: nonce,
    to: to,
    value: value,
    maxFeePerGas: maxFeeCalc,
    maxPriorityFeePerGas: maxPriPerCalc,
  };

  const tx = await wallet.sendTransaction(txData);
  console.log(`Transaction of ${utils.formatEther(tx.value)} sent`);

  console.log("Tx Details:", tx);

  await tx.wait();
  console.log("Mined Tx Hash:", tx.hash);
}
sendTransaction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
