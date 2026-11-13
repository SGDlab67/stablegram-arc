// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Who is allowed to hold and vote a wrapped share.
/// The rule itself is deliberately not encoded here. A compliance role sets
/// the list, so an issuer can enforce whatever its terms require without a
/// new deployment. In production this role would be a KYC or attestation
/// provider rather than one wallet.
contract EligibilityRegistry {
    address public compliance;
    mapping(address => bool) public eligible;

    event EligibilitySet(address indexed account, bool allowed);
    event ComplianceTransferred(address indexed from, address indexed to);

    error NotCompliance();
    error ZeroAddress();

    constructor(address compliance_) {
        if (compliance_ == address(0)) revert ZeroAddress();
        compliance = compliance_;
    }

    modifier onlyCompliance() {
        if (msg.sender != compliance) revert NotCompliance();
        _;
    }

    function set(address account, bool allowed) public onlyCompliance {
        eligible[account] = allowed;
        emit EligibilitySet(account, allowed);
    }

    function setMany(address[] calldata accounts, bool allowed) external onlyCompliance {
        for (uint256 i; i < accounts.length; ++i) {
            set(accounts[i], allowed);
        }
    }

    function transferCompliance(address to) external onlyCompliance {
        if (to == address(0)) revert ZeroAddress();
        emit ComplianceTransferred(compliance, to);
        compliance = to;
    }
}
