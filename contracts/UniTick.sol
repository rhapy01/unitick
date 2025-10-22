// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UniTick
 * @dev ERC20 token with faucet functionality for testing
 * Users can claim 200,000 tokens once per 24 hours
 */
contract UniTick is ERC20, Ownable {
    mapping(address => uint256) public lastClaimTime;
    uint256 public constant CLAIM_AMOUNT = 200000 * 10**18; // 200k tokens with 18 decimals
    uint256 public constant CLAIM_COOLDOWN = 24 hours;

    event TokensClaimed(address indexed claimant, uint256 amount);

    constructor() ERC20("UniTick", "UTICK") Ownable(msg.sender) {
        // Mint initial supply to owner
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens for initial setup
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Claim faucet tokens
     * Users can claim 200k tokens once every 24 hours
     */
    function claimFaucet() external {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + CLAIM_COOLDOWN,
            "Can only claim once per 24 hours"
        );

        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, CLAIM_AMOUNT);

        emit TokensClaimed(msg.sender, CLAIM_AMOUNT);
    }

    /**
     * @dev Check if an address can claim tokens
     * @param account Address to check
     * @return bool True if the address can claim tokens
     */
    function canClaim(address account) external view returns (bool) {
        return block.timestamp >= lastClaimTime[account] + CLAIM_COOLDOWN;
    }

    /**
     * @dev Get time until next claim is available
     * @param account Address to check
     * @return uint256 Seconds until next claim
     */
    function timeUntilNextClaim(address account) external view returns (uint256) {
        uint256 nextClaimTime = lastClaimTime[account] + CLAIM_COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
}
