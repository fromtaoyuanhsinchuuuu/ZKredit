// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../contracts/erc8004/IdentityRegistry.sol";
import {ReputationRegistryDemo} from "../contracts/erc8004/ReputationRegistryDemo.sol";
import {ValidationRegistry} from "../contracts/erc8004/ValidationRegistry.sol";

/**
 * @title DeployERC8004Demo
 * @notice Deploys demo version of ERC-8004 registries (no signature verification)
 * @dev Usage: forge script script/DeployERC8004Demo.s.sol:DeployERC8004Demo --rpc-url testnet --broadcast
 */
contract DeployERC8004Demo is Script {
    function run() external {
        // Load the private key from environment.
        // Accept either DEPLOYER_PRIVATE_KEY, HEDERA_PRIVATE_KEY or PRIVATE_KEY (standard Foundry)
        bytes32 pkBytes;
        bool found = true;
        if (vm.envOr("DEPLOYER_PRIVATE_KEY", bytes32(0)) != bytes32(0)) {
            pkBytes = vm.envBytes32("DEPLOYER_PRIVATE_KEY");
        } else if (vm.envOr("HEDERA_PRIVATE_KEY", bytes32(0)) != bytes32(0)) {
            pkBytes = vm.envBytes32("HEDERA_PRIVATE_KEY");
        } else if (vm.envOr("PRIVATE_KEY", bytes32(0)) != bytes32(0)) {
            pkBytes = vm.envBytes32("PRIVATE_KEY");
        } else {
            found = false;
        }

        require(found, "No private key env var found (expected DEPLOYER_PRIVATE_KEY or HEDERA_PRIVATE_KEY or PRIVATE_KEY)");

        // Convert bytes32 private key to uint256
        uint256 deployerPrivateKey = uint256(pkBytes);
        
        console.log("==========================================");
        console.log("Deploying ERC-8004 Registries (DEMO MODE)");
        console.log("==========================================");
        console.log("");
        
        // Get deployer address
        address deployerAddress = vm.addr(deployerPrivateKey);
        console.log("Deployer Address:", deployerAddress);
        console.log("");
        
        // 1. Deploy IdentityRegistry
        console.log("1. Deploying IdentityRegistry...");
        vm.startBroadcast(deployerPrivateKey);
        IdentityRegistry identityRegistry = new IdentityRegistry();
        vm.stopBroadcast();
        console.log("   IdentityRegistry deployed to:", address(identityRegistry));
        console.log("");
        
        // 2. Deploy ReputationRegistryDemo (No signature verification)
        console.log("2. Deploying ReputationRegistryDemo...");
        vm.startBroadcast(deployerPrivateKey);
        ReputationRegistryDemo reputationRegistry = new ReputationRegistryDemo(
            address(identityRegistry)
        );
        vm.stopBroadcast();
        console.log("   ReputationRegistryDemo deployed to:", address(reputationRegistry));
        console.log("");
        
        // 3. Deploy ValidationRegistry
        console.log("3. Deploying ValidationRegistry...");
        vm.startBroadcast(deployerPrivateKey);
        ValidationRegistry validationRegistry = new ValidationRegistry(
            address(identityRegistry)
        );
        vm.stopBroadcast();
        console.log("   ValidationRegistry deployed to:", address(validationRegistry));
        console.log("");
        
        // 4. Summary
        console.log("================================");
        console.log("Deployment Summary (DEMO MODE):");
        console.log("================================");
        console.log("IdentityRegistry:    ", address(identityRegistry));
        console.log("ReputationRegistry:  ", address(reputationRegistry));
        console.log("ValidationRegistry:  ", address(validationRegistry));
        console.log("");
        console.log("IMPORTANT: This is a DEMO version without signature verification.");
        console.log("For production, use DeployERC8004.s.sol to deploy the full version.");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update your .env file:");
        console.log("   REPUTATION_REGISTRY_ADDRESS=", address(reputationRegistry));
        console.log("   VALIDATION_REGISTRY_ADDRESS=", address(validationRegistry));
        console.log("   IDENTITY_REGISTRY_ADDRESS=", address(identityRegistry));
        console.log("");
    }
}
