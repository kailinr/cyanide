const UniswapV2Router02ABI = require("../abi/UniswapV2Router02ABI.json");

async function main() {
  const amountMinted = "1000000".padEnd(25, "0");

  // Deploy
  const token = await ethers.getContractFactory("Cyanide");
  const Token = await token.deploy(amountMinted);
  console.log("Token address:", Token.address);

  // Approve Router & Add Liquidity
  const approveTx = await Token.approve(
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    amountMinted
  );
  console.log("Approve Transaction", approveTx);
  await approveTx.wait();

  const UniswapV2Router02 = new ethers.Contract(
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    UniswapV2Router02ABI,
    deployer
  );
  const addLiqTx = await UniswapV2Router02.addLiquidityETH(
    Token.address,
    amountMinted,
    0,
    0,
    deployer.address,
    Math.round(new Date().getTime() / 1000) + 60 * 20,
    {
      value: ethers.utils.parseEther("0.01"),
    }
  );
  console.log("Liq Add Transaction", addLiqTx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
