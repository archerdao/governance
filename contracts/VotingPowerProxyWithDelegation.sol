// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/VotingPowerStorageWithDelegation.sol";

/**
 * @title VotingPowerProxy
 * @dev Storage for the comptroller is at this address, while execution is delegated to the `votingPowerImplementation`.
 * CTokens should reference this contract as their comptroller.
 */
contract VotingPowerProxy {
    /**
      * @notice Emitted when pendingVotingPowerImplementation is changed
      */
    event NewPendingImplementation(address oldPendingImplementation, address newPendingImplementation);

    /**
      * @notice Emitted when pendingVotingPowerImplementation is accepted, which means voting power implementation is updated
      */
    event NewImplementation(address oldImplementation, address newImplementation);

    /**
      * @notice Emitted when pendingAdmin is changed
      */
    event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin);

    /**
      * @notice Emitted when pendingAdmin is accepted, which means admin is updated
      */
    event NewAdmin(address oldAdmin, address newAdmin);

    constructor() {
        // Initialize storage
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        // Set admin to caller
        s.admin = msg.sender;
    }

    /*** Admin Functions ***/
     /**
    * @notice Create new pending implementation of voting power. msg.sender must be admin
    * @dev Admin function for proposing new implementation contract
    * @return boolean indicating success of operation
    */
    function setPendingImplementation(address newPendingImplementation) public returns (bool) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        require(msg.sender == s.admin, "Caller must be admin");

        address oldPendingImplementation = s.pendingVotingPowerImplementation;

        s.pendingVotingPowerImplementation = newPendingImplementation;

        emit NewPendingImplementation(oldPendingImplementation, s.pendingVotingPowerImplementation);

        return true;
    }

    /**
    * @notice Accepts new implementation of voting power. msg.sender must be pendingImplementation
    * @dev Admin function for new implementation to accept it's role as implementation
    * @return boolean indicating success of operation
    */
    function acceptImplementation() public returns (bool) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        // Check caller is pendingImplementation and pendingImplementation ≠ address(0)
        require(msg.sender == s.pendingVotingPowerImplementation && s.pendingVotingPowerImplementation != address(0), "Caller must be pending implementation");
 
        // Save current values for inclusion in log
        address oldImplementation = s.votingPowerImplementation;
        address oldPendingImplementation = s.pendingVotingPowerImplementation;

        s.votingPowerImplementation = s.pendingVotingPowerImplementation;

        s.pendingVotingPowerImplementation = address(0);
        s.version++;

        emit NewImplementation(oldImplementation, s.votingPowerImplementation);
        emit NewPendingImplementation(oldPendingImplementation, s.pendingVotingPowerImplementation);

        return true;
    }


    /**
      * @notice Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
      * @dev Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
      * @param newPendingAdmin New pending admin.
      * @return boolean indicating success of operation
      */
    function setPendingAdmin(address newPendingAdmin) public returns (bool) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        // Check caller = admin
        require(msg.sender == s.admin, "Caller must be admin");

        // Save current value, if any, for inclusion in log
        address oldPendingAdmin = s.pendingAdmin;

        // Store pendingAdmin with value newPendingAdmin
        s.pendingAdmin = newPendingAdmin;

        // Emit NewPendingAdmin(oldPendingAdmin, newPendingAdmin)
        emit NewPendingAdmin(oldPendingAdmin, newPendingAdmin);

        return true;
    }

    /**
      * @notice Accepts transfer of admin rights. msg.sender must be pendingAdmin
      * @dev Admin function for pending admin to accept role and update admin
      * @return boolean indicating success of operation
      */
    function acceptAdmin() public returns (bool) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        // Check caller is pendingAdmin and pendingAdmin ≠ address(0)
        require(msg.sender == s.pendingAdmin && msg.sender != address(0), "Caller must be pending admin");

        // Save current values for inclusion in log
        address oldAdmin = s.admin;
        address oldPendingAdmin = s.pendingAdmin;

        // Store admin with value pendingAdmin
        s.admin = s.pendingAdmin;

        // Clear the pending value
        s.pendingAdmin = address(0);

        emit NewAdmin(oldAdmin, s.admin);
        emit NewPendingAdmin(oldPendingAdmin, s.pendingAdmin);

        return true;
    }

    function proxyAdmin() public view returns (address) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        return s.admin;
    }

    function pendingProxyAdmin() public view returns (address) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        return s.pendingAdmin;
    }

    function votingPowerImplementation() public view returns (address) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        return s.votingPowerImplementation;
    }

    function pendingVotingPowerImplementation() public view returns (address) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        return s.pendingVotingPowerImplementation;
    }

    function version() public view returns (uint8) {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        return s.version;
    }

    /**
     * @dev Delegates execution to an implementation contract.
     * It returns to the external caller whatever the implementation returns
     * or forwards reverts.
     */
    fallback() external payable {
        AdminStorage storage s = VotingPowerStorage.adminStorage();
        // delegate all other functions to current implementation
        (bool success, ) = s.votingPowerImplementation.delegatecall(msg.data);

        assembly {
              let free_mem_ptr := mload(0x40)
              returndatacopy(free_mem_ptr, 0, returndatasize())

              switch success
              case 0 { revert(free_mem_ptr, returndatasize()) }
              default { return(free_mem_ptr, returndatasize()) }
        }
    }

    /**
     * @dev Disallow sending ETH to proxy contract directly
     */
    receive() external payable {
        revert("Cannot send ETH directly");
    }
}
