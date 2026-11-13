// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Wrapper} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

import {EligibilityRegistry} from "./EligibilityRegistry.sol";
import {UsernameRegistry} from "./UsernameRegistry.sol";

/// @notice A tokenized share that can actually be voted, and can be sent to
/// a person rather than to an address.
///
/// Two things the underlying token does not do:
///   1. It records balances at every past moment, so a meeting can fix a
///      record time and still know who held what.
///   2. It refuses to move to an address the compliance role has not
///      cleared. Sending stock to a friend is the front door of the app,
///      and the eligibility check is what separates it from a payment app.
contract VoteShare is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper {
    EligibilityRegistry public immutable registry;
    UsernameRegistry public immutable usernames;

    event SentToUsername(address indexed from, address indexed to, string name, uint256 value);

    error NotEligible(address account);

    constructor(
        IERC20 underlying_,
        string memory name_,
        string memory symbol_,
        EligibilityRegistry registry_,
        UsernameRegistry usernames_
    ) ERC20(name_, symbol_) ERC20Permit(name_) ERC20Wrapper(underlying_) {
        registry = registry_;
        usernames = usernames_;
    }

    /// Send shares to a username. Reverts on an unclaimed name, so a typo
    /// cannot send the shares nowhere.
    function sendToUsername(string calldata name, uint256 value) external returns (address to) {
        to = usernames.mustResolve(name);
        _transfer(msg.sender, to, value);
        emit SentToUsername(msg.sender, to, name, value);
    }

    // Count time in seconds, not blocks. Monad and Arc produce blocks at
    // very different speeds, and a record date is a moment in the world.
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    function decimals() public view override(ERC20, ERC20Wrapper) returns (uint8) {
        return super.decimals();
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        // address(0) is a burn, which is how a holder unwraps. Always allowed.
        if (to != address(0) && !registry.eligible(to)) revert NotEligible(to);

        super._update(from, to, value);

        // Voting power only exists once it is delegated. A holder who never
        // calls delegate() would otherwise hold shares worth zero votes, so
        // the first time shares arrive we delegate them to their owner.
        if (to != address(0) && delegates(to) == address(0)) {
            _delegate(to, to);
        }
    }
}
