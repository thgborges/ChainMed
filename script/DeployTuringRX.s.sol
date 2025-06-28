// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {TuringRX} from "src/TuringRX.sol";

contract DeployTuringRX is Script {
    function run() external {
        address router = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
        uint64 subscriptionId = 5153;
        bytes32 donId = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

        vm.startBroadcast();
        new TuringRX(router, subscriptionId, donId);
        vm.stopBroadcast();
    }
}
