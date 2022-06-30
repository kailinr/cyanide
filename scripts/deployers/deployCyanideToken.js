async function main() {
  const [deployer] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("CyanideToken"); // <-- change name of token to deploy

  const token = await Token.deploy();

  console.log("Deployed Cyanide Token Address:", token.address);

  //Goerli Balance After Deploy
  const weiBalance = (await deployer.getBalance()).toString();
  console.log(
    "Goerli ETH Balance:",
    await ethers.utils.formatEther(weiBalance)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
