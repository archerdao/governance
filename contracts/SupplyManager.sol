// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";
import "./interfaces/IArchToken.sol";

contract SupplyManager {
    using SafeMath for uint256;

    /// @notice ARCH token
    IArchToken public token;

    /// @notice Address which may make changes to token supply by calling provided functions
    address public admin;

    /// @notice The timestamp after which a change may occur
    uint256 public changeAllowedAfter;

    /// @notice The minimum time between changes
    uint32 public minTimeBetweenChanges = 1 days * 30;

    /**
     * @notice Construct a new supply manager
     * @param _token The address for the token
     * @param _admin The admin account for this contract
     */
    constructor(address _token, address _admin) {
        token = IArchToken(_token);
        changeAllowedAfter = token.supplyChangeAllowedAfter().add(minTimeBetweenChanges);
        admin = _admin;
    }

    /**
     * @notice Mint new tokens
     * @param dst The address of the destination account
     * @param amount The number of tokens to be minted
     */
    function mintTokens(address dst, uint256 amount) external {
        require(msg.sender == admin, "Arch::mintTokens: caller must be admin");
        require(block.timestamp >= changeAllowedAfter, "Arch::mintTokens: changes not allowed yet");
        changeAllowedAfter = block.timestamp.add(minTimeBetweenChanges);
        token.mint(dst, amount);
    }

    /**
     * @notice Change the maximum amount of tokens that can be minted at once
     * @param newCap The new mint cap in bips (10,000 bips = 1% of totalSupply)
     */
    function changeMintCap(uint16 newCap) external {
        require(msg.sender == admin, "Arch::changeMintCap: caller must be admin");
        require(block.timestamp >= changeAllowedAfter, "Arch::changeMintCap: changes not allowed yet");
        changeAllowedAfter = block.timestamp.add(minTimeBetweenChanges);
        token.setMintCap(newCap);
    }

    /**
     * @notice Change the supply change waiting period
     * @param newPeriod new waiting period
     */
    function changeSupplyChangeWaitingPeriod(uint32 newPeriod) external {
        require(msg.sender == admin, "Arch::changeSupplyChangeWaitingPeriod: caller must be admin");
        require(block.timestamp >= changeAllowedAfter, "Arch::changeSupplyChangeWaitingPeriod: changes not allowed yet");
        changeAllowedAfter = block.timestamp.add(minTimeBetweenChanges);
        token.setSupplyChangeWaitingPeriod(newPeriod);
    }

    /**
     * @notice Change the supplyManager address
     * @param newSupplyManager new supply manager address
     */
    function upgradeSupplyManager(address newSupplyManager) external {
        require(msg.sender == admin, "Arch::upgradeSupplyManager: caller must be admin");
        require(block.timestamp >= changeAllowedAfter, "Arch::upgradeSupplyManager: changes not allowed yet");
        token.setSupplyManager(newSupplyManager);
    }
}
