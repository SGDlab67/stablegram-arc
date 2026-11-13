// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";

import {Ballot} from "../src/Ballot.sol";
import {EligibilityRegistry} from "../src/EligibilityRegistry.sol";
import {MockShare} from "../src/MockShare.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";
import {VoteShare} from "../src/VoteShare.sol";

contract FlowTest is Test {
    // Local copies. Reading FOR inside an argument list would be an
    // external call, and that call eats the vm.prank meant for the vote.
    uint8 constant FOR = 1;
    uint8 constant AGAINST = 2;
    uint8 constant ABSTAIN = 3;

    MockShare share;
    EligibilityRegistry registry;
    UsernameRegistry usernames;
    VoteShare vote;
    Ballot ballot;

    address issuer = address(this);
    address compliance = makeAddr("compliance");
    address custodian = makeAddr("custodian");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory"); // never cleared by compliance
    address agent = makeAddr("agent");

    function setUp() public {
        vm.warp(1_000_000); // getPastVotes needs a past timepoint to exist

        share = new MockShare("Mock Circle Share", "mCRCL");
        registry = new EligibilityRegistry(compliance);
        usernames = new UsernameRegistry();
        vote = new VoteShare(share, "Votable Circle Share", "vCRCL", registry, usernames);
        ballot = new Ballot(vote, custodian);

        vm.startPrank(compliance);
        registry.set(alice, true);
        registry.set(bob, true);
        vm.stopPrank();

        share.mint(alice, 100e18);

        vm.prank(alice);
        usernames.claim("alice");
        vm.prank(bob);
        usernames.claim("Bob"); // claimed with a capital, resolves either way
    }

    function _wrap(address who, uint256 amount) private {
        vm.startPrank(who);
        share.approve(address(vote), amount);
        vote.depositFor(who, amount);
        vm.stopPrank();
    }

    function test_localChoiceConstantsMatchTheContract() public view {
        assertEq(ballot.FOR(), FOR);
        assertEq(ballot.AGAINST(), AGAINST);
        assertEq(ballot.ABSTAIN(), ABSTAIN);
    }

    // --- usernames ---

    function test_usernameResolvesCaseInsensitively() public view {
        assertEq(usernames.resolve("bob"), bob);
        assertEq(usernames.resolve("BOB"), bob);
        assertEq(usernames.resolve("Bob"), bob);
    }

    function test_usernameCannotBeTakenTwice() public {
        vm.prank(mallory);
        vm.expectRevert(UsernameRegistry.NameTaken.selector);
        usernames.claim("ALICE");
    }

    function test_oneNamePerAddress() public {
        vm.prank(alice);
        vm.expectRevert(UsernameRegistry.AlreadyClaimed.selector);
        usernames.claim("alice2");
    }

    function test_rejectsBadNames() public {
        vm.startPrank(mallory);
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("ab"); // too short
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("has space");
        vm.expectRevert(UsernameRegistry.BadName.selector);
        usernames.claim("emoji_face_\xF0\x9F\x99\x82");
        vm.stopPrank();
    }

    function test_sendToUnclaimedNameReverts() public {
        _wrap(alice, 10e18);
        vm.prank(alice);
        vm.expectRevert(UsernameRegistry.NoSuchName.selector);
        vote.sendToUsername("nobody", 1e18);
    }

    // --- wrapping and the gate ---

    function test_wrappingGivesVotingPowerWithoutDelegating() public {
        _wrap(alice, 40e18);
        assertEq(vote.balanceOf(alice), 40e18);
        // the whole point: alice never called delegate()
        assertEq(vote.delegates(alice), alice);
        assertEq(vote.getVotes(alice), 40e18);
    }

    function test_ineligibleCannotReceive() public {
        _wrap(alice, 10e18);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(VoteShare.NotEligible.selector, mallory));
        vote.transfer(mallory, 1e18);
    }

    function test_ineligibleCannotWrap() public {
        share.mint(mallory, 5e18);
        vm.startPrank(mallory);
        share.approve(address(vote), 5e18);
        vm.expectRevert(abi.encodeWithSelector(VoteShare.NotEligible.selector, mallory));
        vote.depositFor(mallory, 5e18);
        vm.stopPrank();
    }

    function test_anyoneCanUnwrap() public {
        _wrap(alice, 10e18);
        vm.prank(alice);
        vote.withdrawTo(alice, 10e18);
        assertEq(share.balanceOf(alice), 100e18);
        assertEq(vote.balanceOf(alice), 0);
    }

    function test_sendToUsernameMovesSharesAndVotes() public {
        _wrap(alice, 50e18);

        vm.prank(alice);
        address to = vote.sendToUsername("bob", 20e18);

        assertEq(to, bob);
        assertEq(vote.balanceOf(bob), 20e18);
        assertEq(vote.balanceOf(alice), 30e18);
        // bob can vote what he received without doing anything else
        assertEq(vote.getVotes(bob), 20e18);
        assertEq(vote.getVotes(alice), 30e18);
    }

    // --- voting ---

    function _openMeeting() private returns (uint256 id) {
        uint48 recordTime = uint48(block.timestamp);
        vm.warp(block.timestamp + 1 hours); // record time must be in the past
        vm.prank(custodian);
        id = ballot.openMeeting("2026 Annual Meeting", recordTime, uint48(block.timestamp + 7 days), keccak256("proxy.pdf"), 3);
    }

    function test_weightIsFixedAtTheRecordTime() public {
        _wrap(alice, 60e18);
        uint256 id = _openMeeting();

        // alice sends shares away after the record time
        vm.prank(alice);
        vote.sendToUsername("bob", 60e18);

        // her vote still counts what she held at the record time
        assertEq(ballot.weightOf(id, alice), 60e18);
        assertEq(ballot.weightOf(id, bob), 0);

        vm.prank(alice);
        ballot.vote(id, 0, FOR);
        (uint256 forW,,) = ballot.results(id, 0);
        assertEq(forW, 60e18);
    }

    function test_agentVotesAndHolderOverrides() public {
        _wrap(alice, 60e18);
        uint256 id = _openMeeting();

        vm.prank(alice);
        ballot.setAgent(agent);

        vm.prank(agent);
        ballot.voteFor(alice, id, 0, FOR, keccak256("pay rise is below my 10% limit"));

        (uint256 forW, uint256 againstW,) = ballot.results(id, 0);
        assertEq(forW, 60e18);
        assertEq(againstW, 0);

        // alice disagrees and takes the vote back
        vm.prank(alice);
        ballot.vote(id, 0, AGAINST);

        (forW, againstW,) = ballot.results(id, 0);
        assertEq(forW, 0, "agent weight must be removed, not double counted");
        assertEq(againstW, 60e18);

        // and the agent cannot undo her
        vm.prank(agent);
        vm.expectRevert(Ballot.Overridden.selector);
        ballot.voteFor(alice, id, 0, FOR, bytes32(0));
    }

    function test_holderCanChangeTheirOwnMindRepeatedly() public {
        _wrap(alice, 60e18);
        uint256 id = _openMeeting();

        vm.startPrank(alice);
        ballot.vote(id, 1, FOR);
        ballot.vote(id, 1, ABSTAIN);
        ballot.vote(id, 1, AGAINST);
        vm.stopPrank();

        (uint256 forW, uint256 againstW, uint256 abstainW) = ballot.results(id, 1);
        assertEq(forW, 0);
        assertEq(againstW, 60e18);
        assertEq(abstainW, 0);
    }

    function test_strangerCannotVoteForYou() public {
        _wrap(alice, 10e18);
        uint256 id = _openMeeting();

        vm.prank(mallory);
        vm.expectRevert(Ballot.NotAgent.selector);
        ballot.voteFor(alice, id, 0, FOR, bytes32(0));
    }

    function test_revokedAgentCannotVote() public {
        _wrap(alice, 10e18);
        uint256 id = _openMeeting();

        vm.startPrank(alice);
        ballot.setAgent(agent);
        ballot.setAgent(address(0));
        vm.stopPrank();

        vm.prank(agent);
        vm.expectRevert(Ballot.NotAgent.selector);
        ballot.voteFor(alice, id, 0, FOR, bytes32(0));
    }

    function test_noSharesNoVote() public {
        uint256 id = _openMeeting();
        vm.prank(bob);
        vm.expectRevert(Ballot.NoWeight.selector);
        ballot.vote(id, 0, FOR);
    }

    function test_revokedEligibilityBlocksVoting() public {
        _wrap(alice, 10e18);
        uint256 id = _openMeeting();

        vm.prank(compliance);
        registry.set(alice, false);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ballot.NotEligibleToVote.selector, alice));
        ballot.vote(id, 0, FOR);
    }

    function test_votingClosesAtTheDeadline() public {
        _wrap(alice, 10e18);
        uint256 id = _openMeeting();

        vm.warp(block.timestamp + 8 days);
        assertFalse(ballot.isOpen(id));

        vm.prank(alice);
        vm.expectRevert(Ballot.Closed.selector);
        ballot.vote(id, 0, FOR);
    }

    function test_onlyCustodianOpensMeetings() public {
        vm.warp(block.timestamp + 1 hours);
        vm.prank(mallory);
        vm.expectRevert(Ballot.NotCustodian.selector);
        ballot.openMeeting("fake", uint48(block.timestamp - 1), uint48(block.timestamp + 1 days), bytes32(0), 1);
    }

    function test_recordTimeMustBeInThePast() public {
        vm.prank(custodian);
        vm.expectRevert(Ballot.BadRecordTime.selector);
        ballot.openMeeting("now", uint48(block.timestamp), uint48(block.timestamp + 1 days), bytes32(0), 1);
    }

    function test_itemMustExist() public {
        _wrap(alice, 10e18);
        uint256 id = _openMeeting(); // 3 items, indexes 0..2
        vm.prank(alice);
        vm.expectRevert(Ballot.NoSuchItem.selector);
        ballot.vote(id, 3, FOR);
    }

    // --- the tally must never invent or lose weight ---

    function testFuzz_tallyAlwaysEqualsVotedWeight(uint8 c1, uint8 c2) public {
        c1 = uint8(bound(c1, 1, 3));
        c2 = uint8(bound(c2, 1, 3));

        _wrap(alice, 60e18);
        vm.prank(alice);
        vote.sendToUsername("bob", 25e18);
        uint256 id = _openMeeting();

        vm.prank(alice);
        ballot.vote(id, 0, c1);
        vm.prank(bob);
        ballot.vote(id, 0, c2);

        (uint256 forW, uint256 againstW, uint256 abstainW) = ballot.results(id, 0);
        assertEq(forW + againstW + abstainW, 60e18, "weight created or destroyed");
    }
}
