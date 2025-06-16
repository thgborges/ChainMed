// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {TuringRX} from "../src/TuringRX.sol";

contract DeployTuringRX is Script {
    // Sepolia Chainlink parameters
    address constant LINK_TOKEN = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
    address constant ORACLE = 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD; // Example oracle
    bytes32 constant JOB_ID =
        0x00000000000000000000000000000000c1c5e92880894eb6b27d3cae19670aa3;
    uint256 constant FEE = 0.1 ether; // 0.1 LINK

    function run() external returns (TuringRX) {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy TuringRX
        TuringRX turingRX = new TuringRX(LINK_TOKEN, ORACLE, JOB_ID, FEE);

        // Fund contract with LINK (optional, for testing)
        // Note: Requires LINK interface and sufficient balance
        // IERC20(LINK_TOKEN).transfer(address(turingRX), 1 ether); // 1 LINK

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment address
        console.log("TuringRX deployed at:", address(turingRX));

        return turingRX;
    }
}
