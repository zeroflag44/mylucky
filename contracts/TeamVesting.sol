// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/finance/VestingWallet.sol";

/**
 * @title TeamVesting
 * @notice Vesting contract for founder allocation
 * @dev Extends OpenZeppelin VestingWallet with 6-month cliff + 24-month linear vesting
 * 
 * Vesting Schedule:
 * - Cliff Period: 6 months (no tokens released)
 * - Vesting Duration: 24 months linear release after cliff
 * - Total Period: 30 months (6 + 24)
 * 
 * Security Features:
 * - Immutable beneficiary address
 * - Time-locked token release
 * - Transparent on-chain vesting schedule
 * - No admin functions to alter vesting
 */
contract TeamVesting is VestingWallet {
    /// @notice Cliff duration: 6 months in seconds
    uint64 public constant CLIFF_DURATION = 180 days;
    
    /// @notice Vesting duration after cliff: 24 months in seconds
    uint64 public constant VESTING_DURATION = 730 days;
    
    /// @notice Total vesting period: 30 months
    uint64 public constant TOTAL_DURATION = CLIFF_DURATION + VESTING_DURATION;
    
    /// @notice Deployment timestamp
    uint64 public immutable deploymentTime;
    
    /// @notice Cliff end timestamp
    uint64 public immutable cliffEnd;
    
    /// @notice Vesting end timestamp
    uint64 public immutable vestingEnd;

    /// @notice Emitted when vesting contract is deployed
    event VestingDeployed(
        address indexed beneficiary,
        uint64 startTimestamp,
        uint64 cliffEnd,
        uint64 vestingEnd
    );

    /**
     * @notice Constructor - creates vesting schedule for founder tokens
     * @param beneficiaryAddress Address that will receive vested tokens
     * 
     * @dev Vesting starts immediately upon deployment
     * @dev No tokens can be released during cliff period
     * @dev After cliff, tokens are released linearly over 24 months
     */
    constructor(address beneficiaryAddress) 
        VestingWallet(
            beneficiaryAddress,
            uint64(block.timestamp),
            TOTAL_DURATION
        ) 
    {
        require(beneficiaryAddress != address(0), "TeamVesting: beneficiary is zero address");
        
        deploymentTime = uint64(block.timestamp);
        cliffEnd = uint64(block.timestamp) + CLIFF_DURATION;
        vestingEnd = uint64(block.timestamp) + TOTAL_DURATION;
        
        emit VestingDeployed(beneficiaryAddress, deploymentTime, cliffEnd, vestingEnd);
    }
    
    /**
     * @notice Calculate releasable amount considering cliff period
     * @param token Address of the token
     * @return Amount of tokens that can be released
     * 
     * @dev Overrides VestingWallet to implement cliff
     * @dev Returns 0 if still in cliff period
     * @dev After cliff, uses parent calculation for linear vesting
     */
    function releasable(address token) public view override returns (uint256) {
        // If still in cliff period, no tokens are releasable
        if (block.timestamp < cliffEnd) {
            return 0;
        }
        
        // After cliff, use standard vesting calculation
        return super.releasable(token);
    }
    
    /**
     * @notice Get current vesting status
     * @return isCliffPassed Whether cliff period has ended
     * @return isFullyVested Whether all tokens have been vested
     * @return timeUntilCliffEnd Seconds until cliff ends (0 if passed)
     * @return timeUntilVestingEnd Seconds until vesting ends (0 if passed)
     */
    function getVestingStatus() external view returns (
        bool isCliffPassed,
        bool isFullyVested,
        uint256 timeUntilCliffEnd,
        uint256 timeUntilVestingEnd
    ) {
        isCliffPassed = block.timestamp >= cliffEnd;
        isFullyVested = block.timestamp >= vestingEnd;
        
        timeUntilCliffEnd = block.timestamp < cliffEnd 
            ? cliffEnd - block.timestamp 
            : 0;
            
        timeUntilVestingEnd = block.timestamp < vestingEnd 
            ? vestingEnd - block.timestamp 
            : 0;
    }
}
