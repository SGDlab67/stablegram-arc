// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

import {EligibilityRegistry} from "../src/EligibilityRegistry.sol";
import {GatedShare} from "../src/GatedShare.sol";
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
        EligibilityRegistry registry = new EligibilityRegistry(deployer);
        UsernameRegistry usernames = new UsernameRegistry();
        GatedShare gated = new GatedShare(share, "Sendable Circle Share", "sCRCL", registry, usernames);
        Stablegram gram = new Stablegram(usernames);

        // The deployer is the compliance role for the demo. Clear it so it
        // can hold shares straight away.
        registry.set(deployer, true);
        share.mint(deployer, 1_000e18);

        vm.stopBroadcast();

        console.log("chain id           ", block.chainid);
        console.log("deployer           ", deployer);
        console.log("MockShare          ", address(share));
        console.log("EligibilityRegistry", address(registry));
        console.log("UsernameRegistry   ", address(usernames));
        console.log("GatedShare         ", address(gated));
        console.log("Stablegram         ", address(gram));
    }
}
