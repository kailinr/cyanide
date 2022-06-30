const ethers = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const SandwichAbi = require("../../abi/Sandwich.json");

const WETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const UNISWAPV2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const UNISWAPV3_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const TOKENS_TO_MONITOR = [
  "0x50940de104DE340e1dEABF60f9c1750f78508785",
  WETH,
];
const MAX_WETH_TO_SANDWICH = 1;
const SANDWICH_CONTRACT = "0xa87ff748b05Ed28c4F6847eF830dD607CB9dFD62";
const CYANIDE = "0x50940de104DE340e1dEABF60f9c1750f78508785";



const provider = new ethers.providers.StaticJsonRpcProvider(process.env.GOERLI_URL);
const wallet = new ethers.Wallet(process.env.GOERLI_PRIVATE_KEY, provider);
const sandwichContract = new ethers.Contract(
  SANDWICH_CONTRACT,
  SandwichAbi,
  wallet
);

module.exports = {
  UNISWAPV2_ROUTER,
  UNISWAPV3_ROUTER,
  WETH,
  TOKENS_TO_MONITOR,
  MAX_WETH_TO_SANDWICH,
  SANDWICH_CONTRACT,
  provider,
  wallet,
  sandwichContract,
  CYANIDE
};
