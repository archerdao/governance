// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface IArchToken {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function mint(address dst, uint256 amount) external returns (bool);
    function burn(address src, uint256 amount) external returns (bool);
    function updateTokenMetadata(string memory tokenName, string memory tokenSymbol) external returns (bool);
    function supplyManager() external view returns (address);
    function metadataManager() external view returns (address);
    function supplyChangeAllowedAfter() external view returns (uint256);
    function supplyChangeWaitingPeriod() external view returns (uint32);
    function supplyChangeWaitingPeriodMinimum() external view returns (uint32);
    function mintCap() external view returns (uint16);
    function setSupplyManager(address newSupplyManager) external returns (bool);
    function setMetadataManager(address newMetadataManager) external returns (bool);
    function setSupplyChangeWaitingPeriod(uint32 period) external returns (bool);
    function setMintCap(uint16 newCap) external returns (bool);
}