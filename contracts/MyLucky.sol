// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MyLucky Token
 * @notice Fixed-supply ERC-20 token with secure, transparent distribution
 * @dev No mint, no burn, no admin, no upgrade, no tax
 * 
 * Security Features:
 * - Fixed total supply of 1,000,000,000 tokens
 * - No owner or privileged functions
 * - All addresses validated at construction
 * - Immutable distribution
 * 
 * Distribution:
 * - 70% Treasury (multisig wallet)
 * - 15% Founder (vesting contract)
 * - 15% Community reserve (liquidity and rewards)
 */
contract MyLucky is ERC20 {
    /// @notice Total supply: 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @notice Treasury allocation: 70%
    uint256 public constant TREASURY_ALLOCATION = 700_000_000 * 10**18;
    
    /// @notice Founder allocation: 15%
    uint256 public constant FOUNDER_ALLOCATION = 150_000_000 * 10**18;
    
    /// @notice Community allocation: 15%
    uint256 public constant COMMUNITY_ALLOCATION = 150_000_000 * 10**18;
    
    /// @notice Treasury multisig address (immutable)
    address public immutable treasury;
    
    /// @notice Founder vesting contract address (immutable)
    address public immutable founderVesting;
    
    /// @notice Community reserve address (immutable)
    address public immutable communityReserve;

    /// @notice Emitted when the token is deployed
    event TokenDeployed(
        address indexed treasury,
        address indexed founderVesting,
        address indexed communityReserve,
        uint256 totalSupply
    );

    /**
     * @notice Constructor - deploys token with fixed distribution
     * @param _treasury Address of the treasury multisig (Gnosis Safe)
     * @param _founderVesting Address of the founder vesting contract
     * @param _communityReserve Address of the community reserve
     * 
     * @dev All addresses are validated and stored as immutable
     * @dev Total supply is minted once and distributed immediately
     */
    constructor(
        address _treasury,
        address _founderVesting,
        address _communityReserve
    ) ERC20("MYLUCKY", "MYLUCKY") {
        // Validate all addresses
        require(_treasury != address(0), "MyLucky: treasury is zero address");
        require(_founderVesting != address(0), "MyLucky: vesting is zero address");
        require(_communityReserve != address(0), "MyLucky: community is zero address");
        
        // Store addresses as immutable
        treasury = _treasury;
        founderVesting = _founderVesting;
        communityReserve = _communityReserve;
        
        // Mint entire supply and distribute
        _mint(_treasury, TREASURY_ALLOCATION);
        _mint(_founderVesting, FOUNDER_ALLOCATION);
        _mint(_communityReserve, COMMUNITY_ALLOCATION);
        
        // Verify total supply matches expected amount
        assert(totalSupply() == TOTAL_SUPPLY);
        
        emit TokenDeployed(_treasury, _founderVesting, _communityReserve, TOTAL_SUPPLY);
    }
    
    /**
     * @notice Returns token decimals (18)
     * @dev Standard ERC-20 decimals
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
