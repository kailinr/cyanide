const ethers = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.WebSocketProvider(process.env.GOERLI_WSS);


const { CyanideListener } = require("./sandwichUtils/CyanideListener");
const { NaiveBot } = require("./sandwichUtils/NaiveBot");





async function main() {
    console.log("Scanning mempool...");

    const sandwich1 = new NaiveBot();
    new CyanideListener(provider, [sandwich1.updateState]);

    
}



  
main();







