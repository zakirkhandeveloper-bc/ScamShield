// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
contract TestUSDC {

    string public constant name = "Test USD Coin";
    string public constant symbol = "tUSDC";
    uint8 public constant decimals = 6;

    uint256 public totalSupply;
    mapping(address owner => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance(uint256 available, uint256 required);
    error InsufficientAllowance(uint256 allowed, uint256 required);
    error ZeroAddress();

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance(allowed, amount);
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
        }
        _move(from, to, amount);
        return true;
    }

    // ------------------------------------------------------------------
    // 7) mint - naye token banana
    //    ⚠️ Yahan KOI BHI mint kar sakta hai (faucet), sirf testing ke liye.
    //    Asli token mein agar owner jab chahe mint kar sake, to woh
    //    supply badha ke price gira sakta hai (rug pull). ScamShield ka
    //    contract scanner aise "mint" functions ko RED FLAG karega.
    // ------------------------------------------------------------------
    function mint(address to, uint256 amount) external {
        if (to == address(0)) revert ZeroAddress();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    // ------------------------------------------------------------------
    // Andar ka helper: hisaab mein se kam karo, doosre mein jama karo
    // ------------------------------------------------------------------
    function _move(address from, address to, uint256 amount) private {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance(bal, amount);
        unchecked {
            balanceOf[from] = bal - amount; // upar check ho chuka, underflow mumkin nahi
        }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
