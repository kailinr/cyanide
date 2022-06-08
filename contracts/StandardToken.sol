// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StandardToken is ERC20, Pausable, Ownable {
    constructor() ERC20("StandardToken", "STD") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    event FallbackCalled(address);

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev fallback invoked if contract call contains no data
    */

    fallback() external {
        emit FallbackCalled(msg.sender);
    }
    
    /**
     * @dev - renounceOwnership override
    */
    
    function renounceOwnership() public override onlyOwner {}

    }




