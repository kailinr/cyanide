require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
    ],
  },
  networks: {
    goerli: {
      url: `${process.env.GOERLI_URL}`,
      accounts: [`0x${process.env.GOERLI_PRIVATE_KEY}`],
    },
  },
};
