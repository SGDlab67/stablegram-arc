// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Stand-in for a tokenized stock such as an xStock or CRCLx.
/// The real thing carries no vote and no cash dividend, which is the
/// problem this project exists to fix. On testnet we mint our own.
contract MockShare is ERC20 {
    address public immutable issuer;

    error NotIssuer();

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        issuer = msg.sender;
    }

    function mint(address to, uint256 value) external {
        if (msg.sender != issuer) revert NotIssuer();
        _mint(to, value);
    }
}
