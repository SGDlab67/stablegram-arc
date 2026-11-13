// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {EligibilityRegistry} from "./EligibilityRegistry.sol";
import {VoteShare} from "./VoteShare.sol";

/// @notice A shareholder meeting with several items on the ballot.
///
/// This is not a Governor. A Governor proposal is one decision, and an
/// annual meeting is a dozen on one agenda with one record date, so the
/// shapes do not match. The deliberate trade is that the counting here is
/// ours and has to be tested rather than inherited.
///
/// An agent can vote on a holder's behalf and the holder can take the vote
/// back at any point before the deadline. The agent's reasoning is hashed
/// into the event log so the holder can check later what it claimed to be
/// doing.
contract Ballot {
    uint8 public constant FOR = 1;
    uint8 public constant AGAINST = 2;
    uint8 public constant ABSTAIN = 3;

    struct Meeting {
        string title;
        uint48 recordTime;
        uint48 deadline;
        bytes32 docHash;
        uint8 itemCount;
    }

    struct Receipt {
        uint8 choice; // 0 means this holder has not voted on this item
        bool bySelf; // true once the holder overrode the agent
        uint256 weight;
    }

    VoteShare public immutable share;
    EligibilityRegistry public immutable registry;
    address public custodian;

    Meeting[] private _meetings;

    /// meeting => item => choice index (0 for, 1 against, 2 abstain) => weight
    mapping(uint256 => mapping(uint256 => uint256[3])) private _tally;
    /// meeting => item => holder => receipt
    mapping(uint256 => mapping(uint256 => mapping(address => Receipt))) public receipts;
    /// holder => the one address allowed to vote on their behalf
    mapping(address => address) public agentOf;

    event MeetingOpened(
        uint256 indexed meetingId, string title, uint48 recordTime, uint48 deadline, bytes32 docHash, uint8 itemCount
    );
    event AgentSet(address indexed holder, address indexed agent);
    event VoteCast(
        uint256 indexed meetingId,
        uint256 indexed item,
        address indexed holder,
        uint8 choice,
        uint256 weight,
        bool bySelf,
        bytes32 reasonHash
    );

    error NotCustodian();
    error NotAgent();
    error Overridden();
    error Closed();
    error BadRecordTime();
    error BadDeadline();
    error NoSuchItem();
    error BadChoice();
    error NoWeight();
    error NotEligibleToVote(address holder);

    constructor(VoteShare share_, address custodian_) {
        share = share_;
        registry = share_.registry();
        custodian = custodian_;
    }

    // --- custodian ---

    /// Publish a meeting. `recordTime` must already be in the past so the
    /// holder set is fixed and cannot be gamed by buying shares after the
    /// agenda is known.
    function openMeeting(
        string calldata title,
        uint48 recordTime,
        uint48 deadline,
        bytes32 docHash,
        uint8 itemCount
    ) external returns (uint256 meetingId) {
        if (msg.sender != custodian) revert NotCustodian();
        if (recordTime >= block.timestamp) revert BadRecordTime();
        if (deadline <= block.timestamp) revert BadDeadline();
        if (itemCount == 0) revert NoSuchItem();

        _meetings.push(
            Meeting({
                title: title,
                recordTime: recordTime,
                deadline: deadline,
                docHash: docHash,
                itemCount: itemCount
            })
        );
        meetingId = _meetings.length - 1;
        emit MeetingOpened(meetingId, title, recordTime, deadline, docHash, itemCount);
    }

    // --- holder ---

    /// Authorise one agent to vote for you. Pass address(0) to revoke.
    /// The agent can only vote. It can never move, unwrap or spend shares,
    /// because this contract has no power to do any of those things.
    function setAgent(address agent) external {
        agentOf[msg.sender] = agent;
        emit AgentSet(msg.sender, agent);
    }

    /// Vote your own shares. Overrides whatever the agent did, and can be
    /// changed again until the deadline.
    function vote(uint256 meetingId, uint256 item, uint8 choice) external {
        _cast(msg.sender, meetingId, item, choice, true, bytes32(0));
    }

    function voteMany(uint256 meetingId, uint256[] calldata items, uint8[] calldata choices) external {
        if (items.length != choices.length) revert BadChoice();
        for (uint256 i; i < items.length; ++i) {
            _cast(msg.sender, meetingId, items[i], choices[i], true, bytes32(0));
        }
    }

    // --- agent ---

    /// Vote on behalf of `holder`. Fails once the holder has voted that
    /// item themselves, so an agent can never undo a person's decision.
    function voteFor(address holder, uint256 meetingId, uint256 item, uint8 choice, bytes32 reasonHash) external {
        if (agentOf[holder] != msg.sender || msg.sender == address(0)) revert NotAgent();
        _cast(holder, meetingId, item, choice, false, reasonHash);
    }

    // --- views ---

    function meetingCount() external view returns (uint256) {
        return _meetings.length;
    }

    function meetings(uint256 meetingId) external view returns (Meeting memory) {
        return _meetings[meetingId];
    }

    function isOpen(uint256 meetingId) public view returns (bool) {
        return block.timestamp <= _meetings[meetingId].deadline;
    }

    /// The instruction a custodian holding the real shares would act on.
    function results(uint256 meetingId, uint256 item)
        external
        view
        returns (uint256 forWeight, uint256 againstWeight, uint256 abstainWeight)
    {
        uint256[3] storage t = _tally[meetingId][item];
        return (t[0], t[1], t[2]);
    }

    /// What a holder's shares were worth at the record time of a meeting.
    function weightOf(uint256 meetingId, address holder) public view returns (uint256) {
        return share.getPastVotes(holder, _meetings[meetingId].recordTime);
    }

    // --- internals ---

    function _cast(address holder, uint256 meetingId, uint256 item, uint8 choice, bool bySelf, bytes32 reasonHash)
        private
    {
        Meeting storage m = _meetings[meetingId];
        if (block.timestamp > m.deadline) revert Closed();
        if (item >= m.itemCount) revert NoSuchItem();
        if (choice < FOR || choice > ABSTAIN) revert BadChoice();
        if (!registry.eligible(holder)) revert NotEligibleToVote(holder);

        Receipt storage r = receipts[meetingId][item][holder];
        // An agent may fill an empty slot or change its own earlier vote,
        // never a vote the holder cast.
        if (!bySelf && r.bySelf) revert Overridden();

        uint256 weight = share.getPastVotes(holder, m.recordTime);
        if (weight == 0) revert NoWeight();

        if (r.choice != 0) {
            _tally[meetingId][item][r.choice - 1] -= r.weight;
        }
        _tally[meetingId][item][choice - 1] += weight;

        r.choice = choice;
        r.weight = weight;
        r.bySelf = bySelf;

        emit VoteCast(meetingId, item, holder, choice, weight, bySelf, reasonHash);
    }
}
