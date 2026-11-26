// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {TestUSDC} from "../src/TestUSDC.sol";

/// @notice approve ka front-running hamla, aur us ke 3 hal.
/// Chalane ke liye:  forge test --match-contract FrontRunTest -vv
///
/// Asli blockchain pe Bob "mempool" mein Ali ki transaction dekh ke zyada gas
/// de ke apni transaction AAGE lagwata hai. Test mein hum yahi tarteeb
/// haath se banate hain: pehle Bob ki transaction, phir Ali ki.
contract FrontRunTest is Test {
    TestUSDC usdc;
    address ali = makeAddr("ali");
    address bob = makeAddr("bob");
    uint256 constant ONE = 1e6;

    function setUp() public {
        usdc = new TestUSDC();
        usdc.mint(ali, 1000 * ONE);

        // Shuru: Ali ne Bob ko 100 ki chaabi di
        vm.prank(ali);
        usdc.approve(bob, 100 * ONE);
    }

    // Bob ki "aage lagwai hui" transaction: jitni chaabi hai, sab utha lo
    function _bobFrontRuns() internal {
        uint256 allowed = usdc.allowance(ali, bob);
        vm.prank(bob);
        usdc.transferFrom(ali, bob, allowed);
    }

    function _log(string memory s) internal view {
        console.log(s);
        console.log("    Bob ne kul uthaye:", usdc.balanceOf(bob) / ONE, "| Bob ki baqi chaabi:", usdc.allowance(ali, bob) / ONE);
    }

    // ==================================================================
    // HAMLA: normal approve -> Bob ko 150 mil jate hain
    // ==================================================================
    function test_Attack_ApproveFrontRun() public {
        console.log("=== HAMLA (normal approve) ===");
        _bobFrontRuns(); // Bob ne line mein dekha, pehle 100 utha liye
        _log("[1] Bob ne Ali ki transaction se PEHLE 100 utha liye:");

        vm.prank(ali);
        usdc.approve(bob, 50 * ONE); // Ali ki transaction ab chali
        _log("[2] Ali ka approve(Bob, 50) chala - Bob ko NAYI chaabi mil gayi:");

        _bobFrontRuns();
        _log("[3] Bob ne 50 bhi utha liye:");

        assertEq(usdc.balanceOf(bob), 150 * ONE); // 100 ki ijazat thi, 150 le gaya!
    }

    // ==================================================================
    // HAL 1: pehle 0, phir check, phir naya
    // ==================================================================
    function test_Fix1_ResetToZeroFirst() public {
        console.log("=== HAL 1 (pehle 0) ===");
        uint256 bobBefore = usdc.balanceOf(bob);
        _bobFrontRuns();

        vm.prank(ali);
        usdc.approve(bob, 0); // qadam 1
        _log("[1] Ali ne chaabi 0 kar di:");

        // Ali check karti hai: kya Bob ne beech mein kuch uthaya?
        bool bobAlreadyTook = usdc.balanceOf(bob) > bobBefore;
        if (!bobAlreadyTook) {
            vm.prank(ali);
            usdc.approve(bob, 50 * ONE); // qadam 2 sirf tab
        }
        _log("[2] Bob ne beech mein utha liye the, is liye Ali ne 50 ki chaabi NAHI di:");

        assertEq(usdc.balanceOf(bob), 100 * ONE);
        assertEq(usdc.allowance(ali, bob), 0);
    }

    // ==================================================================
    // HAL 2: decreaseAllowance -> Bob ke baad chale to revert
    // ==================================================================
    function test_Fix2_DecreaseAllowance() public {
        console.log("=== HAL 2 (decreaseAllowance) ===");
        _bobFrontRuns();
        _log("[1] Bob ne pehle 100 utha liye:");

        vm.prank(ali);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.InsufficientAllowance.selector, 0, 50 * ONE));
        usdc.decreaseAllowance(bob, 50 * ONE); // 0 - 50 = na-mumkin -> REVERT
        _log("[2] Ali ka decreaseAllowance(50) REVERT hua, Bob ko nayi chaabi nahi mili:");

        assertEq(usdc.balanceOf(bob), 100 * ONE);
        assertEq(usdc.allowance(ali, bob), 0);
    }

    // ==================================================================
    // HAL 3: safeApprove (compare-and-set)
    // ==================================================================
    function test_Fix3_SafeApprove() public {
        console.log("=== HAL 3 (safeApprove) ===");
        _bobFrontRuns();
        _log("[1] Bob ne pehle 100 utha liye:");

        vm.prank(ali);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.AllowanceChanged.selector, 0, 100 * ONE));
        usdc.safeApprove(bob, 100 * ONE, 50 * ONE); // "100 hona chahiye tha" - 0 mila -> REVERT
        _log("[2] Ali ka safeApprove(Bob, 100 -> 50) REVERT hua, board badal chuka tha:");

        assertEq(usdc.balanceOf(bob), 100 * ONE);
    }

    // Jab koi hamla na ho, to safeApprove aur decreaseAllowance normal kaam karte hain
    function test_NoAttack_FixesWorkNormally() public {
        vm.prank(ali);
        usdc.safeApprove(bob, 100 * ONE, 70 * ONE);
        assertEq(usdc.allowance(ali, bob), 70 * ONE);

        vm.prank(ali);
        usdc.decreaseAllowance(bob, 20 * ONE);
        assertEq(usdc.allowance(ali, bob), 50 * ONE);

        vm.prank(ali);
        usdc.increaseAllowance(bob, 10 * ONE); // 50 + 10
        assertEq(usdc.allowance(ali, bob), 60 * ONE);
    }
}
