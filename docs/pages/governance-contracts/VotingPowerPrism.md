## `VotingPowerPrism`

Storage for voting power is at this address, while execution is delegated to the prism proxy implementation contract

All contracts that use voting power should reference this contract.

# Functions:

- [`constructor(address _admin)`](#VotingPowerPrism-constructor-address-)

- [`receive()`](#VotingPowerPrism-receive--)

- [`fallback()`](#VotingPowerPrism-fallback--)

# Function `constructor(address _admin)` {#VotingPowerPrism-constructor-address-}

Construct a new Voting Power Prism Proxy

Sets initial proxy admin to `_admin`

## Parameters:

- `_admin`: Initial proxy admin

# Function `receive()` {#VotingPowerPrism-receive--}

Forwards call to implementation contract

# Function `fallback()` {#VotingPowerPrism-fallback--}

Forwards call to implementation contract
