pragma solidity ^0.8.0;


import "./interface/IUniswapV2Pair.sol";
import "./lib/UniswapV2Library.sol";
import "./interface/IERC20.sol";

import "hardhat/console.sol";


contract CavemanBot {
    using SafeMath for uint;
    address public factory;
    address private owner;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    constructor(address _factory) {
        factory = _factory;
        owner = msg.sender;
    }

    function swap(uint amountIn, address[] calldata path) external onlyOwner {


        

        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            address pair = UniswapV2Library.pairFor(factory, input, output);

            //amount is calculated this way to account for cyanide's fee on transferring from this contract to the uniswap pair.
            uint amount = i == 0 ? amountIn : IERC20(path[i]).balanceOf(address(this));
            uint preTransfer = IERC20(path[i]).balanceOf(pair);
            IERC20(path[i]).transfer(pair, amount);
            uint postTransfer = IERC20(path[i]).balanceOf(pair);

            (uint reserveIn, uint reserveOut) = UniswapV2Library.getReserves(factory, input, output);
            uint amountOut = i == 0 ? amountIn : UniswapV2Library.getAmountOut(postTransfer - preTransfer, reserveIn, reserveOut);

            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = address(this);

            IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }

    }


    function cavemanNoLitter() external onlyOwner {
        selfdestruct(payable(owner));
    }
}



