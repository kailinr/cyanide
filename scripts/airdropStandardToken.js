const tokenAddress = "0xdB73CD84c36c87a6E4567fDDcF101e2fa3D419D2";

//@todo: enter users
const users = ["Airdop User Address"];

async function aidropTokens() {
  const token = await ethers.getContractAt("StandardToken", tokenAddress); //@todo: change token name

  for (let i = 0; i < users.length; i++) {
    try {
      await token.transfer(users[i], ethers.utils.parseEther("100"));
      console.log("Airdrop Successful");
    } catch (e) {
      console.log(e.message);
    }
  }
}

aidropTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
