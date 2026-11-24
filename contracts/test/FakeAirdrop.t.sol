// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {TestUSDC} from "../src/TestUSDC.sol";
import {FakeAirdrop} from "../src/FakeAirdrop.sol";

/// @notice Drainer hamle ki poori kahani. Chalane ke liye:  forge test --mt Story -vv
contract FakeAirdropTest is Test {
    TestUSDC usdc;
    FakeAirdrop airdrop;

    address chor = makeAddr("chor");
    address ali = makeAddr("ali"); // victim
    address sara = makeAddr("sara"); // hoshiyar user

    uint256 constant ONE = 1e6;

    function setUp() public {
        usdc = new TestUSDC();

        vm.prank(chor); // chor contract deploy karta hai
        airdrop = new FakeAirdrop(IERC20(address(usdc)));

        usdc.mint(ali, 1000 * ONE);
        usdc.mint(sara, 1000 * ONE);
    }

    function _log(string memory step) internal view {
        console.log(step);
        console.log("    Ali  :", usdc.balanceOf(ali) / ONE, "tUSDC");
        console.log("    Chor :", usdc.balanceOf(chor) / ONE, "tUSDC");
    }

    // ==================================================================
    // KAHANI: Ali ek "Free Airdrop" site pe jata hai
    // ==================================================================
    function test_Story_AliGetsDrained() public {
        _log("[0] Shuru mein:");

        // Button 1: "Enable Claiming"  -> asal mein UNLIMITED approve
        vm.prank(ali);
        usdc.approve(address(airdrop), type(uint256).max);
        _log("[1] Ali ne 'Enable Claiming' dabaya (approve unlimited). Abhi kuch nahi gaya:");

        // Button 2: "Claim 100 tUSDC"  -> asal mein sab chor ko
        vm.prank(ali);
        airdrop.claim();
        _log("[2] Ali ne 'Claim' dabaya. Inaam ki jagah:");

        assertEq(usdc.balanceOf(ali), 0);
        assertEq(usdc.balanceOf(chor), 1000 * ONE);

        // Ek mahine baad Ali ko tankhwah mili
        usdc.mint(ali, 500 * ONE);
        _log("[3] Ek mahine baad Ali ko 500 tUSDC tankhwah mili:");

        // Chor ne chupke se sweep chalaya - Ali ne kuch nahi kiya
        vm.prank(chor);
        airdrop.sweep(ali);
        _log("[4] Chor ne sweep() chalaya. Ali ne KUCH sign nahi kiya:");

        assertEq(usdc.balanceOf(ali), 0);
        assertEq(usdc.balanceOf(chor), 1500 * ONE);
    }

    // ==================================================================
    // BACHAO 1: Sara ne limited approve kiya -> nuqsan sirf utna
    // ==================================================================
    function test_LimitedApproval_LimitsDamage() public {
        vm.prank(sara);
        usdc.approve(address(airdrop), 10 * ONE); // sirf 10 ki ijazat

        vm.prank(sara);
        airdrop.claim();

        assertEq(usdc.balanceOf(sara), 990 * ONE); // sirf 10 gaye
        assertEq(usdc.balanceOf(chor), 10 * ONE);
    }

    // ==================================================================
    // BACHAO 2: Revoke ke baad sweep kuch nahi le sakta
    // ==================================================================
    function test_Revoke_BlocksSweep() public {
        vm.prank(ali);
        usdc.approve(address(airdrop), type(uint256).max);

        vm.prank(ali);
        usdc.approve(address(airdrop), 0); // ScamShield ka "Revoke" button

        vm.prank(chor);
        airdrop.sweep(ali);

        assertEq(usdc.balanceOf(ali), 1000 * ONE); // sab mehfooz
        assertEq(usdc.balanceOf(chor), 0);
    }

    // ==================================================================
    // BACHAO 3: Approve hi nahi kiya to claim se kuch nahi jata
    // ==================================================================
    function test_NoApproval_NothingLost() public {
        vm.prank(sara);
        airdrop.claim();
        assertEq(usdc.balanceOf(sara), 1000 * ONE);
    }

    // Access control: sweep sirf chor chala sakta hai
    function test_RevertWhen_NonAttackerSweeps() public {
        vm.prank(sara);
        vm.expectRevert(FakeAirdrop.NotAttacker.selector);
        airdrop.sweep(ali);
    }

    // Jhoota event: explorer pe "100 ka inaam" dikhta hai, asal mein 0 mila
    function test_FakeEventLies() public {
        vm.prank(ali);
        usdc.approve(address(airdrop), type(uint256).max);

        vm.expectEmit(true, false, false, true);
        emit FakeAirdrop.AirdropClaimed(ali, 100e6);
        vm.prank(ali);
        airdrop.claim();

        assertEq(usdc.balanceOf(ali), 0); // inaam? nahi, sab gaya
    }
}
