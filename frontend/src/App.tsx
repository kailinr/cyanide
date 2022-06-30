//declare var window: any
import React, { Component, useState } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import ContactlessIcon from '@mui/icons-material/Contactless';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import { BigNumber, ethers } from "ethers";
import uniswap_abi from "../src/abis/router.json";
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { Icon } from '@iconify/react';
import { InputLabel, Input, InputAdornment } from '@mui/material';
const { UNISWAP, WETH, ChainId, Token, TokenAmount, Trade, Fetcher, Route, Percent, TradeType } = require('@uniswap/sdk');
declare var window: any;

class App extends Component {

  // my alchemy endpoint
  url = process.env.REACT_APP_GOERLI_ALCHEMY_URL;
  // ethers provider
  provider = new ethers.providers.JsonRpcProvider(this.url);
  // my private key
  privateKey: any = process.env.REACT_APP_GOERLI_PRIVATE_KEY;
  // Chain ID 5
  chainId = ChainId.GÖRLI;
  // Cyanide (CYN) token address
  cynTokenAddress = '0x50940de104DE340e1dEABF60f9c1750f78508785';
  // Uniswap ROUTER address (where we will send our trade)
  UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  // Router ABI
  UNISWAP_ROUTER_ABI = JSON.stringify(uniswap_abi);
  // Instance of the Uniswap Router -> will interact with this
  UNISWAP_ROUTER_CONTRACT = new ethers.Contract(this.UNISWAP_ROUTER_ADDRESS, this.UNISWAP_ROUTER_ABI, this.provider);
  // Tx Hash
  immediateTxHash = '';
  txIsPending = false;
  txInfo: any;
  userAccount: any;
  signer: any;
  isLoggedIn: any;

  state = {
    amountIn: 0,
    gasAmount: 0,
    user: window.user,
  }

  handleChange = (e: any) => {
    // console.log(e.target.value);
    this.setState({ [e.target.name]: e.target.value });
  }

  // What we show to the screen
  render() {
    // If there is no tx currently pending, show the main screen.
    const { amountIn, gasAmount } = this.state;
    const isLoggedIn = this.isLoggedIn;

    if (!this.txIsPending) {
      return (
        <div className="App">
          <header className="App-header">


            {/* Connect To Metamask Button */}
            <div className="Metamask">
              <Button 
                id="walletButton"
                variant="contained"
                color="secondary" 
                endIcon={<AccountBalanceWalletIcon />}
                onClick={this.setUpMetaMask}>
                {isLoggedIn ? this.userAccount : "Connect Wallet"}
              </Button>
            </div>


            {/* Send Bait Transaction Button*/}
            <h1 style={{paddingTop: '50px'}}>Bait Transaction</h1>
            <form>
              <Box m={6} pb={2}>
                {/* Field for Transaction amount */}
                <h4> Amount in: </h4>
                <Input className="txInput" value={amountIn} onChange={this.handleChange} name="amountIn"
                  endAdornment={
                    <InputAdornment position="end">
                      <Icon icon="mdi:ethereum" width="24" height="24" />
                    </InputAdornment>
                  }
                />
              </Box>
            </form>

            <Button variant="contained" endIcon={<ContactlessIcon />}
              onClick={() => {
                {/* When button is click, run the setupWalletAndSendTrade Function*/ }
                // Do some input checking
                if ((this.state.amountIn > 0 && this.state.amountIn !== undefined)) {
                  this.setupWalletAndSendTrade(this.state.amountIn);
                  this.state.amountIn = 0;
                  this.state.gasAmount = 0;
                } else {
                  console.log("bad trade inputs");
                }
              }}>
              Send Bait Transaction
            </Button>
          </header>
        </div>
      );
      // Otherwise, the tx is pending, show Tx Pending card
    } else {
      return (
        <div className="App">
          <header className="App-header">
            <Card className="rounded-border" elevation={12} sx={{ minWidth: 275 }}>
              <CardContent>
                <h5 className="defaultFont">
                  Tx Pending
                </h5>
              </CardContent>
              <Box sx={{ width: '100%' }}>
                <LinearProgress />
              </Box>
              <br />
              <CardActions className="center-me">
                {/*Take tx hash and append to the etherscan url*/}
                <a target="_blank" rel="noreferrer" href={'https://goerli.etherscan.io/tx/' + this.txInfo.hash}><Button id="etherscanButton" size="small">monitor transaction progress on etherscan</Button></a>
              </CardActions>
            </Card>
            <div>
              <br/>
              <br/>
            <Button
              variant="contained"
              endIcon={<CloseIcon />}
              sx={{ minHeight: 0, minWidth: 0, padding: 2 }}
              onClick={() => {
                // Cancel the transaction
                let txId = this.txInfo.hash;
                // In Wei
                let currentTxNonce = this.txInfo.nonce;
                this.cancelTransaction(currentTxNonce);
              }}>
              Cancel Transaction
            </Button>
            </div>
            </header>
        </div>
      );
    }
  }

