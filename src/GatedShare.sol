// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Wrapper} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";

import {EligibilityRegistry} from "./EligibilityRegistry.sol";
import {UsernameRegistry} from "./UsernameRegistry.sol";

/// @notice A tokenized share you can send to a person instead of to an
/// address, and that refuses to move to anyone the compliance role has not
/// cleared.
///
/// The gate is the point. A payment app moves value to whoever you name; a
/// share has to check first, because the issuer's terms say who is allowed
/// to hold it. Doing that check inside the transfer is what separates this
/// from Venmo, and it is why the thing being sent can be a real security.
contract GatedShare is ERC20, ERC20Wrapper {
    EligibilityRegistry public immutable registry;
    UsernameRegistry public immutable usernames;

    uint256 public constant MAX_MEMO_BYTES = 140;

    /// Same shape as Stablegram.Sent, deliberately, so one indexer builds
    /// the whole feed from both contracts.
    event Sent(
        address indexed token,
        address indexed from,
        address indexed to,
        string name,
        uint256 value,
        string memo,
        bool byAgent
    );

    error NotEligible(address account);
    error MemoTooLong();

    constructor(
        IERC20 underlying_,
        string memory name_,
        string memory symbol_,
        EligibilityRegistry registry_,
        UsernameRegistry usernames_
    ) ERC20(name_, symbol_) ERC20Wrapper(underlying_) {
        registry = registry_;
        usernames = usernames_;
    }

    /// Send shares to a username with a note saying what it was for.
    /// Reverts on an unclaimed name, so a typo cannot send shares nowhere.
    function sendToUsername(string calldata name, uint256 value, string calldata memo) external returns (address to) {
        if (bytes(memo).length > MAX_MEMO_BYTES) revert MemoTooLong();
        to = usernames.mustResolve(name);
        _transfer(msg.sender, to, value);
        emit Sent(address(this), msg.sender, to, name, value, memo, false);
    }

    function decimals() public view override(ERC20, ERC20Wrapper) returns (uint8) {
        return super.decimals();
    }

    function _update(address from, address to, uint256 value) internal override {
        // address(0) is a burn, which is how a holder unwraps. Always allowed,
        // so the gate can never trap someone's shares.
        if (to != address(0) && !registry.eligible(to)) revert NotEligible(to);
        super._update(from, to, value);
    }
}
