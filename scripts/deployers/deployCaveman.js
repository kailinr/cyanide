
const hre = require('hardhat');
const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";




async function deploy() {
    const wallet = (await hre.ethers.getSigners())[0];


    const CavemanBot = await hre.ethers.getContractFactory('CavemanBot');
    const cavemanBot = await CavemanBot.deploy(factoryAddress);
    await cavemanBot.deployed();

    console.log(`caveman's address: ${cavemanBot.address}`);


    return;
}


deploy()
.then(() => process.exit(0))
.catch((error) => {
    console.log(error);
    process.exit(1);
});