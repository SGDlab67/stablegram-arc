// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {UsernameRegistry} from "./UsernameRegistry.sol";

/// @notice Send anything to a person, with a note, and let an agent do it
/// for you inside limits you set.
///
/// Three jobs:
///   1. Resolve a username and move tokens or the chain's own currency.
///   2. Carry a short note, so the transfer says what it was for. The notes
///      live in the event log, which is the feed.
///   3. Let one agent send on a user's behalf, capped per send and per day,
///      per token, and revocable at any moment.
///
/// This contract holds no balance and has no owner. It moves value in the
/// same transaction it receives the instruction, so there is nothing here
/// to drain. Any rule the token itself enforces, such as a pause or a
/// transfer restriction, still applies because this calls the token's
/// ordinary transfer path.
///
/// On Arc the chain's currency is USDC, so sendNative is how you send
/// dollars. An agent cannot send the native balance, because nothing can
/// pull it from a user's account; on Arc an agent sends USDC through its
/// ERC-20 interface instead.
contract Stablegram {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_MEMO_BYTES = 140;

    struct Limit {
        uint128 perSend;
        uint128 perDay;
    }

    struct Spend {
        uint48 day;
        uint208 amount;
    }

    UsernameRegistry public immutable usernames;

    /// user => the one address allowed to send on their behalf
    mapping(address => address) public agentOf;
    /// user => token => how much that agent may move
    mapping(address => mapping(address => Limit)) public limitOf;
    /// user => token => what it has moved today
    mapping(address => mapping(address => Spend)) public spentOf;

    /// One shape for every send, so a single indexer builds the whole feed.
    /// `token` is address(0) for the chain's native currency.
    event Sent(
        address indexed token,
        address indexed from,
        address indexed to,
        string name,
        uint256 value,
        string memo,
        bool byAgent
    );
    event AgentAuthorized(address indexed user, address indexed agent);
    event LimitSet(address indexed user, address indexed token, uint128 perSend, uint128 perDay);

    error NothingToSend();
    error NativeSendFailed();
    error MemoTooLong();
    error NotAgent();
    error OverPerSendLimit(uint256 value, uint256 limit);
    error OverDailyLimit(uint256 wouldBe, uint256 limit);

    constructor(UsernameRegistry usernames_) {
        usernames = usernames_;
    }

    // --- sending as yourself ---

    /// Send an ERC-20 to a username. Approve this contract first.
    function sendToken(IERC20 token, string calldata name, uint256 value, string calldata memo)
        external
        returns (address to)
    {
        to = _resolve(name, value, memo);
        token.safeTransferFrom(msg.sender, to, value);
        emit Sent(address(token), msg.sender, to, name, value, memo, false);
    }

    /// Send the chain's own currency to a username. On Arc that is USDC.
    function sendNative(string calldata name, string calldata memo) external payable returns (address to) {
        to = _resolve(name, msg.value, memo);
        (bool ok,) = payable(to).call{value: msg.value}("");
        if (!ok) revert NativeSendFailed();
        emit Sent(address(0), msg.sender, to, name, msg.value, memo, false);
    }

    // --- letting an agent send for you ---

    /// Name the one address allowed to send for you. address(0) revokes it,
    /// and revoking takes effect immediately for every token.
    function authorizeAgent(address agent) external {
        agentOf[msg.sender] = agent;
        emit AgentAuthorized(msg.sender, agent);
    }

    /// Cap what the agent may move of one token. Both caps default to zero,
    /// so a fresh agent can send nothing until this is called.
    function setLimit(address token, uint128 perSend, uint128 perDay) external {
        limitOf[msg.sender][token] = Limit({perSend: perSend, perDay: perDay});
        emit LimitSet(msg.sender, token, perSend, perDay);
    }

    /// Send on behalf of `user`. The agent chooses the recipient and the
    /// amount, never the limits, and can only reach claimed usernames.
    function sendAsAgent(address user, IERC20 token, string calldata name, uint256 value, string calldata memo)
        external
        returns (address to)
    {
        if (msg.sender == address(0) || agentOf[user] != msg.sender) revert NotAgent();

        Limit memory lim = limitOf[user][address(token)];
        if (value > lim.perSend) revert OverPerSendLimit(value, lim.perSend);

        uint48 today = uint48(block.timestamp / 1 days);
        Spend memory spent = spentOf[user][address(token)];
        uint256 todaySoFar = spent.day == today ? spent.amount : 0;
        uint256 wouldBe = todaySoFar + value;
        if (wouldBe > lim.perDay) revert OverDailyLimit(wouldBe, lim.perDay);
        spentOf[user][address(token)] = Spend({day: today, amount: uint208(wouldBe)});

        to = _resolve(name, value, memo);
        token.safeTransferFrom(user, to, value);
        emit Sent(address(token), user, to, name, value, memo, true);
    }

    // --- views ---

    /// What the agent may still move for `user` of `token` today.
    function remainingToday(address user, address token) external view returns (uint256) {
        Limit memory lim = limitOf[user][token];
        Spend memory spent = spentOf[user][token];
        uint256 used = spent.day == uint48(block.timestamp / 1 days) ? spent.amount : 0;
        return used >= lim.perDay ? 0 : lim.perDay - used;
    }

    // --- internals ---

    function _resolve(string calldata name, uint256 value, string calldata memo) private view returns (address to) {
        if (value == 0) revert NothingToSend();
        if (bytes(memo).length > MAX_MEMO_BYTES) revert MemoTooLong();
        to = usernames.mustResolve(name);
    }
}
