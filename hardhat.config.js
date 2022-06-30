require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.6.6",
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.GOERLI_URL}`,
        accounts: [`0x${process.env.GOERLI_PRIVATE_KEY}`],
      },
    },
    goerli: {
      url: `${process.env.GOERLI_URL}`,
      accounts: [`0x${process.env.GOERLI_PRIVATE_KEY}`],
    },

  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
