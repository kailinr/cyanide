const hre = require('hardhat');
const { WETH, CYANIDE } = require('./sandwichUtils/trade_variables');



async function run() {
    const wallet = (await hre.ethers.getSigners())[0];
    const cavemanBot = await hre.ethers.getContractAt('CavemanBot', '0xA0ECc307c2eD35ed396c6A8458278893d7445ecB', wallet);

    const test = await cavemanBot.swap(hre.ethers.utils.parseEther('0.1'), [WETH, CYANIDE, WETH]);
    const rec = await test.wait();


    console.log(rec.transactionHash);
    return;
}


run()
.then(() => process.exit(0))
.catch((error) => {
    console.log(error);
    process.exit(1);
});