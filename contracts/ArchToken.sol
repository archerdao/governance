// SPDX-License-Identifier: BSD 3-Clause
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./lib/SafeMath.sol";

contract ArchToken {
    using SafeMath for uint256;

    /// @notice EIP-20 token name for this token
    string public name = "Archer";

    /// @notice EIP-20 token symbol for this token
    string public symbol = "ARCH";

    /// @notice EIP-20 token decimals for this token
    uint8 public constant decimals = 18;

    /// @notice Total number of tokens in circulation
    uint public totalSupply = 100_000_000e18; // 100 million

    /// @notice Address which may mint new tokens
    address public minter;

    /// @notice Address which may change token metadata
    address public manager;

    /// @notice The timestamp after which minting may occur
    uint public mintingAllowedAfter;

    /// @notice Minimum time between mints
    uint32 public constant minimumTimeBetweenMints = 1 days * 365;

    /// @notice Cap on the percentage of totalSupply that can be minted at each mint
    uint8 public constant mintCap = 2;

    /// @dev Allowance amounts on behalf of others
    mapping (address => mapping (address => uint256)) internal allowances;

    /// @dev Official record of token balances for each account
    mapping (address => uint256) internal balances;

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)");

    /// @notice The EIP-712 typehash for the permit struct used by the contract
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    /// @notice A record of states for signing / validating signatures
    mapping (address => uint) public nonces;

    /// @notice An event that's emitted when the minter address is changed
    event MinterChanged(address minter, address newMinter);

    /// @notice An event that's emitted when the minter address is changed
    event ManagerChanged(address manager, address newManager);

    /// @notice An event that's emitted when the token name and symbol are changed
    event TokenMetaUpdated(string name, string symbol);

    /// @notice The standard EIP-20 transfer event
    event Transfer(address indexed from, address indexed to, uint256 amount);

    /// @notice The standard EIP-20 approval event
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    /**
     * @notice Construct a new Arch token
     * @param _account The initial account to grant all the tokens
     * @param _minter The account with minting ability
     * @param _manager The account with the ability to change token metadata
     * @param _mintingAllowedAfter The timestamp after which minting may occur
     */
    constructor(address _account, address _minter, address _manager, uint _mintingAllowedAfter) {
        require(_mintingAllowedAfter >= block.timestamp, "Arch::constructor: minting can only begin after deployment");

        balances[_account] = uint256(totalSupply);
        emit Transfer(address(0), _account, totalSupply);

        mintingAllowedAfter = _mintingAllowedAfter;
        minter = _minter;
        emit MinterChanged(address(0), minter);

        manager = _manager;
        emit ManagerChanged(address(0), manager);
    }

    /**
     * @notice Change the minter address
     * @param _minter The address of the new minter
     */
    function setMinter(address _minter) external {
        require(msg.sender == minter, "Arch::setMinter: only the minter can change the minter address");
        emit MinterChanged(minter, _minter);
        minter = _minter;
    }

    /**
     * @notice Change the manager address
     * @param _manager The address of the new manager
     */
    function setManager(address _manager) external {
        require(msg.sender == manager, "Arch::setManager: only the manager can change the manager address");
        emit ManagerChanged(manager, _manager);
        manager = _manager;
    }

    /**
     * @notice Mint new tokens
     * @param dst The address of the destination account
     * @param amount The number of tokens to be minted
     */
    function mint(address dst, uint amount) external {
        require(msg.sender == minter, "Arch::mint: only the minter can mint");
        require(block.timestamp >= mintingAllowedAfter, "Arch::mint: minting not allowed yet");
        require(dst != address(0), "Arch::mint: cannot transfer to the zero address");
        require(amount <= totalSupply.mul(mintCap).div(100), "Arch::mint: exceeded mint cap");

        // record the mint
        mintingAllowedAfter = block.timestamp.add(minimumTimeBetweenMints);

        // mint the amount
        totalSupply = totalSupply.add(amount);

        // transfer the amount to the recipient
        balances[dst] = balances[dst].add(amount);
        emit Transfer(address(0), dst, amount);
    }

    /**
     * @notice Update the token name and symbol
     * @param _tokenName The new name for the token
     * @param _tokenSymbol The new symbol for the token
     */
    function updateTokenMetadata(string memory _tokenName, string memory _tokenSymbol) external {
        require(msg.sender == manager, "Arch::updateTokenMeta: only the manager can update token metadata");
        name = _tokenName;
        symbol = _tokenSymbol;
        emit TokenMetaUpdated(name, symbol);
    }

    /**
     * @notice Get the number of tokens `spender` is approved to spend on behalf of `account`
     * @param account The address of the account holding the funds
     * @param spender The address of the account spending the funds
     * @return The number of tokens approved
     */
    function allowance(address account, address spender) external view returns (uint) {
        return allowances[account][spender];
    }

    /**
     * @notice Approve `spender` to transfer up to `amount` from `src`
     * @dev This will overwrite the approval amount for `spender`
     *  and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)
     * @param spender The address of the account which may transfer tokens
     * @param amount The number of tokens that are approved (2^256-1 means infinite)
     * @return Whether or not the approval succeeded
     */
    function approve(address spender, uint amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Triggers an approval from owner to spends
     * @param owner The address to approve from
     * @param spender The address to be approved
     * @param amount The number of tokens that are approved (2^256-1 means infinite)
     * @param deadline The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function permit(address owner, address spender, uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
        bytes32 domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), _getChainId(), address(this)));
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, nonces[owner]++, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "Arch::permit: invalid signature");
        require(signatory == owner, "Arch::permit: unauthorized");
        require(block.timestamp <= deadline, "Arch::permit: signature expired");

        allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    /**
     * @notice Get the number of tokens held by the `account`
     * @param account The address of the account to get the balance of
     * @return The number of tokens held
     */
    function balanceOf(address account) external view returns (uint) {
        return balances[account];
    }

    /**
     * @notice Transfer `amount` tokens from `msg.sender` to `dst`
     * @param dst The address of the destination account
     * @param amount The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transfer(address dst, uint amount) external returns (bool) {
        _transferTokens(msg.sender, dst, amount);
        return true;
    }

    /**
     * @notice Transfer `amount` tokens from `src` to `dst`
     * @param src The address of the source account
     * @param dst The address of the destination account
     * @param amount The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transferFrom(address src, address dst, uint amount) external returns (bool) {
        address spender = msg.sender;
        uint256 spenderAllowance = allowances[src][spender];

        if (spender != src && spenderAllowance != uint256(-1)) {
            uint256 newAllowance = spenderAllowance.sub(amount);
            allowances[src][spender] = newAllowance;

            emit Approval(src, spender, newAllowance);
        }

        _transferTokens(src, dst, amount);
        return true;
    }

    function _transferTokens(address src, address dst, uint256 amount) internal {
        require(src != address(0), "Arch::_transferTokens: cannot transfer from the zero address");
        require(dst != address(0), "Arch::_transferTokens: cannot transfer to the zero address");

        balances[src] = balances[src].sub(amount);
        balances[dst] = balances[dst].add(amount);
        emit Transfer(src, dst, amount);
    }

    function _getChainId() internal pure returns (uint) {
        uint256 chainId;
        assembly { chainId := chainid() }
        return chainId;
    }
}