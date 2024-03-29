# Toxic ERC20s:

### BackdoorToken

- A 3rd-party (central) address set by contract deployer can revert tokens sent to a victim address. 

### CyanideToken 

- Salmonela dupe
- Need to add owner address overrides (which bypass the toxic transfer) once bot contracts are deployed\*

### StandardToken

- Non-toxic baseline
- Pausible ERC20

# Setup

### Deploy to Goerli

- \*First, enter change token name in deploy.js

`npx hardhat run scripts/deployers/deployCyanideToken.js --network goerli`

### Test

`npx hardhat test`

- more soon

### Scripts

`scripts/sample-script.js`










### Notes on gas

MaxFeePerGas = Base fee + maxPriorityFee.

- MaxFeePerGas = absolute max user is willing to pay on gas
- Base fee = algorithmically determined cost per unit of gas based on how full blocks are.
- maxPriorityFee = tip miners. Minimum tip for your tx to be mined = 1 gwei, or .000000001 eth.
- For non-Flashbots miners, MaxPriorityFee is the tip to miners. Standard Ethereum Miners receive (per block): maxFeePerGas - base fee.




### Gas Script (built in to front-end)

- new packages (@ethereumjs/tx and axios) installed - need to `npm i`
- Calculates gas fees for current block.
- Calculates last 10 blocks baseGasFees, formats to dec, reduces, gets average



### EIP1559 Tx

- Just how Dan sends these tx's in the video but we can use other methods

Dan's EIP1559 talk: https://www.chainshot.com/md/eip1559-9-14-21

- EIP Transaction package @ 0:56:40
- Using axios to get eth_feeHistory @ 1:09:56
- ethereumjs docs https://www.npmjs.com/package/@ethereumjs/tx











# Sandwich Bot Demo
> Monitors mempool for Uniswap V2 buy transactions, performs sandwich on profitable transactions.

## Setup
- Add PRIVATE_KEY, GOERLI_WSS_URL variables in .env file
- Fill variables in src/trade_variables.js file

## Deploy Contracts
- Add ETHERSCAN_API_KEY in .env file
- ```
   $ npx hardhat run scripts/deployers/deploySandwichBot.js --network goerli
   $ npx hardhat verify --network goerli <Contract address> <WETH address> 
   ```
- Send ETH to sandwich contract to wrap to WETH

## Usage
- `$ npx hardhat run scripts/sandV2.js --network goerli`
