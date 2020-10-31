// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/PrismProxy.sol";

/**
 * @title VotingPowerPrism
 * @dev Storage for voting power is at this address, while execution is delegated to the prism proxy implementation contract
 * All contracts that use voting power should reference this contract.
 */
contract VotingPowerPrism is PrismProxy {

    constructor() {
        // Initialize storage
        ProxyStorage storage s = proxyStorage();
        // Set admin to caller
        s.admin = msg.sender;
    }

    /**
     * @notice Forwards call to implementation contract
     */
    fallback() external payable {
        _forwardToImplementation();
    }

    /**
     * @notice Forwards call to implementation contract
     */
    receive() external payable {
        _forwardToImplementation();
    }
}