  async componentDidMount() {

  }

  setUpMetaMask = async () => {
    try {
      if(window.ethereum){
        console.log('Requesting Account....');
        //console.log("Account State Before ", this.state.defaultAccount);

        this.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const address = await this.provider.send("eth_requestAccounts", []);
        console.log('Address: ', address[0]);

        this.signer = this.provider.getSigner();
        console.log('Got Signer ', this.signer);
        this.userAccount = address[0];
        console.log("Account State After ", this.userAccount);
        this.forceUpdate();
        this.isLoggedIn = true;

      } else {
        alert("please install metamask");
      }
    } catch (error) {
      console.error(error);
    }
  }



  async cancelTransaction(txNonce: any) {
    //const wallet = new ethers.Wallet(this.privateKey, this.provider);
    console.log('txNonce ', txNonce);
    console.log('blockNumber ', this.txInfo.blockNumber);

    // Not yet mined...
    if (this.txInfo.blockNumber === undefined || this.txInfo.blockNumber === null) {

      // Recreate tx with new gasPrice and same nonce.
      const feeData = await this.provider.getFeeData();
      const { maxFeePerGas, maxPriorityFeePerGas } = feeData;

      let rawTx = {
        nonce: txNonce,
        to: this.userAccount,
        value: ethers.utils.parseEther("0"),
        type: 2,
        maxPriorityFeePerGas: BigNumber.from(maxPriorityFeePerGas),
        maxFeePerGas: BigNumber.from(maxFeePerGas)
      };


      console.log("gonna cancel");
      let sendTxn = await this.signer.sendTransaction(rawTx);

      this.immediateTxHash = sendTxn.hash;
      this.txInfo = sendTxn;
      this.txIsPending = true;
      this.forceUpdate();

      console.log("Cancelled Tx ", sendTxn);

      let reciept = await sendTxn.wait();
      console.log("Cancellation Reciept ", reciept);
      this.txIsPending = false;
      this.forceUpdate();


    }


  }

  async setupWalletAndSendTrade(tokenAmount: any) {
    // Create a new wallet using the private given in the .env file & a provider
    //const wallet = new ethers.Wallet(this.privateKey, this.provider);
    //
    const CYN = await Fetcher.fetchTokenData(this.chainId, this.cynTokenAddress, this.provider, 'CYN', 'Cyanide Token');
    console.log("This object is", CYN);
    // call sendTrade()
    await this.sendTrade(CYN, tokenAmount, this.provider, this.signer);
  }

  // Send trade through the uniswap router.

