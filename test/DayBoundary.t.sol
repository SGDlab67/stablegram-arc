// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MockShare} from "../src/MockShare.sol";
import {Stableplan} from "../src/Stableplan.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";

/// @notice The agent's daily cap is a UTC-day bucket: `block.timestamp / 1 days`.
/// These tests pin the boundary, which is the part a user notices and the part
/// that would quietly leak budget if the bucket were ever compared wrongly.
contract DayBoundaryTest is Test {
    MockShare share;
    UsernameRegistry usernames;
    Stableplan gram;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address agent = makeAddr("agent");

    string constant MEMO = "groceries";

    /// A day number far enough in that `nextAt`-style casts are realistic.
    uint256 constant DAY = 20_000;

    function setUp() public {
        share = new MockShare("Mock Circle Share", "mCRCL");
        usernames = new UsernameRegistry();
        gram = new Stableplan(usernames);

        share.mint(alice, 1e30); // plenty, so a revert is never about the balance

        vm.prank(alice);
        usernames.claim("alice");
        vm.prank(bob);
        usernames.claim("bob");
    }

    // --- helpers, same shape as Flow.t.sol ---

    function _authorizeAgent(uint128 perSend, uint128 perDay) private {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        gram.authorizeAgent(agent);
        gram.setLimit(address(share), perSend, perDay);
        vm.stopPrank();
    }

    function _send(uint256 value) private {
        vm.prank(agent);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", value, MEMO);
    }

    function _sendExpectingOverDaily(uint256 value, uint256 wouldBe, uint256 perDay) private {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Stableplan.OverDailyLimit.selector, wouldBe, perDay));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", value, MEMO);
    }

    function _spent() private view returns (uint48 day, uint256 amount) {
        (uint48 d, uint208 a) = gram.spentOf(alice, address(share));
        return (d, a);
    }

    function _remaining() private view returns (uint256) {
        return gram.remainingToday(alice, address(share));
    }

    /// Land on `secondsIntoDay` of UTC day `day`.
    function _warpTo(uint256 day, uint256 secondsIntoDay) private {
        vm.warp(day * 1 days + secondsIntoDay);
    }

    // --- 1. the cap is never exceeded within a day ---

    /// Three sends inside one UTC day: everything that succeeds sums to at most
    /// perDay, and the first send that would push the total over it reverts.
    function testFuzz_capIsNeverExceededWithinADay(uint96 a, uint96 b, uint256 secondsIntoDay) public {
        uint128 perDay = 60e18;
        _authorizeAgent(type(uint128).max, perDay); // per-send out of the way
        _warpTo(DAY, bound(secondsIntoDay, 0, 1 days - 1));

        uint256[3] memory values =
            [uint256(bound(a, 1, 50e18)), uint256(bound(b, 1, 50e18)), uint256(bound(a, 1, 50e18)) / 2 + 1];

        uint256 expected;
        for (uint256 i; i < values.length; i++) {
            uint256 wouldBe = expected + values[i];
            if (wouldBe > perDay) {
                _sendExpectingOverDaily(values[i], wouldBe, perDay);
            } else {
                _send(values[i]);
                expected = wouldBe;
            }

            (uint48 day, uint256 amount) = _spent();
            assertLe(expected, perDay, "sum of successful sends over the cap");
            assertEq(amount, expected, "counter disagrees with what moved");
            if (expected > 0) assertEq(day, uint48(block.timestamp / 1 days));
            assertEq(_remaining(), perDay - expected);
        }
        assertEq(share.balanceOf(bob), expected, "tokens moved without the counter");
    }

    // --- 2. the budget resets at the boundary, not before ---

    /// The on-camera case: spend at 23:59:59, cross midnight, spend again.
    function test_budgetResetsAt235959ToThenNextDay() public {
        _authorizeAgent(10e18, 10e18);

        _warpTo(DAY, 1 days - 1);
        assertEq(block.timestamp % 1 days, 86_399, "not the last second of the day");

        _send(10e18);
        assertEq(_remaining(), 0, "the last second of a day still consumes budget");

        vm.warp(block.timestamp + 1); // 00:00:00
        assertEq(_remaining(), 10e18, "midnight did not reset the budget");

        vm.warp(block.timestamp + 1); // 00:00:01
        assertEq(_remaining(), 10e18);
        _send(10e18);

        assertEq(share.balanceOf(bob), 20e18);
        (uint48 day, uint256 amount) = _spent();
        assertEq(day, uint48(DAY + 1));
        assertEq(amount, 10e18);
    }

    /// One second forward inside the same day resets nothing.
    function test_oneSecondInsideTheDayDoesNotReset() public {
        _authorizeAgent(10e18, 10e18);

        _warpTo(DAY, 1 days - 2); // 23:59:58
        _send(10e18);

        vm.warp(block.timestamp + 1); // 23:59:59, same day
        assertEq(_remaining(), 0, "budget reset before the boundary");
        _sendExpectingOverDaily(1, 10e18 + 1, 10e18);
    }

    /// The same claim for any second of the day: +1s resets the budget only
    /// when that second was the day's last.
    function testFuzz_oneSecondResetsOnlyAtTheBoundary(uint96 a, uint256 secondsIntoDay) public {
        uint128 perDay = uint128(bound(a, 1, 50e18));
        uint256 sec = bound(secondsIntoDay, 0, 1 days - 1);
        _authorizeAgent(type(uint128).max, perDay);

        _warpTo(DAY, sec);
        _send(perDay);
        assertEq(_remaining(), 0);

        vm.warp(block.timestamp + 1);
        bool crossed = sec == 1 days - 1;
        assertEq(_remaining(), crossed ? perDay : 0);
        assertEq(block.timestamp / 1 days, crossed ? DAY + 1 : DAY);
    }

    // --- 3. remainingToday agrees with the counter ---

    /// remainingToday is perDay minus today's counter, and perDay flat once the
    /// stored day is stale. Then the edge: exactly remainingToday goes through,
    /// one more than that does not.
    function testFuzz_remainingTodayAgreesWithTheCounter(uint96 a, uint256 secondsIntoDay, uint8 daysAhead) public {
        uint128 perDay = 60e18;
        _authorizeAgent(type(uint128).max, perDay);
        _warpTo(DAY, bound(secondsIntoDay, 0, 1 days - 1));

        _send(bound(a, 1, perDay)); // any reachable state of the counter

        (uint48 storedDay, uint256 amount) = _spent();
        assertEq(storedDay, uint48(DAY));
        assertEq(_remaining(), perDay - amount, "view disagrees with the counter");

        vm.warp(block.timestamp + uint256(daysAhead) * 1 days);
        assertEq(_remaining(), daysAhead > 0 ? perDay : perDay - amount);

        // One over whatever is left always lands exactly one over the cap,
        // stale day or not.
        uint256 left = _remaining();
        _sendExpectingOverDaily(left + 1, perDay + 1, perDay);
        _send(left);
        assertEq(_remaining(), 0, "exactly remainingToday should spend it all");
        _sendExpectingOverDaily(1, perDay + 1, perDay);
    }

    // --- 4. a stale day never leaks budget ---

    /// Yesterday's spend, or any earlier day's, never counts against today.
    function testFuzz_staleDayNeverLeaksBudget(uint96 a, uint16 daysAhead, uint256 secondsIntoDay) public {
        uint128 perDay = 50e18;
        _authorizeAgent(type(uint128).max, perDay);

        uint256 firstDaySpend = bound(a, 1, perDay);
        _warpTo(DAY, bound(secondsIntoDay, 0, 1 days - 1));
        _send(firstDaySpend);

        uint256 ahead = bound(daysAhead, 1, 10_000);
        _warpTo(DAY + ahead, bound(secondsIntoDay, 0, 1 days - 1));

        assertEq(_remaining(), perDay, "a stale day ate into the new day's budget");
        _send(perDay); // the full cap, as if nothing had ever been spent

        (uint48 day, uint256 amount) = _spent();
        assertEq(day, uint48(DAY + ahead));
        assertEq(amount, perDay, "the stale amount was carried forward");
        assertEq(share.balanceOf(bob), firstDaySpend + perDay);
    }
}
