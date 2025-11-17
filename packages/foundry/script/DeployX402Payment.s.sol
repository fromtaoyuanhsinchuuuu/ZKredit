//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/payment/X402Payment.sol";
import "./DeployHelpers.s.sol";

/**
 * @notice Deploy X402Payment contract and configure it
 * @dev Run with: forge script script/DeployX402Payment.s.sol --rpc-url hederaTestnet --broadcast
 */
contract DeployX402Payment is ScaffoldETHDeploy {
    function run() external returns (X402Payment) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert InvalidPrivateKey(
                "You don't have a deployer account. Make sure you have set DEPLOYER_PRIVATE_KEY in .env"
            );
        }

        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contract
        X402Payment x402Payment = new X402Payment();
        
        console.logString("=== X402Payment Deployment ===");
        console.logString(
            string.concat(
                "Contract deployed at: ",
                vm.toString(address(x402Payment))
            )
        );
        
        // Whitelist the receiver address: 0.0.7270863
        // Convert Hedera account ID to EVM address (with correct checksum)
        address receiverAddress = address(0x00000000000000000000000000000000006ef1CF);
        x402Payment.setRecipientWhitelist(receiverAddress, true);
        console.logString(
            string.concat(
                "Whitelisted receiver: ",
                vm.toString(receiverAddress)
            )
        );
        
        // Also whitelist the worker address for testing
        address workerAddress = address(0x947fF365B7099aC8b90e4f1024Fc8A2F6D2f3eD4);
        x402Payment.setRecipientWhitelist(workerAddress, true);
        console.logString(
            string.concat(
                "Whitelisted worker: ",
                vm.toString(workerAddress)
            )
        );
        
        vm.stopBroadcast();

        console.logString("=== Configuration Complete ===");
        console.logString(
            string.concat(
                "Update your .env with: X402_PAYMENT_CONTRACT_ID=",
                vm.toString(address(x402Payment))
            )
        );

        return x402Payment;
    }

    function test() public {}
}