  async sendTrade(toxicToken: any, tokenAmount: any, provider: any, wallet: any) {
    try {
      // Get WETH/Toxic Token pair data.
      const pair = await Fetcher.fetchPairData(toxicToken, WETH[toxicToken.chainId], provider);
      console.log("Pair data: ", pair);
      // Get the route we're going to take to accomplish the trade. First param is an array of the token pair. Second param is the output token we want
      console.log('WETH[toxicToken.chainId]', WETH[toxicToken.chainId]);
      const route = new Route([pair], WETH[toxicToken.chainId]); // Get Route for WETH
      console.log("Route: ", route);

      let amountIn = ethers.utils.parseEther(tokenAmount.toString()).toString(); //helper function to convert ETH to Wei

      /*
        Setting up the Trade itself
        1st param: the trade route
        2nd param: the amount of toxicToken we wish to trade for
        3rd param: Corresponds to using the swapExactFor router function
      */
      const trade = new Trade(route, new TokenAmount(WETH[toxicToken.chainId], amountIn), TradeType.EXACT_INPUT);

      const slippageTolerance = new Percent('1000', '10000') // 1000 bips, or 10% --  must be greater than 0.3%

      // The min amount of the OUTPUT token that should be recieved from a trade, given the slippage tolerance.
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
      const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString(); // minimumAmountOut in HEX.

      const path = [WETH[toxicToken.chainId].address, toxicToken.address] // The path we need to take for this trade (from WETH -> TOXIC TOKEN)


      //const to = process.env.REACT_APP_TEST_WALLET_ADDRESS; // should be a checksummed recipient address
      const to = this.userAccount;
      const deadline = Math.floor((Date.now() / 1000) + 1.5); // 10 mins from now(?) -- the unix timestamp after which the tx will fail.
      console.log(deadline)
      const value = trade.inputAmount.raw // // needs to be converted to e.g. hex -> our amountIn that was calculated before
      const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string - amountIn in HEX

      /* 
      Creating our txn object (unsigned)

        referencing the ROUTER contract
        we use the Ethers.JS populateTransaction to create an unsigned tx (https://docs.ethers.io/v5/api/contract/contract/#contract-populateTransaction)
        we then specify which method we'd like to call, in this case swapExactEthForTokens
          we pass in the required values for that function
     
         */

      const feeData = await provider.getFeeData();
      const { maxFeePerGas, maxPriorityFeePerGas } = feeData;

        //Pending tx gas math
      const maxFeeCalc = BigNumber.from(maxFeePerGas).mul(1).div(10);
      const maxPriPerCalc = BigNumber.from(maxPriorityFeePerGas).mul(1).div(10);
      // Building Transaction
      const rawTxn = await this.UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
        value: valueHex,
        //maxFeePerGas: maxFeeCalc,
        //maxPriorityFeePerGas: maxPriPerCalc
      });
      rawTxn.type = 2;
      rawTxn.maxPriorityFeePerGas = maxPriPerCalc;
      rawTxn.maxFeePerGas = maxFeeCalc;
      //rawTxn.gasPrice = gasAmount;
      //rawTxn.gasLimit = BigNumber.from("100000");

      console.log('rawtxn: ', rawTxn);
      
      let sendTxn2 = await this.signer.sendTransaction(rawTxn);
      this.immediateTxHash = sendTxn2.hash;
      this.txInfo = sendTxn2;
      this.txIsPending = true;
      this.forceUpdate();

      console.log("Send TX ", sendTxn2);

      // let x = true;
      // this.provider.on("pending", async () => {
      //   console.log('listening....');
      //   try {
      //     let transaction = await this.provider.getTransaction(this.immediateTxHash);
      //     if (x) {
      //       if (null !== transaction.blockNumber) {
      //         console.log("Transaction Included!");
      //         x = false;
      //       } else {
      //         console.log("Waiting to be mined...");
      //       }
      //     }
      //   } catch (err) {
      //     alert(err);
      //   }
      // });


      let reciept = await sendTxn2.wait();
      console.log("Reciept ", reciept);

      this.txIsPending = false;
      this.forceUpdate();
      //Logs the information about the transaction it has been mined.
      if (reciept) {
        console.log(
          " - Transaction is mined - " + "\n" + "Transaction Hash:",
          (await sendTxn2).hash +
          "\n" +
          "Block Number: " +
          (await reciept).blockNumber +
          "\n" +
          "Navigate to https://goerli.etherscan.io/txn/" +
          (await sendTxn2).hash,
          "to see your transaction"
        );
      } else {
        console.log("Error submitting transaction");
      }

    } catch (e) {
      this.txIsPending = false;
      this.forceUpdate();

      //console.error(e)
    }
  }
}

export default App;
