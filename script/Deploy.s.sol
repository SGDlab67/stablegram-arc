// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

import {MockShare} from "../src/MockShare.sol";
import {Stablegram} from "../src/Stablegram.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";

/// Deploys the whole set. Nothing here is chain specific, so the same
/// script runs on Arc testnet and on Monad with only --rpc-url changed.
///
/// Do not use `msg.sender` here. In a forge script it is the simulation
/// sender, not the wallet that signs the broadcast, so anything minted to
/// it lands at an address nobody holds a key for. The demo accounts below
/// are named outright for that reason.
contract Deploy is Script {
    /// Throwaway testnet accounts the phone app sends as. Their keys live in
    /// web/demo-keys.js, which is gitignored.
    address constant ALICE = 0x9eD68aFD9aF46Aea351B78D491068Ca23aEe5dB5;
    address constant BOB = 0xa76e8E1193b48e483224eb311ea4Fc14158eDEAF;

    function run() external {
        vm.startBroadcast();

        MockShare share = new MockShare("Mock Circle Share", "mCRCL");
        UsernameRegistry usernames = new UsernameRegistry();
        Stablegram gram = new Stablegram(usernames);

        share.mint(ALICE, 500e18);
        share.mint(BOB, 500e18);

        vm.stopBroadcast();

        console.log("chain id        ", block.chainid);
        console.log("MockShare       ", address(share));
        console.log("UsernameRegistry", address(usernames));
        console.log("Stablegram      ", address(gram));
    }
}
