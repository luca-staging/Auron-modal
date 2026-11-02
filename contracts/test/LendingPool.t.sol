// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {Stablecoin} from "../src/Stablecoin.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {LendingPool} from "../src/LendingPool.sol";

contract LendingPoolTest is Test {
    RWAToken hnvwa;
    Stablecoin hnvUsd;
    PriceOracle oracle;
    LendingPool pool;

    address user = address(0xBEEF);

    function setUp() public {
        hnvwa = new RWAToken(address(this));
        hnvUsd = new Stablecoin(address(this));
        oracle = new PriceOracle(address(this));
        oracle.setPrice(address(hnvwa), 1e18);
        oracle.setPrice(address(hnvUsd), 1e18);
        pool = new LendingPool(address(hnvwa), address(hnvUsd), address(oracle), address(this));
        hnvUsd.mint(address(pool), 1_000_000e18);

        hnvwa.mint(user, 10_000e18);
        vm.startPrank(user);
        hnvwa.approve(address(pool), type(uint256).max);
        hnvUsd.approve(address(pool), type(uint256).max);
        vm.stopPrank();
    }

    function test_depositBorrowRepayWithdraw() public {
        vm.startPrank(user);
        pool.depositCollateral(10_000e18);
        pool.borrow(6_000e18);

        (uint256 coll, uint256 debt, uint256 hf) = pool.getPosition(user);
        assertEq(coll, 10_000e18);
        assertEq(debt, 6_000e18);
        assertGt(hf, 1e18);

        // fund repay (user already has 6000 hnvUSD from borrow)
        pool.repay(6_000e18);
        pool.withdrawCollateral(10_000e18);
        vm.stopPrank();

        (coll, debt,) = pool.getPosition(user);
        assertEq(coll, 0);
        assertEq(debt, 0);
    }

    function test_faucet() public {
        vm.prank(user);
        hnvwa.faucet(1_000e18);
        assertEq(hnvwa.balanceOf(user), 11_000e18);
    }

    function test_cannotBorrowAboveLtv() public {
        vm.startPrank(user);
        pool.depositCollateral(10_000e18);
        vm.expectRevert(LendingPool.InsufficientCollateral.selector);
        pool.borrow(8_000e18); // 80% > 70% LTV
        vm.stopPrank();
    }
}
