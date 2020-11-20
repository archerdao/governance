## `Vault`

Contract for locking up tokens for set periods of time

Tokens locked in this contract DO NOT count towards voting power

# Functions:

- [`lockTokens(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays)`](#Vault-lockTokens-address-address-address-uint256-uint256-uint16-)

- [`lockTokensWithPermit(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays, uint256 deadline, uint8 v, bytes32 r, bytes32 s)`](#Vault-lockTokensWithPermit-address-address-address-uint256-uint256-uint16-uint256-uint8-bytes32-bytes32-)

- [`getActiveLocks(address receiver)`](#Vault-getActiveLocks-address-)

- [`getTokenLock(uint256 lockId)`](#Vault-getTokenLock-uint256-)

- [`getAllActiveLocks(address receiver)`](#Vault-getAllActiveLocks-address-)

- [`getLockedTokenBalance(address token, address receiver)`](#Vault-getLockedTokenBalance-address-address-)

- [`getUnlockedTokenBalance(address token, address receiver)`](#Vault-getUnlockedTokenBalance-address-address-)

- [`getLockedBalance(uint256 lockId)`](#Vault-getLockedBalance-uint256-)

- [`getUnlockedBalance(uint256 lockId)`](#Vault-getUnlockedBalance-uint256-)

- [`claimAllUnlockedTokens(uint256 lockId)`](#Vault-claimAllUnlockedTokens-uint256-)

- [`claimUnlockedTokens(uint256 lockId, uint256 amount)`](#Vault-claimUnlockedTokens-uint256-uint256-)

- [`extendLock(uint256 lockId, uint16 daysToAdd)`](#Vault-extendLock-uint256-uint16-)

# Events:

- [`LockCreated(address token, address locker, address receiver, uint256 amount, uint256 startTime, uint16 durationInDays, uint256 lockId)`](#Vault-LockCreated-address-address-address-uint256-uint256-uint16-uint256-)

- [`UnlockedTokensClaimed(address receiver, address token, uint256 amountClaimed, uint256 lockId)`](#Vault-UnlockedTokensClaimed-address-address-uint256-uint256-)

- [`LockExtended(uint16 oldDuration, uint16 newDuration, uint256 startTime, uint256 lockId)`](#Vault-LockExtended-uint16-uint16-uint256-uint256-)

# Function `lockTokens(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays)` {#Vault-lockTokens-address-address-address-uint256-uint256-uint16-}

Lock tokens

## Parameters:

- `locker`: The account that is locking tokens

- `receiver`: The account that will be able to retrieve unlocked tokens

- `startTime`: The unix timestamp when the lock period will start

- `amount`: The amount of tokens being locked

- `lockDurationInDays`: The lock period in days

# Function `lockTokensWithPermit(address token, address locker, address receiver, uint256 startTime, uint256 amount, uint16 lockDurationInDays, uint256 deadline, uint8 v, bytes32 r, bytes32 s)` {#Vault-lockTokensWithPermit-address-address-address-uint256-uint256-uint16-uint256-uint8-bytes32-bytes32-}

Lock tokens

## Parameters:

- `token`: Address of token to lock

- `locker`: The account that is locking tokens

- `receiver`: The account that will be able to retrieve unlocked tokens

- `startTime`: The unix timestamp when the lock period will start

- `amount`: The amount of tokens being locked

- `lockDurationInDays`: The lock period in days

- `deadline`: The time at which to expire the signature

- `v`: The recovery byte of the signature

- `r`: Half of the ECDSA signature pair

- `s`: Half of the ECDSA signature pair

# Function `getActiveLocks(address receiver) → uint256[]` {#Vault-getActiveLocks-address-}

Get token locks for receiver

## Parameters:

- `receiver`: The address that has locked balances

## Return Values:

- the lock ids

# Function `getTokenLock(uint256 lockId) → struct Vault.Lock` {#Vault-getTokenLock-uint256-}

Get token lock for given lock id

## Parameters:

- `lockId`: The ID for the locked balance

## Return Values:

- the lock

# Function `getAllActiveLocks(address receiver) → struct Vault.Lock[] receiverLocks` {#Vault-getAllActiveLocks-address-}

Get all active token locks for receiver

## Parameters:

- `receiver`: The address that has locked balances

## Return Values:

- receiverLocks the lock ids

# Function `getLockedTokenBalance(address token, address receiver) → uint256 lockedBalance` {#Vault-getLockedTokenBalance-address-address-}

Get total locked token balance of receiver

## Parameters:

- `token`: The token to check

- `receiver`: The address that has locked balances

## Return Values:

- lockedBalance the total amount of `token` locked

# Function `getUnlockedTokenBalance(address token, address receiver) → uint256 unlockedBalance` {#Vault-getUnlockedTokenBalance-address-address-}

Get total unlocked token balance of receiver

## Parameters:

- `token`: The token to check

- `receiver`: The address that has unlocked balances

## Return Values:

- unlockedBalance the total amount of `token` unlocked

# Function `getLockedBalance(uint256 lockId) → uint256` {#Vault-getLockedBalance-uint256-}

Get locked balance for a given lock id

Returns 0 if duration has ended

## Parameters:

- `lockId`: The lock ID

## Return Values:

- The amount that is locked

# Function `getUnlockedBalance(uint256 lockId) → uint256` {#Vault-getUnlockedBalance-uint256-}

Get unlocked balance for a given lock id

Returns 0 if duration has not ended

## Parameters:

- `lockId`: The lock ID

## Return Values:

- The amount that can be claimed

# Function `claimAllUnlockedTokens(uint256 lockId)` {#Vault-claimAllUnlockedTokens-uint256-}

Allows receiver to claim all of their unlocked tokens for a given lock

Errors if no tokens are unlocked

It is advised receivers check they are entitled to claim via `getUnlockedBalance` before calling this

## Parameters:

- `lockId`: The lock id for an unlocked token balance

# Function `claimUnlockedTokens(uint256 lockId, uint256 amount)` {#Vault-claimUnlockedTokens-uint256-uint256-}

Allows receiver to claim a portion of their unlocked tokens for a given lock

Errors if no tokens are unlocked

It is advised receivers check they are entitled to claim via `getUnlockedBalance` before calling this

## Parameters:

- `lockId`: The lock id for an unlocked token balance

- `amount`: The amount of unlocked tokens to claim

# Function `extendLock(uint256 lockId, uint16 daysToAdd)` {#Vault-extendLock-uint256-uint16-}

Allows receiver extend lock period for a given lock

## Parameters:

- `lockId`: The lock id for a locked token balance

- `daysToAdd`: The number of days to add to duration

# Event `LockCreated(address token, address locker, address receiver, uint256 amount, uint256 startTime, uint16 durationInDays, uint256 lockId)` {#Vault-LockCreated-address-address-address-uint256-uint256-uint16-uint256-}

Event emitted when a new lock is created

# Event `UnlockedTokensClaimed(address receiver, address token, uint256 amountClaimed, uint256 lockId)` {#Vault-UnlockedTokensClaimed-address-address-uint256-uint256-}

Event emitted when tokens are claimed by a receiver from an unlocked balance

# Event `LockExtended(uint16 oldDuration, uint16 newDuration, uint256 startTime, uint256 lockId)` {#Vault-LockExtended-uint16-uint16-uint256-uint256-}

Event emitted when lock duration extended
