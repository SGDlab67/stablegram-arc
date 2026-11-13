// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

import {Ballot} from "../src/Ballot.sol";
import {EligibilityRegistry} from "../src/EligibilityRegistry.sol";
import {MockShare} from "../src/MockShare.sol";
import {UsernameRegistry} from "../src/UsernameRegistry.sol";
import {VoteShare} from "../src/VoteShare.sol";

/// Deploys the whole set. Nothing here is chain specific, so the same
/// script runs on Arc testnet and on Monad with only --rpc-url changed.
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;

        MockShare share = new MockShare("Mock Circle Share", "mCRCL");
        EligibilityRegistry registry = new EligibilityRegistry(deployer);
        UsernameRegistry usernames = new UsernameRegistry();
        VoteShare voteShare = new VoteShare(share, "Votable Circle Share", "vCRCL", registry, usernames);
        Ballot ballot = new Ballot(voteShare, deployer);

        // The deployer is the compliance role and the custodian for the demo.
        // Clear the deployer so it can hold shares straight away.
        registry.set(deployer, true);
        share.mint(deployer, 1_000e18);

        vm.stopBroadcast();

        console.log("chain id          ", block.chainid);
        console.log("deployer          ", deployer);
        console.log("MockShare         ", address(share));
        console.log("EligibilityRegistry", address(registry));
        console.log("UsernameRegistry  ", address(usernames));
        console.log("VoteShare         ", address(voteShare));
        console.log("Ballot            ", address(ballot));
    }
}
