async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from: ", deployer.address);
  const Token = await ethers.getContractFactory("Sandwich");
  const token = await Token.deploy(
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
  );
  console.log("Deployed Token Address:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
