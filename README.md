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

`npx hardhat run scripts/deploy.js --network goerli`

### Test

`npx hardhat test`

- more soon

### Scripts

`scripts/sample-script.js`
