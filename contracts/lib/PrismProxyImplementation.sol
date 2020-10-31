// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./PrismProxy.sol";

contract PrismProxyImplementation {
    /**
     * @notice Accept invitation to be implementation contract for proxy
     * @param prism Prism Proxy contract
     */
    function become(PrismProxy prism) public {
        require(msg.sender == prism.proxyAdmin(), "Prism::become: only proxy admin can change implementation");
        require(prism.acceptProxyImplementation() == true, "Prism::become: change not authorized");
    }
}