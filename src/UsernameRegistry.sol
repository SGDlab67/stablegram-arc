// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice One username per address, claimed once, first come first served.
/// Names are stored as given and resolved case-insensitively, so "Alice"
/// and "alice" are the same name and only one of them can exist.
contract UsernameRegistry {
    /// @dev keccak of the lowercased name => owner
    mapping(bytes32 => address) private _ownerOf;
    mapping(address => string) public nameOf;

    event Claimed(string name, address indexed owner);

    error NameTaken();
    error AlreadyClaimed();
    error BadName();
    error NoSuchName();

    /// Claim `name` for the caller. 3 to 20 characters, a-z, 0-9 and _ only.
    function claim(string calldata name) external {
        if (bytes(nameOf[msg.sender]).length != 0) revert AlreadyClaimed();
        bytes32 key = _key(name);
        if (_ownerOf[key] != address(0)) revert NameTaken();
        _ownerOf[key] = msg.sender;
        nameOf[msg.sender] = name;
        emit Claimed(name, msg.sender);
    }

    /// Address behind `name`, or address(0) if it is unclaimed.
    function resolve(string calldata name) public view returns (address) {
        return _ownerOf[_key(name)];
    }

    /// Same as resolve but reverts rather than returning the zero address,
    /// so a send to a typo cannot burn the tokens.
    function mustResolve(string calldata name) external view returns (address owner) {
        owner = resolve(name);
        if (owner == address(0)) revert NoSuchName();
    }

    /// Lowercase and validate in one pass.
    function _key(string calldata name) private pure returns (bytes32) {
        bytes memory b = bytes(name);
        if (b.length < 3 || b.length > 20) revert BadName();
        for (uint256 i; i < b.length; ++i) {
            uint8 c = uint8(b[i]);
            if (c >= 65 && c <= 90) {
                b[i] = bytes1(c + 32); // A-Z to a-z
            } else if (!((c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c == 95)) {
                revert BadName(); // not a-z, 0-9 or _
            }
        }
        return keccak256(b);
    }
}
