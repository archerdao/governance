## `ArchToken`

n circulation

    uint256 public totalSupply = 100_000_000e18; // 100 million

Address which may mint/burn tokens

    address public supplyManager;

Address whic

# Functions:

- [`constructor(address _metadataManager, address _supplyManager, uint256 _firstSupplyChangeAllowed)`](#ArchToken-constructor-address-address-uint256-)

- [`setSupplyManager(address newSupplyManager)`](#ArchToken-setSupplyManager-address-)

- [`setMetadataManager(address newMetadataManager)`](#ArchToken-setMetadataManager-address-)

- [`mint(address dst, uint256 amount)`](#ArchToken-mint-address-uint256-)

- [`burn(address src, uint256 amount)`](#ArchToken-burn-address-uint256-)

- [`setMintCap(uint16 newCap)`](#ArchToken-setMintCap-uint16-)

- [`setSupplyChangeWaitingPeriod(uint32 period)`](#ArchToken-setSupplyChangeWaitingPeriod-uint32-)

- [`updateTokenMetadata(string tokenName, string tokenSymbol)`](#ArchToken-updateTokenMetadata-string-string-)

- [`allowance(address account, address spender)`](#ArchToken-allowance-address-address-)

- [`approve(address spender, uint256 amount)`](#ArchToken-approve-address-uint256-)

- [`increaseAllowance(address spender, uint256 addedValue)`](#ArchToken-increaseAllowance-address-uint256-)

- [`decreaseAllowance(address spender, uint256 subtractedValue)`](#ArchToken-decreaseAllowance-address-uint256-)

- [`permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`](#ArchToken-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-)

- [`balanceOf(address account)`](#ArchToken-balanceOf-address-)

- [`transfer(address dst, uint256 amount)`](#ArchToken-transfer-address-uint256-)

- [`transferFrom(address src, address dst, uint256 amount)`](#ArchToken-transferFrom-address-address-uint256-)

- [`transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)`](#ArchToken-transferWithAuthorization-address-address-uint256-uint256-uint256-bytes32-uint8-bytes32-bytes32-)

- [`receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)`](#ArchToken-receiveWithAuthorization-address-address-uint256-uint256-uint256-bytes32-uint8-bytes32-bytes32-)

- [`getDomainSeparator()`](#ArchToken-getDomainSeparator--)

# Events:

- [`MintCapChanged(uint16 oldMintCap, uint16 newMintCap)`](#ArchToken-MintCapChanged-uint16-uint16-)

- [`SupplyManagerChanged(address oldManager, address newManager)`](#ArchToken-SupplyManagerChanged-address-address-)

- [`SupplyChangeWaitingPeriodChanged(uint32 oldWaitingPeriod, uint32 newWaitingPeriod)`](#ArchToken-SupplyChangeWaitingPeriodChanged-uint32-uint32-)

- [`MetadataManagerChanged(address oldManager, address newManager)`](#ArchToken-MetadataManagerChanged-address-address-)

- [`TokenMetaUpdated(string name, string symbol)`](#ArchToken-TokenMetaUpdated-string-string-)

- [`Transfer(address from, address to, uint256 value)`](#ArchToken-Transfer-address-address-uint256-)

- [`Approval(address owner, address spender, uint256 value)`](#ArchToken-Approval-address-address-uint256-)

- [`AuthorizationUsed(address authorizer, bytes32 nonce)`](#ArchToken-AuthorizationUsed-address-bytes32-)

# Function `constructor(address _metadataManager, address _supplyManager, uint256 _firstSupplyChangeAllowed)` {#ArchToken-constructor-address-address-uint256-}

emit Transfer(address(0), msg.sender, totalSupply);

        supplyChangeAllowedAfter = _firstSupplyChangeAllowed;

        supplyManager = _supplyManager;

        emit SupplyManagerChanged(address(0), _supplyManager);

        metadataManager = _metadataManager;

        emit MetadataManagerCha

# Function `setSupplyManager(address newSupplyManager) → bool` {#ArchToken-setSupplyManager-address-}

ress of the new metadata manager

## Return Values:

- true if successful

/

    function setMetadataManager(address newMetadataManager) external returns (bool) {

# Function `setMetadataManager(address newMetadataManager) → bool` {#ArchToken-setMetadataManager-address-}

e destination account

## Parameters:

- `amount`: The number of tokens to be minted

## Return Values:

- Boolean indicating success of mint

/

    function mint(address dst, ui

# Function `mint(address dst, uint256 amount) → bool` {#ArchToken-mint-address-uint256-}

ck.timestamp >= supplyChangeAllowedAfter, "Arch::mint: minting not allowed yet");

        // update the next supply change allowed timestamp

        supplyChangeAllowedAfter = block.timestamp.add(supplyC

# Function `burn(address src, uint256 amount) → bool` {#ArchToken-burn-address-uint256-}

wed yet");

        uint256 spenderAllowance = allowances[src][spender];

        // check allowance and reduce by amount

        if (spender != src && spenderAllowance != uint256(-1)) {

# Function `setMintCap(uint16 newCap) → bool` {#ArchToken-setMintCap-uint16-}

ng period

## Return Values:

- true if succssful

/

    function setSupplyChangeWaitingPeriod(uint32 period) external returns (bool) {

        require(msg.sender == supplyManager, "Arch::setSupplyChang

# Function `setSupplyChangeWaitingPeriod(uint32 period) → bool` {#ArchToken-setSupplyChangeWaitingPeriod-uint32-}

);

        supplyChangeWaitingPeriod = period;

        return true;

    }

    /**

Update the token name and symbol

## Parameters:

- `tokenName`: The ne

# Function `updateTokenMetadata(string tokenName, string tokenSymbol) → bool` {#ArchToken-updateTokenMetadata-string-string-}

he number of tokens `spender` is approved to spend on behalf of `account`

## Parameters:

- `account`: The address of the account holding the funds

- `spender`: The address of the account spending

# Function `allowance(address account, address spender) → uint256` {#ArchToken-allowance-address-address-}

and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)

It is recommended to use increaseAllowance and decreaseAllowance instead

## Parameters:

- `spender`: The address of the account which may transfer tokens

- `amount`: The number of tokens t

# Function `approve(address spender, uint256 amount) → bool` {#ArchToken-approve-address-uint256-}

256 amount) external returns (bool) {

        _approve(msg.sender, spender, amount);

        return true;

    }

    /**

Increase the allowance by a given amount

## Parameters:

- `spender`: Spender's address

- `addedValue`: Amount of increase in allowance

## Return Values:

- True if successful

/

    function increaseAllowance(address spender, uint256 addedValue)

        external

        returns (bool)

    {

        _increaseAllowance(msg.sender, spender, addedValue);

        return true;

    }

    /**

# Function `increaseAllowance(address spender, uint256 addedValue) → bool` {#ArchToken-increaseAllowance-address-uint256-}

return True if successful

/

    function decreaseAllowance(address spender, uint256 subtractedValue)

        external

        returns (bool)

    {

        _decreaseAllowance(msg.sender, spende

# Function `decreaseAllowance(address spender, uint256 subtractedValue) → bool` {#ArchToken-decreaseAllowance-address-uint256-}

ved

## Parameters:

- `value`: The number of tokens that are approved (2^256-1 means infinite)

- `deadline`: The time at which to expire the signature

- `v`: The recovery byte of the signature

# Function `permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` {#ArchToken-permit-address-address-uint256-uint256-uint8-bytes32-bytes32-}

2 s) external {

        require(deadline >= block.timestamp, "Arch::permit: signature expired");

        bytes32 encodeData = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline));

        _validateSignedData(owner, encodeData, v, r, s);

        _approve(owner, spender, value);

    }

    /**

Get the number of tokens held by the `account`

## Parameters:

- `account`: The address of the account to get the balance of

# Function `balanceOf(address account) → uint256` {#ArchToken-balanceOf-address-}

st, uint256 amount) external returns (bool) {

        _transferTokens(msg.sender, dst, amount);

        return true;

    }

    /**

Transfer `amount` tokens from `src` to

# Function `transfer(address dst, uint256 amount) → bool` {#ArchToken-transfer-address-uint256-}

No description

## Parameters:

- `amount`: The number of tokens to transfer

## Return Values:

- Whether or not the transfer succeeded

/

    function transferFrom(address src, address dst, uint256 amount) external returns (bool) {

        address spender = msg.send

# Function `transferFrom(address src, address dst, uint256 amount) → bool` {#ArchToken-transferFrom-address-address-uint256-}

nce = spenderAllowance.sub(

                amount,

                "Arch::transferFrom: transfer amount exceeds allowance"

            );

            allowances[src][spender] = newAllowance;

            emit Approval(src, spender, newAllowance);

        }

        _transferTokens(src,

# Function `transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)` {#ArchToken-transferWithAuthorization-address-address-uint256-uint256-uint256-bytes32-uint8-bytes32-bytes32-}

ress from,

        address to,

        uint256 value,

        uint256 validAfter,

        uint256 validBefore,

        bytes32 nonce,

        uint8 v,

        bytes32 r,

        bytes32 s

    )

        external

    {

        require(block.timestamp > validAfter, "Arch::transferWithAuth: auth not yet valid");

        require(block.timestamp < validBefore, "Arch::transferWithAuth: auth expired");

        require(!authorizationState[from][nonce],  "Arch::transferWithAuth: auth already used");

        bytes32 encodeData =

# Function `receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)` {#ArchToken-receiveWithAuthorization-address-address-uint256-uint256-uint256-bytes32-uint8-bytes32-bytes32-}

No description

## Parameters:

- `r`: r of the signature

- `s`: s of the signature

/

    function receiveWithAuthorization(

        address from,

        address to,

        uint256 value,

        uint256 validAfter,

        uint256 validBefore,

        bytes32 nonce,

        uint8 v,

        bytes32 r,

        bytes32 s

    ) external {

        require(to == msg.sender, "Arch::receiveWithAuth: caller must be the payee");

        require(block.timestamp > validAfter, "Arch::receiveWithAuth: auth not yet valid");

        require(block.timestamp < validBefore, "Arch::receiveWithAuth: auth expired");

        require(!authorizationState[from][nonce],  "Arc

# Function `getDomainSeparator() → bytes32` {#ArchToken-getDomainSeparator--}

No description

## Parameters:

- `v`: The recovery byte of the signature

- `r`: Half of t

# Event `MintCapChanged(uint16 oldMintCap, uint16 newMintCap)` {#ArchToken-MintCapChanged-uint16-uint16-}

r address is changed

    event MetadataManagerChanged(address i

# Event `SupplyManagerChanged(address oldManager, address newManager)` {#ArchToken-SupplyManagerChanged-address-address-}

ed when the token name and symbol are changed

    event TokenMetaUpdated(stri

# Event `SupplyChangeWaitingPeriodChanged(uint32 oldWaitingPeriod, uint32 newWaitingPeriod)` {#ArchToken-SupplyChangeWaitingPeriodChanged-uint32-uint32-}

event Transfer(address indexed from, address indexed to, uint256 value);

# Event `MetadataManagerChanged(address oldManager, address newManager)` {#ArchToken-MetadataManagerChanged-address-address-}

nt256 value);

An event that's emitted whenever an authorized t

# Event `TokenMetaUpdated(string name, string symbol)` {#ArchToken-TokenMetaUpdated-string-string-}

/**

Construct a new Arch token

# Event `Transfer(address from, address to, uint256 value)` {#ArchToken-Transfer-address-address-uint256-}

Manager The address with minting ability

# Event `Approval(address owner, address spender, uint256 value)` {#ArchToken-Approval-address-address-uint256-}

e may occur

/

    constructor(address _m

# Event `AuthorizationUsed(address authorizer, bytes32 nonce)` {#ArchToken-AuthorizationUsed-address-bytes32-}

ire(_firstSupplyChangeAllowed >= block.timestamp, "Arch::constructor: mint
