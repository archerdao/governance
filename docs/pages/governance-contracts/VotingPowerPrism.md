## `VotingPowerPrism`

Storage for voting power is at this address, while execution is delegated to the prism proxy implementation contract

All contracts that use voting power should reference this contract.

# Functions:

- [`constructor()`](#VotingPowerPrism-constructor--)

- [`receive()`](#VotingPowerPrism-receive--)

- [`fallback()`](#VotingPowerPrism-fallback--)

# Function `constructor()` {#VotingPowerPrism-constructor--}

Construct a new Voting Power Prism Proxy

Sets initial proxy admin to msg.sender

# Function `receive()` {#VotingPowerPrism-receive--}

Forwards call to implementation contract

# Function `fallback()` {#VotingPowerPrism-fallback--}

Forwards call to implementation contract
