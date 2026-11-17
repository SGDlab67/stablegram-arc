// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {MockShare} from "../src/MockShare.sol";
import {Stableplan} from "../src/Stableplan.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";

contract FlowTest is Test {
    MockShare share;
    MockShare other; // a second token, to prove the agent's limits are per token
    UsernameRegistry usernames;
    Stableplan gram;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory");
    address agent = makeAddr("agent");

    string constant MEMO = unicode"pizza last night 🍕";

    function setUp() public {
        share = new MockShare("Mock Circle Share", "mCRCL");
        other = new MockShare("Other Share", "oCRCL");
        usernames = new UsernameRegistry();
        gram = new Stableplan(usernames);

        share.mint(alice, 100e18);
        other.mint(alice, 100e18);

        vm.prank(alice);
        usernames.claim("alice");
        vm.prank(bob);
        usernames.claim("Bob"); // claimed with a capital, resolves either way
        vm.prank(mallory);
        usernames.claim("mallory");
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

    // --- sending by name ---

    function test_sendsAnyToken() public {
        vm.startPrank(alice);
        share.approve(address(gram), 30e18);
        address to = gram.sendToken(IERC20(address(share)), "bob", 30e18, MEMO);
        vm.stopPrank();

        assertEq(to, bob);
        assertEq(share.balanceOf(bob), 30e18);
        assertEq(share.balanceOf(alice), 70e18);
    }

    function test_sendFractionOfAShare() public {
        vm.startPrank(alice);
        share.approve(address(gram), 1e18);
        gram.sendToken(IERC20(address(share)), "bob", 0.25e18, "quarter share, happy birthday");
        vm.stopPrank();

        // the thing ACATS cannot do at all
        assertEq(share.balanceOf(bob), 0.25e18);
    }

    function test_sendEmitsTheMemo() public {
        vm.startPrank(alice);
        share.approve(address(gram), 1e18);
        vm.expectEmit(true, true, true, true, address(gram));
        emit Stableplan.Sent(address(share), alice, bob, "bob", 1e18, MEMO, false);
        gram.sendToken(IERC20(address(share)), "bob", 1e18, MEMO);
        vm.stopPrank();
    }

    function test_memoHasALimit() public {
        string memory tooLong = new string(141);
        vm.startPrank(alice);
        share.approve(address(gram), 1e18);
        vm.expectRevert(Stableplan.MemoTooLong.selector);
        gram.sendToken(IERC20(address(share)), "bob", 1e18, tooLong);
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
        vm.expectRevert(Stableplan.NothingToSend.selector);
        gram.sendToken(IERC20(address(share)), "bob", 0, MEMO);
        vm.expectRevert(Stableplan.NothingToSend.selector);
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

    /// Stableplan must never be able to hold anything.
    function testFuzz_stablegramKeepsNoBalance(uint96 tokenAmount, uint96 nativeAmount) public {
        tokenAmount = uint96(bound(tokenAmount, 1, 50e18));
        nativeAmount = uint96(bound(nativeAmount, 1, 100 ether));
        vm.deal(alice, nativeAmount);

        vm.startPrank(alice);
        share.approve(address(gram), uint256(tokenAmount) * 2); // once for sendToken, once for approve
        gram.sendToken(IERC20(address(share)), "bob", tokenAmount, MEMO);
        gram.sendNative{value: nativeAmount}("bob", MEMO);
        gram.authorizeAgent(agent);
        vm.stopPrank();

        vm.prank(agent);
        uint256 id = gram.propose(alice, IERC20(address(share)), "bob", tokenAmount, MEMO);
        vm.prank(alice);
        gram.approve(id);

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
        vm.expectRevert(abi.encodeWithSelector(Stableplan.OverPerSendLimit.selector, 11e18, 10e18));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 11e18, MEMO);
    }

    function test_agentCannotExceedDailyLimit() public {
        _authorizeAgent(10e18, 25e18);

        vm.startPrank(agent);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 10e18, MEMO);
        vm.expectRevert(abi.encodeWithSelector(Stableplan.OverDailyLimit.selector, 30e18, 25e18));
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
        vm.expectRevert(abi.encodeWithSelector(Stableplan.OverPerSendLimit.selector, 1, 0));
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1, MEMO);
    }

    function test_revokingTheAgentIsImmediate() public {
        _authorizeAgent(10e18, 100e18);

        vm.prank(alice);
        gram.authorizeAgent(address(0));

        vm.prank(agent);
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1e18, MEMO);
    }

    function test_strangerCannotSendForYou() public {
        _authorizeAgent(10e18, 100e18);

        vm.prank(mallory);
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.sendAsAgent(alice, IERC20(address(share)), "bob", 1e18, MEMO);
    }

    /// Nobody has authorized an agent, so address(0) must not be one either.
    function test_unsetAgentIsNotAnAgent() public {
        vm.prank(address(0));
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.sendAsAgent(bob, IERC20(address(share)), "alice", 1e18, MEMO);
    }

    function test_agentLimitsArePerToken() public {
        _authorizeAgent(10e18, 10e18); // limit is on `share` only

        vm.prank(alice);
        other.approve(address(gram), 20e18);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Stableplan.OverPerSendLimit.selector, 1e18, 0));
        gram.sendAsAgent(alice, IERC20(address(other)), "bob", 1e18, MEMO);
    }

    // --- standing orders ---

    uint48 constant WEEK = 7 days;

    function _weeklyOrder() private returns (uint256 id) {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        id = gram.createOrder(IERC20(address(share)), "bob", 1e18, uint48(block.timestamp + WEEK), WEEK, MEMO);
        vm.stopPrank();
    }

    function test_anyoneRunsADueOrderAndItPaysWhatTheUserWrote() public {
        uint256 id = _weeklyOrder();

        vm.prank(mallory);
        vm.expectRevert(abi.encodeWithSelector(Stableplan.NotDue.selector, block.timestamp + WEEK));
        gram.runOrder(id);

        skip(WEEK);
        vm.expectEmit();
        emit Stableplan.Sent(address(share), alice, bob, "bob", 1e18, MEMO, true);
        vm.prank(mallory); // a stranger, who gains nothing and chooses nothing
        gram.runOrder(id);

        assertEq(share.balanceOf(bob), 1e18);
        assertEq(share.balanceOf(mallory), 0);
        assertEq(share.balanceOf(address(gram)), 0);
    }

    function test_orderPaysOncePerPeriod() public {
        uint256 id = _weeklyOrder();
        skip(WEEK);
        gram.runOrder(id);

        vm.expectRevert(abi.encodeWithSelector(Stableplan.NotDue.selector, block.timestamp + WEEK));
        gram.runOrder(id);
    }

    function test_missedPeriodsAreSkippedNotPaidLater() public {
        uint256 id = _weeklyOrder();
        uint256 firstAt = block.timestamp + WEEK;

        skip(WEEK * 5 + 1 days); // due at week 1, nobody ran it until week 5 and a day
        gram.runOrder(id);
        assertEq(share.balanceOf(bob), 1e18);

        // The next slot is week 6, still on the original weekday.
        vm.expectRevert(abi.encodeWithSelector(Stableplan.NotDue.selector, firstAt + WEEK * 5));
        gram.runOrder(id);
    }

    function test_onlyTheWriterCancelsAndACancelledOrderIsDead() public {
        uint256 id = _weeklyOrder();

        vm.prank(mallory);
        vm.expectRevert(Stableplan.NotYourOrder.selector);
        gram.cancelOrder(id);

        vm.prank(alice);
        gram.cancelOrder(id);

        skip(WEEK);
        vm.expectRevert(Stableplan.NoSuchOrder.selector);
        gram.runOrder(id);
    }

    function test_orderNeedsARealRecipientAndInterval() public {
        vm.startPrank(alice);
        vm.expectRevert(UsernameRegistry.NoSuchName.selector);
        gram.createOrder(IERC20(address(share)), "nobody", 1e18, 0, WEEK, MEMO);
        vm.expectRevert(Stableplan.BadInterval.selector);
        gram.createOrder(IERC20(address(share)), "bob", 1e18, 0, 0, MEMO);
        vm.expectRevert(Stableplan.BadInterval.selector);
        gram.createOrder(IERC20(address(share)), "bob", 1e18, 0, type(uint48).max, MEMO);
        vm.expectRevert(Stableplan.NothingToSend.selector);
        gram.createOrder(IERC20(address(share)), "bob", 0, 0, WEEK, MEMO);
        vm.stopPrank();
    }

    function test_revokingTheAllowanceStopsAnOrder() public {
        uint256 id = _weeklyOrder();
        vm.prank(alice);
        share.approve(address(gram), 0);

        skip(WEEK);
        vm.expectRevert();
        gram.runOrder(id);
        assertEq(share.balanceOf(bob), 0);
    }

    // --- proposals ---

    function _propose(uint256 value) private returns (uint256 id) {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        gram.authorizeAgent(agent);
        vm.stopPrank();

        vm.prank(agent);
        id = gram.propose(alice, IERC20(address(share)), "bob", value, MEMO);
    }

    function test_userApprovesAnAgentProposal() public {
        vm.startPrank(alice);
        share.approve(address(gram), type(uint256).max);
        gram.authorizeAgent(agent);
        vm.stopPrank();

        vm.expectEmit(true, true, true, true, address(gram));
        emit Stableplan.Proposed(0, alice, bob, address(share), 5e18, MEMO);
        vm.prank(agent);
        uint256 id = gram.propose(alice, IERC20(address(share)), "bob", 5e18, MEMO);
        assertEq(id, 0);
        assertEq(gram.proposalCount(), 1);
        assertEq(share.balanceOf(bob), 0); // nothing moves until approval

        vm.expectEmit(true, true, true, true, address(gram));
        emit Stableplan.Approved(0);
        vm.expectEmit(true, true, true, true, address(gram));
        emit Stableplan.Sent(address(share), alice, bob, "bob", 5e18, MEMO, true);
        vm.prank(alice);
        gram.approve(id);

        assertEq(share.balanceOf(bob), 5e18);
        assertEq(share.balanceOf(alice), 95e18);
        assertEq(share.balanceOf(address(gram)), 0);
    }

    function test_userRejectsAProposal() public {
        uint256 id = _propose(5e18);

        vm.expectEmit(true, true, true, true, address(gram));
        emit Stableplan.Rejected(id);
        vm.prank(alice);
        gram.reject(id);

        assertEq(share.balanceOf(bob), 0);
    }

    function test_onlyTheAgentCanPropose() public {
        _propose(1e18);

        vm.prank(mallory);
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.propose(alice, IERC20(address(share)), "bob", 1e18, MEMO);

        vm.prank(address(0));
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.propose(bob, IERC20(address(share)), "alice", 1e18, MEMO);
    }

    function test_strangerCannotApproveOrRejectAProposal() public {
        uint256 id = _propose(1e18);

        vm.startPrank(mallory);
        vm.expectRevert(Stableplan.NotYourProposal.selector);
        gram.approve(id);
        vm.expectRevert(Stableplan.NotYourProposal.selector);
        gram.reject(id);
        vm.stopPrank();

        // the agent proposes, it does not decide
        vm.startPrank(agent);
        vm.expectRevert(Stableplan.NotYourProposal.selector);
        gram.approve(id);
        vm.stopPrank();
    }

    function test_aProposalIsDecidedOnce() public {
        uint256 first = _propose(1e18);
        vm.prank(agent);
        uint256 second = gram.propose(alice, IERC20(address(share)), "bob", 1e18, MEMO);

        vm.startPrank(alice);
        gram.approve(first);
        vm.expectRevert(Stableplan.NoSuchProposal.selector);
        gram.approve(first);
        vm.expectRevert(Stableplan.NoSuchProposal.selector);
        gram.reject(first);

        gram.reject(second);
        vm.expectRevert(Stableplan.NoSuchProposal.selector);
        gram.approve(second);
        vm.expectRevert(Stableplan.NoSuchProposal.selector);
        gram.approve(99); // never existed
        vm.stopPrank();

        assertEq(share.balanceOf(bob), 1e18);
    }

    function test_proposalChecksNameValueAndMemo() public {
        _propose(1e18);
        vm.startPrank(agent);
        vm.expectRevert(UsernameRegistry.NoSuchName.selector);
        gram.propose(alice, IERC20(address(share)), "nobody", 1e18, MEMO);
        vm.expectRevert(Stableplan.NothingToSend.selector);
        gram.propose(alice, IERC20(address(share)), "bob", 0, MEMO);
        vm.expectRevert(Stableplan.MemoTooLong.selector);
        gram.propose(alice, IERC20(address(share)), "bob", 1e18, new string(141));
        vm.stopPrank();
    }

    function test_proposalIgnoresTheAgentLimits() public {
        _authorizeAgent(1e18, 1e18);

        // over the per-send cap, which sendAsAgent would refuse
        vm.prank(agent);
        uint256 id = gram.propose(alice, IERC20(address(share)), "bob", 50e18, MEMO);
        vm.prank(alice);
        gram.approve(id);

        assertEq(share.balanceOf(bob), 50e18);
        assertEq(gram.remainingToday(alice, address(share)), 1e18); // cap untouched
    }

    /// Deliberate: revoking the agent does not cancel its proposals. The
    /// owner still has to approve each one, so a stale proposal moves nothing
    /// on its own.
    function test_revokingTheAgentKeepsExistingProposals() public {
        uint256 id = _propose(2e18);

        vm.startPrank(alice);
        gram.authorizeAgent(address(0));
        gram.approve(id);
        vm.stopPrank();

        assertEq(share.balanceOf(bob), 2e18);

        vm.prank(agent);
        vm.expectRevert(Stableplan.NotAgent.selector);
        gram.propose(alice, IERC20(address(share)), "bob", 1e18, MEMO);
    }
}
