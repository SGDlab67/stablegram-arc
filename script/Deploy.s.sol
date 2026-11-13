// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

import {MockShare} from "../src/MockShare.sol";
import {Stablegram} from "../src/Stablegram.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";

/// Deploys the whole set. Nothing here is chain specific, so the same
/// script runs on Arc testnet and on Monad with only --rpc-url changed.
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;

        MockShare share = new MockShare("Mock Circle Share", "mCRCL");
        UsernameRegistry usernames = new UsernameRegistry();
        Stablegram gram = new Stablegram(usernames);

        share.mint(deployer, 1_000e18);

        vm.stopBroadcast();

        console.log("chain id        ", block.chainid);
        console.log("deployer        ", deployer);
        console.log("MockShare       ", address(share));
        console.log("UsernameRegistry", address(usernames));
        console.log("Stablegram      ", address(gram));
    }
}
