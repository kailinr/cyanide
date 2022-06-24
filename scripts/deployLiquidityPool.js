const UniswapV2Router02ABI = require("../abi/UniswapV2Router02ABI.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const amountMinted = "1000000".padEnd(25, "0");

  // Deploy
  const token = await ethers.getContractFactory("CyanideToken");
  const Token = await token.deploy();
  console.log("Token address:", Token.address);

  // If Cyanide token is deployed
  // const Token = await hre.ethers.getContractAt(
  // "CyanideToken",
  // "0xe895507c3Fb0D156D633B746298349D158f66a85"
  // );

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
      value: ethers.utils.parseEther("6.0"),
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
