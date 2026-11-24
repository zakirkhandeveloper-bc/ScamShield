// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TestUSDC} from "../src/TestUSDC.sol";

/// @notice TestUSDC ke tests. Har test ek kahani hai: Ali (maalik), Bob (dost), Chor.
contract TestUSDCTest is Test {
    TestUSDC token;

    address ali = makeAddr("ali");
    address bob = makeAddr("bob");
    address chor = makeAddr("chor");

    uint256 constant ONE = 1e6; // 1 tUSDC (6 decimals)

    function setUp() public {
        token = new TestUSDC();
        token.mint(ali, 1000 * ONE); // Ali ke paas 1000 tUSDC
    }

    // 1) Ali khud Bob ko 100 bhejta hai
    function test_Transfer() public {
        vm.prank(ali); // agli call "Ali" ki taraf se hogi
        token.transfer(bob, 100 * ONE);

        assertEq(token.balanceOf(ali), 900 * ONE);
        assertEq(token.balanceOf(bob), 100 * ONE);
    }

    // 2) Ali apne paas se zyada nahi bhej sakta
    function test_RevertWhen_TransferMoreThanBalance() public {
        vm.prank(ali);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.InsufficientBalance.selector, 1000 * ONE, 1001 * ONE));
        token.transfer(bob, 1001 * ONE);
    }

    // 3) Ijazat ke BAGHAIR chor kuch nahi le sakta
    function test_RevertWhen_ChorTakesWithoutApproval() public {
        vm.prank(chor);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.InsufficientAllowance.selector, 0, 500 * ONE));
        token.transferFrom(ali, chor, 500 * ONE);

        assertEq(token.balanceOf(ali), 1000 * ONE); // Ali ke paise mehfooz
    }

    // 4) Limited ijazat: Ali ne 50 ki ijazat di -> sirf 50 tak
    function test_LimitedApproval() public {
        vm.prank(ali);
        token.approve(bob, 50 * ONE);

        vm.prank(bob);
        token.transferFrom(ali, bob, 50 * ONE);
        assertEq(token.allowance(ali, bob), 0); // ijazat khatam

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.InsufficientAllowance.selector, 0, 1));
        token.transferFrom(ali, bob, 1); // ek unit bhi nahi
    }

    // 5) ⚠️ UNLIMITED ijazat: chor jab chahe, jitni dafa chahe le sakta hai
    function test_UnlimitedApproval_ChorDrainsEverything() public {
        vm.prank(ali);
        token.approve(chor, type(uint256).max); // "Claim Airdrop" ke peeche yahi chhupa tha

        // Pehle din chor 300 le gaya
        vm.prank(chor);
        token.transferFrom(ali, chor, 300 * ONE);

        // Ijazat kam hi nahi hui!
        assertEq(token.allowance(ali, chor), type(uint256).max);

        // Ali ne baad mein aur paise kamaye...
        token.mint(ali, 5000 * ONE);

        // ...chor ne woh bhi utha liye - Ali ka koi naya signature nahi chahiye
        uint256 baqi = token.balanceOf(ali);
        vm.prank(chor);
        token.transferFrom(ali, chor, baqi);

        assertEq(token.balanceOf(ali), 0);
        assertEq(token.balanceOf(chor), 6000 * ONE);
    }

    // 6) ✅ REVOKE: ijazat 0 karte hi chor ruk jata hai
    function test_Revoke_StopsChor() public {
        vm.prank(ali);
        token.approve(chor, type(uint256).max);

        vm.prank(ali);
        token.approve(chor, 0); // chaabi wapas li (ScamShield ka "Revoke" button yahi karega)

        vm.prank(chor);
        vm.expectRevert(abi.encodeWithSelector(TestUSDC.InsufficientAllowance.selector, 0, 1));
        token.transferFrom(ali, chor, 1);
    }

    // 7) Approval event chhapta hai (ScamShield dashboard isi ko padhega)
    function test_ApproveEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit TestUSDC.Approval(ali, chor, type(uint256).max);

        vm.prank(ali);
        token.approve(chor, type(uint256).max);
    }

    // 8) FUZZ: koi bhi amount ho, kul supply kabhi nahi badalti jab transfer ho
    function testFuzz_TransferKeepsTotalSupply(uint256 amount) public {
        amount = bound(amount, 0, 1000 * ONE); // amount ko Ali ke balance ke andar rakho
        vm.prank(ali);
        token.transfer(bob, amount);

        assertEq(token.balanceOf(ali) + token.balanceOf(bob), token.totalSupply());
    }
}
