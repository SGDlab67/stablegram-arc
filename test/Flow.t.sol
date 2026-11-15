// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {EligibilityRegistry} from "../src/EligibilityRegistry.sol";
import {GatedShare} from "../src/GatedShare.sol";
import {MockShare} from "../src/MockShare.sol";
import {Osmo} from "../src/Osmo.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";

contract FlowTest is Test {
    MockShare share;
    EligibilityRegistry registry;
    UsernameRegistry usernames;
    GatedShare gated;
    Osmo gram;

    address compliance = makeAddr("compliance");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory"); // has a name, never cleared by compliance
    address agent = makeAddr("agent");

    string constant MEMO = unicode"pizza last night 🍕";

    function setUp() public {
        share = new MockShare("Mock Circle Share", "mCRCL");
        registry = new EligibilityRegistry(compliance);
        usernames = new UsernameRegistry();
        gated = new GatedShare(share, "Sendable Circle Share", "sCRCL", registry, usernames);
        gram = new Osmo(usernames);

        vm.startPrank(compliance);
        registry.set(alice, true);
        registry.set(bob, true);
        vm.stopPrank();

        share.mint(alice, 100e18);

        vm.prank(alice);
        usernames.claim("alice");
        vm.prank(bob);
        usernames.claim("Bob"); // claimed with a capital, resolves either way
        vm.prank(mallory);
        usernames.claim("mallory"); // anyone may claim a name; holding is what is gated
    }

    function _wrap(address who, uint256 amount) private {
        vm.startPrank(who);
        share.approve(address(gated), amount);
        gated.depositFor(who, amount);
        vm.stopPrank();
    }

    // --- usernames ---

    function test_usernameResolvesCaseInsensitively() public view {
        assertEq(usernames.resolve("bob"), bob);
        assertEq(usernames.resolve("BOB"), bob);
        assertEq(usernames.resolve("Bob"), bob);
    }

    function test_usernameCannotBeTakenTwice() public {
        vm.prank(agent);
        vm.expectRevert(UsernameRegistry.NameTaken.selector);
        usernames.claim("ALICE");
    }

    function test_oneNamePerAddress() public {
        vm.prank(alice);
        vm.expectRevert(UsernameRegistry.AlreadyClaimed.selector);
        usernames.claim("alice2");
    }

    function test_rejectsBadNames() public {
        vm.startPrank(agent);
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("ab"); // too short
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("twenty_one_chars_long"); // too long
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("has space");
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim(unicode"emoji_face_🙂");
        vm.stopPrank();
    }

    // --- wrapping and the gate ---

    function test_wrapAndUnwrapRoundTrips() public {
        _wrap(alice, 40e18);
        assertEq(gated.balanceOf(alice), 40e18);
        assertEq(share.balanceOf(alice), 60e18);

        vm.prank(alice);
        gated.withdrawTo(alice, 40e18);
        assertEq(gated.balanceOf(alice), 0);
        assertEq(share.balanceOf(alice), 100e18);
    }

    function test_wrappedShareKeepsUnderlyingDecimals() public view {
        assertEq(gated.decimals(), share.decimals());
    }

    function test_ineligibleCannotReceive() public {
        _wrap(alice, 10e18);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GatedShare.NotEligible.selector, mallory));
        gated.transfer(mallory, 1e18);
    }

    function test_ineligibleCannotWrap() public {
        share.mint(mallory, 5e18);
        vm.startPrank(mallory);
        share.approve(address(gated), 5e18);
        vm.expectRevert(abi.encodeWithSelector(GatedShare.NotEligible.selector, mallory));
        gated.depositFor(mallory, 5e18);
        vm.stopPrank();
    }

    /// The gate must never be able to trap somebody's shares.
    function test_revokedHolderCanStillUnwrap() public {
        _wrap(alice, 10e18);
        vm.prank(compliance);
        registry.set(alice, false);

        vm.prank(alice);
        gated.withdrawTo(alice, 10e18);
        assertEq(share.balanceOf(alice), 100e18);
    }

    function test_cannotSendToARevokedHolder() public {
        _wrap(alice, 10e18);
        vm.prank(compliance);
        registry.set(bob, false);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(GatedShare.NotEligible.selector, bob));
        gated.sendToUsername("bob", 1e18, MEMO);
    }

    // --- sending a share by name ---

    function test_sendShareToUsername() public {
        _wrap(alice, 50e18);

        vm.prank(alice);
        address to = gated.sendToUsername("bob", 20e18, MEMO);

        assertEq(to, bob);
        assertEq(gated.balanceOf(bob), 20e18);
        assertEq(gated.balanceOf(alice), 30e18);
    }

    function test_sendFractionOfAShare() public {
        _wrap(alice, 1e18);

        vm.prank(alice);
        gated.sendToUsername("bob", 0.25e18, "quarter share, happy birthday");

        // the thing ACATS cannot do at all
        assertEq(gated.balanceOf(bob), 0.25e18);
        assertEq(gated.balanceOf(alice), 0.75e18);
    }

    function test_shareSendEmitsTheMemo() public {
        _wrap(alice, 10e18);
        vm.expectEmit(true, true, true, true, address(gated));
        emit GatedShare.Sent(address(gated), alice, bob, "bob", 1e18, MEMO, false);
        vm.prank(alice);
        gated.sendToUsername("bob", 1e18, MEMO);
    }

    function test_sendToUnclaimedNameReverts() public {
        _wrap(alice, 10e18);
        vm.prank(alice);
        vm.expectRevert(UsernameRegistry.NoSuchName.selector);
        gated.sendToUsername("nobody", 1e18, MEMO);
    }

    function test_memoHasALimit() public {
        _wrap(alice, 10e18);
        string memory tooLong = new string(141);
        vm.prank(alice);
        vm.expectRevert(GatedShare.MemoTooLong.selector);
        gated.sendToUsername("bob", 1e18, tooLong);
    }

    // --- Osmo: crypto, and anything else ---

    function test_sendsAnyToken() public {
        vm.startPrank(alice);
        share.approve(address(gram), 30e18);
        address to = gram.sendToken(IERC20(address(share)), "bob", 30e18, MEMO);
        vm.stopPrank();

        assertEq(to, bob);
        assertEq(share.balanceOf(bob), 30e18);
        assertEq(share.balanceOf(alice), 70e18);
    }

    /// Osmo has no gate of its own, so the share's gate must still bite.
    function test_cannotBypassTheGateThroughOsmo() public {
        _wrap(alice, 10e18);
        vm.startPrank(alice);
        gated.approve(address(gram), 10e18);
        vm.expectRevert(abi.encodeWithSelector(GatedShare.NotEligible.selector, mallory));
        gram.sendToken(IERC20(address(gated)), "mallory", 1e18, MEMO);
        vm.stopPrank();
    }

    function test_sendsNativeCurrency() public {
        // On Arc the native currency is USDC, so this is how you send dollars.
        vm.deal(alice, 5 ether);
        uint256 before = bob.balance;

        vm.prank(alice);
        gram.sendNative{value: 2 ether}("bob", MEMO);

        assertEq(bob.balance - before, 2 ether);
        assertEq(alice.balance, 3 ether);
    }

    function test_rejectsEmptySends() public {
        vm.startPrank(alice);
        vm.expectRevert(Osmo.NothingToSend.selector);
        gram.sendToken(IERC20(address(share)), "bob", 0, MEMO);
        vm.expectRevert(Osmo.NothingToSend.selector);
        gram.sendNative("bob", MEMO);
        vm.stopPrank();
    }

    function test_rejectsUnclaimedName() public {
        vm.startPrank(alice);
        share.approve(address(gram), 1e18);
        vm.expectRevert(UsernameRegistry.NoSuchName.selector);
        gram.sendToken(IERC20(address(share)), "nobody", 1e18, MEMO);
        vm.stopPrank();
    }

    /// Osmo must never be able to hold anything.
    function testFuzz_osmoKeepsNoBalance(uint96 tokenAmount, uint96 nativeAmount) public {
        tokenAmount = uint96(bound(tokenAmount, 1, 100e18));
        nativeAmount = uint96(bound(nativeAmount, 1, 100 ether));
        vm.deal(alice, nativeAmount);

        vm.startPrank(alice);
        share.approve(address(gram), tokenAmount);
        gram.sendToken(IERC20(address(share)), "bob", tokenAmount, MEMO);
        gram.sendNative{value: nativeAmount}("bob", MEMO);
        vm.stopPrank();

        assertEq(share.balanceOf(address(gram)), 0);
        assertEq(address(gram).balance, 0);
    }

    // --- the agent, and its limits ---

    function _authorizeAgent(uint128 perSend, uint128 perDay) private {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        gram.authorizeAgent(agent);
        gram.setLimit(address(share), perSend, perDay);
        vm.stopPrank();
    }

    function test_agentSendsWithinLimits() public {
        _authorizeAgent(10e18, 25e18);

        vm.prank(agent);
        address to = gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, "rent, as you asked");

        assertEq(to, bob);
        assertEq(share.balanceOf(bob), 10e18);
        assertEq(gram.remainingToday(alice, address(share)), 15e18);
    }

    function test_agentCannotExceedPerSendLimit() public {
        _authorizeAgent(10e18, 100e18);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Osmo.OverPerSendLimit.selector, 11e18, 10e18));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 11e18, MEMO);
    }

    function test_agentCannotExceedDailyLimit() public {
        _authorizeAgent(10e18, 25e18);

        vm.startPrank(agent);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        vm.expectRevert(abi.encodeWithSelector(Osmo.OverDailyLimit.selector, 30e18, 25e18));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        vm.stopPrank();

        assertEq(gram.remainingToday(alice, address(share)), 5e18);
    }

    function test_dailyLimitResetsTheNextDay() public {
        _authorizeAgent(10e18, 10e18);

        vm.prank(agent);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        assertEq(gram.remainingToday(alice, address(share)), 0);

        vm.warp(block.timestamp + 1 days);
        assertEq(gram.remainingToday(alice, address(share)), 10e18);

        vm.prank(agent);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        assertEq(share.balanceOf(bob), 20e18);
    }

    function test_freshAgentCanSendNothingUntilALimitIsSet() public {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        gram.authorizeAgent(agent);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Osmo.OverPerSendLimit.selector, 1, 0));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1, MEMO);
    }

    function test_revokingTheAgentIsImmediate() public {
        _authorizeAgent(10e18, 100e18);

        vm.prank(alice);
        gram.authorizeAgent(address(0));

        vm.prank(agent);
        vm.expectRevert(Osmo.NotAgent.selector);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1e18, MEMO);
    }

    function test_strangerCannotSendForYou() public {
        _authorizeAgent(10e18, 100e18);

        vm.prank(mallory);
        vm.expectRevert(Osmo.NotAgent.selector);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1e18, MEMO);
    }

    /// Nobody has authorized an agent, so address(0) must not be one either.
    function test_unsetAgentIsNotAnAgent() public {
        vm.prank(address(0));
        vm.expectRevert(Osmo.NotAgent.selector);
        gram.sendAsAgent(bob, IERC20(address(share)), "alice", 1e18, MEMO);
    }

    function test_agentLimitsArePerToken() public {
        _authorizeAgent(10e18, 10e18); // limit is on `share` only

        _wrap(alice, 20e18);
        vm.prank(alice);
        gated.approve(address(gram), 20e18);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Osmo.OverPerSendLimit.selector, 1e18, 0));
        gram.sendAsAgent(alice, IERC20(address(gated)), "bob", 1e18, MEMO);
    }

    function test_agentStillCannotBreakTheEligibilityGate() public {
        _wrap(alice, 20e18);
        vm.startPrank(alice);
        gated.approve(address(gram), 20e18);
        gram.authorizeAgent(agent);
        gram.setLimit(address(gated), 10e18, 10e18);
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(GatedShare.NotEligible.selector, mallory));
        gram.sendAsAgent(alice, IERC20(address(gated)), "mallory", 1e18, MEMO);
    }
}
