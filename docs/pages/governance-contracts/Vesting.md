## `Vesting`

The vesting vault contract for the initial token sale

# Functions:

- [`constructor(address _token)`](#Vesting-constructor-address-)

- [`addTokenGrant(address recipient, uint256 startTime, uint256 amount, uint16 vestingDurationInDays, uint16 vestingCliffInDays)`](#Vesting-addTokenGrant-address-uint256-uint256-uint16-uint16-)

- [`getTokenGrant(address recipient)`](#Vesting-getTokenGrant-address-)

- [`calculateGrantClaim(address recipient)`](#Vesting-calculateGrantClaim-address-)

- [`vestedBalance(address recipient)`](#Vesting-vestedBalance-address-)

- [`claimedBalance(address recipient)`](#Vesting-claimedBalance-address-)

- [`claimVestedTokens(address recipient)`](#Vesting-claimVestedTokens-address-)

- [`tokensVestedPerDay(address recipient)`](#Vesting-tokensVestedPerDay-address-)

- [`setVotingPowerContract(address newContract)`](#Vesting-setVotingPowerContract-address-)

- [`changeOwner(address newOwner)`](#Vesting-changeOwner-address-)

# Events:

- [`GrantAdded(address recipient, uint256 amount, uint256 startTime, uint16 vestingDurationInDays, uint16 vestingCliffInDays)`](#Vesting-GrantAdded-address-uint256-uint256-uint16-uint16-)

- [`GrantTokensClaimed(address recipient, uint256 amountClaimed)`](#Vesting-GrantTokensClaimed-address-uint256-)

- [`ChangedOwner(address oldOwner, address newOwner)`](#Vesting-ChangedOwner-address-address-)

- [`ChangedVotingPower(address oldContract, address newContract)`](#Vesting-ChangedVotingPower-address-address-)

# Function `constructor(address _token)` {#Vesting-constructor-address-}

Construct a new Vesting contract

## Parameters:

- `_token`: Address of ARCH token

# Function `addTokenGrant(address recipient, uint256 startTime, uint256 amount, uint16 vestingDurationInDays, uint16 vestingCliffInDays)` {#Vesting-addTokenGrant-address-uint256-uint256-uint16-uint16-}

Add a new token grant

## Parameters:

- `recipient`: The address that is receiving the grant

- `startTime`: The unix timestamp when the grant will start

- `amount`: The amount of tokens being granted

- `vestingDurationInDays`: The vesting period in days

- `vestingCliffInDays`: The vesting cliff duration in days

# Function `getTokenGrant(address recipient) → struct Vesting.Grant` {#Vesting-getTokenGrant-address-}

Get token grant for recipient

## Parameters:

- `recipient`: The address that has a grant

## Return Values:

- the grant

# Function `calculateGrantClaim(address recipient) → uint256` {#Vesting-calculateGrantClaim-address-}

Calculate the vested and unclaimed tokens available for `recipient` to claim

Due to rounding errors once grant duration is reached, returns the entire left grant amount

Returns 0 if cliff has not been reached

## Parameters:

- `recipient`: The address that has a grant

## Return Values:

- The amount recipient can claim

# Function `vestedBalance(address recipient) → uint256` {#Vesting-vestedBalance-address-}

Calculate the vested (claimed + unclaimed) tokens for `recipient`

Returns 0 if cliff has not been reached

## Parameters:

- `recipient`: The address that has a grant

## Return Values:

- Total vested balance (claimed + unclaimed)

# Function `claimedBalance(address recipient) → uint256` {#Vesting-claimedBalance-address-}

The balance claimed by `recipient`

## Parameters:

- `recipient`: The address that has a grant

## Return Values:

- the number of claimed tokens by `recipient`

# Function `claimVestedTokens(address recipient)` {#Vesting-claimVestedTokens-address-}

Allows a grant recipient to claim their vested tokens

Errors if no tokens have vested

It is advised recipients check they are entitled to claim via `calculateGrantClaim` before calling this

## Parameters:

- `recipient`: The address that has a grant

# Function `tokensVestedPerDay(address recipient) → uint256` {#Vesting-tokensVestedPerDay-address-}

Calculate the number of tokens that will vest per day for the given recipient

## Parameters:

- `recipient`: The address that has a grant

## Return Values:

- Number of tokens that will vest per day

# Function `setVotingPowerContract(address newContract)` {#Vesting-setVotingPowerContract-address-}

Set voting power contract address

## Parameters:

- `newContract`: New voting power contract address

# Function `changeOwner(address newOwner)` {#Vesting-changeOwner-address-}

Change owner of vesting contract

## Parameters:

- `newOwner`: New owner address

# Event `GrantAdded(address recipient, uint256 amount, uint256 startTime, uint16 vestingDurationInDays, uint16 vestingCliffInDays)` {#Vesting-GrantAdded-address-uint256-uint256-uint16-uint16-}

Event emitted when a new grant is created

# Event `GrantTokensClaimed(address recipient, uint256 amountClaimed)` {#Vesting-GrantTokensClaimed-address-uint256-}

Event emitted when tokens are claimed by a recipient from a grant

# Event `ChangedOwner(address oldOwner, address newOwner)` {#Vesting-ChangedOwner-address-address-}

Event emitted when the owner of the vesting contract is updated

# Event `ChangedVotingPower(address oldContract, address newContract)` {#Vesting-ChangedVotingPower-address-address-}

Event emitted when the voting power contract referenced by the vesting contract is updated
