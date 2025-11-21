// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "./IdentityRegistry.sol";

/**
 * @title ReputationRegistryDemo
 * @notice ERC-8004 Reputation Management - DEMO VERSION (No Signature Verification)
 * @dev This is a simplified version for hackathon demos. Production should use full ReputationRegistry.
 */
contract ReputationRegistryDemo {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Reference to the Identity Registry
    IdentityRegistry public immutable identityRegistry;

    /// @notice Feedback structure
    struct Feedback {
        address client;
        uint8 score;         // 0-100
        bytes32 tag1;        // Primary category
        bytes32 tag2;        // Secondary category
        string feedbackUri;  // IPFS URI
        bytes32 feedbackHash; // Hash of off-chain content
        uint256 timestamp;
    }

    /// @notice FeedbackAuth structure for pre-authorization
    struct FeedbackAuth {
        uint256 agentId;
        address clientAddress;
        uint64 indexLimit;      // Max submissions allowed
        uint256 expiry;         // Unix timestamp
        uint256 chainId;
        address identityRegistry;
        address signerAddress;
    }

    /// @notice Storage: agentId => 1-based feedback index => Feedback
    mapping(uint256 => mapping(uint256 => Feedback)) private _feedback;

    /// @notice Storage: agentId => current feedback count
    mapping(uint256 => uint256) public feedbackCount;

    /// @notice Storage: track used authorizations to prevent replay
    /// Format: keccak256(abi.encode(agentId, clientAddress, indexLimit, expiry)) => used count
    mapping(bytes32 => uint256) private _authUsageCount;

    /// @notice Events
    event NewFeedback(
        uint256 indexed agentId,
        uint256 indexed feedbackIndex,
        address indexed client,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string feedbackUri,
        bytes32 feedbackHash,
        uint256 timestamp
    );

    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid registry address");
        identityRegistry = IdentityRegistry(_identityRegistry);
    }

    // ============ Feedback Submission ============

    /**
     * @notice Submit feedback for an agent (DEMO VERSION - No signature verification)
     * @param agentId The agent ID
     * @param score Feedback score (0-100)
     * @param tag1 Primary category tag
     * @param tag2 Secondary category tag
     * @param feedbackUri IPFS URI for detailed feedback
     * @param feedbackHash Hash of off-chain feedback content
     * @param feedbackAuth Encoded FeedbackAuth struct + signature (224 + 65 bytes)
     */
    function giveFeedback(
        uint256 agentId,
        uint8 score,
        bytes32 tag1,
        bytes32 tag2,
        string calldata feedbackUri,
        bytes32 feedbackHash,
        bytes calldata feedbackAuth
    ) external {
        require(score <= 100, "Score must be <= 100");
        require(feedbackAuth.length >= 289, "Invalid feedbackAuth length"); // 224 + 65

        // DEMO MODE: Skip signature verification, only check basic parameters
        _verifyFeedbackAuthDemo(agentId, feedbackAuth);

        // Store feedback (1-based indexing)
        uint256 newIndex = ++feedbackCount[agentId];
        _feedback[agentId][newIndex] = Feedback({
            client: msg.sender,
            score: score,
            tag1: tag1,
            tag2: tag2,
            feedbackUri: feedbackUri,
            feedbackHash: feedbackHash,
            timestamp: block.timestamp
        });

        emit NewFeedback(
            agentId,
            newIndex,
            msg.sender,
            score,
            tag1,
            tag2,
            feedbackUri,
            feedbackHash,
            block.timestamp
        );
    }

    // ============ FeedbackAuth Verification (DEMO) ============

    /**
     * @notice Verify FeedbackAuth parameters only (skip signature for demo)
     * @param agentId The agent ID being reviewed
     * @param feedbackAuth Encoded struct + signature
     */
    function _verifyFeedbackAuthDemo(uint256 agentId, bytes calldata feedbackAuth) internal {
        // Decode FeedbackAuth struct (first 224 bytes)
        FeedbackAuth memory auth = abi.decode(feedbackAuth[:224], (FeedbackAuth));

        // Basic parameter checks (skip signature verification for demo)
        require(auth.agentId == agentId, "AgentId mismatch");
        
        // Optional: Check expiry if provided (allow 0 for no expiry in demo)
        if (auth.expiry > 0) {
            require(auth.expiry > block.timestamp, "Authorization expired");
        }

        // Check usage limit
        bytes32 authKey = keccak256(abi.encode(
            auth.agentId,
            auth.clientAddress,
            auth.indexLimit,
            auth.expiry
        ));
        uint256 currentUsage = _authUsageCount[authKey];
        require(currentUsage < auth.indexLimit, "Authorization limit exceeded");
        _authUsageCount[authKey] = currentUsage + 1;

        // DEMO: Skip signature verification and agent ownership check
        // In production, use the full ReputationRegistry contract
    }

    // ============ Query Functions ============

    /**
     * @notice Get feedback by index (1-based)
     * @param agentId The agent ID
     * @param index The feedback index (starting from 1)
     * @return The feedback data
     */
    function getFeedback(uint256 agentId, uint256 index)
        external
        view
        returns (Feedback memory)
    {
        require(index > 0 && index <= feedbackCount[agentId], "Invalid index");
        return _feedback[agentId][index];
    }

    /**
     * @notice Get multiple feedbacks in batch
     * @param agentId The agent ID
     * @param startIndex Starting index (1-based, inclusive)
     * @param endIndex Ending index (1-based, inclusive)
     * @return feedbacks Array of feedback data
     */
    function getFeedbackBatch(
        uint256 agentId,
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (Feedback[] memory feedbacks) {
        require(startIndex > 0, "Start index must be > 0");
        require(endIndex <= feedbackCount[agentId], "End index out of range");
        require(startIndex <= endIndex, "Invalid range");

        uint256 count = endIndex - startIndex + 1;
        feedbacks = new Feedback[](count);
        
        for (uint256 i = 0; i < count; i++) {
            feedbacks[i] = _feedback[agentId][startIndex + i];
        }
    }

    /**
     * @notice Calculate average score for an agent
     * @param agentId The agent ID
     * @return avgScore Average score (scaled by 100), count Total feedback count
     */
    function getAverageScore(uint256 agentId)
        external
        view
        returns (uint256 avgScore, uint256 count)
    {
        count = feedbackCount[agentId];
        if (count == 0) return (0, 0);

        uint256 totalScore = 0;
        for (uint256 i = 1; i <= count; i++) {
            totalScore += _feedback[agentId][i].score;
        }
        avgScore = (totalScore * 100) / count;
    }

    /**
     * @notice Get feedback count for an agent
     * @param agentId The agent ID
     * @return Total feedback count
     */
    function getFeedbackCount(uint256 agentId) external view returns (uint256) {
        return feedbackCount[agentId];
    }

    /**
     * @notice Check how many times an authorization has been used
     * @param agentId The agent ID
     * @param clientAddress The client address
     * @param indexLimit The index limit
     * @param expiry The expiry timestamp
     * @return usage count
     */
    function getAuthUsageCount(
        uint256 agentId,
        address clientAddress,
        uint64 indexLimit,
        uint256 expiry
    ) external view returns (uint256) {
        bytes32 authKey = keccak256(abi.encode(
            agentId,
            clientAddress,
            indexLimit,
            expiry
        ));
        return _authUsageCount[authKey];
    }

    /**
     * @notice Get all feedback for an agent
     * @param agentId The agent ID
     * @return feedbacks Array of all feedback data
     */
    function getAllFeedback(uint256 agentId)
        external
        view
        returns (Feedback[] memory feedbacks)
    {
        uint256 count = feedbackCount[agentId];
        if (count == 0) return new Feedback[](0);

        feedbacks = new Feedback[](count);
        for (uint256 i = 0; i < count; i++) {
            feedbacks[i] = _feedback[agentId][i + 1]; // Convert to 1-based indexing
        }
    }

    /**
     * @notice Search feedback by score range
     * @param agentId The agent ID
     * @param minScore Minimum score (inclusive)
     * @param maxScore Maximum score (inclusive)
     * @return indices Array of matching feedback indices (1-based)
     */
    function searchByScore(
        uint256 agentId,
        uint8 minScore,
        uint8 maxScore
    ) external view returns (uint256[] memory indices) {
        require(minScore <= maxScore, "Invalid range");
        require(maxScore <= 100, "Max score must be <= 100");

        uint256 count = feedbackCount[agentId];
        uint256[] memory tempIndices = new uint256[](count);
        uint256 matchCount = 0;

        for (uint256 i = 1; i <= count; i++) {
            uint8 score = _feedback[agentId][i].score;
            if (score >= minScore && score <= maxScore) {
                tempIndices[matchCount++] = i;
            }
        }

        // Resize array to actual match count
        indices = new uint256[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            indices[i] = tempIndices[i];
        }
    }
}
