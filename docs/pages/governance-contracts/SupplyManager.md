## `SupplyManager`

Responsible for enacting decisions related to ARCH token supply

Decisions are made via a timelocked propose/accept scheme

Initial proposal length (timelock) is 30 days

# Functions:

- [`constructor(address _token, address _admin)`](#SupplyManager-constructor-address-address-)

- [`proposeMint(address dst, uint256 amount)`](#SupplyManager-proposeMint-address-uint256-)

- [`cancelMint()`](#SupplyManager-cancelMint--)

- [`acceptMint()`](#SupplyManager-acceptMint--)

- [`proposeBurn(address src, uint256 amount)`](#SupplyManager-proposeBurn-address-uint256-)

- [`cancelBurn()`](#SupplyManager-cancelBurn--)

- [`acceptBurn()`](#SupplyManager-acceptBurn--)

- [`proposeMintCap(uint16 newCap)`](#SupplyManager-proposeMintCap-uint16-)

- [`cancelMintCap()`](#SupplyManager-cancelMintCap--)

- [`acceptMintCap()`](#SupplyManager-acceptMintCap--)

- [`proposeSupplyChangeWaitingPeriod(uint32 newPeriod)`](#SupplyManager-proposeSupplyChangeWaitingPeriod-uint32-)

- [`cancelWaitingPeriod()`](#SupplyManager-cancelWaitingPeriod--)

- [`acceptSupplyChangeWaitingPeriod()`](#SupplyManager-acceptSupplyChangeWaitingPeriod--)

- [`proposeSupplyManager(address newSupplyManager)`](#SupplyManager-proposeSupplyManager-address-)

- [`cancelSupplyManager()`](#SupplyManager-cancelSupplyManager--)

- [`acceptSupplyManager()`](#SupplyManager-acceptSupplyManager--)

- [`proposeNewProposalLength(uint32 newLength)`](#SupplyManager-proposeNewProposalLength-uint32-)

- [`cancelProposalLength()`](#SupplyManager-cancelProposalLength--)

- [`acceptProposalLength()`](#SupplyManager-acceptProposalLength--)

- [`proposeAdmin(address newAdmin)`](#SupplyManager-proposeAdmin-address-)

- [`cancelAdmin()`](#SupplyManager-cancelAdmin--)

- [`acceptAdmin()`](#SupplyManager-acceptAdmin--)

# Events:

- [`AdminProposed(address oldAdmin, address newAdmin, uint256 eta)`](#SupplyManager-AdminProposed-address-address-uint256-)

- [`AdminCanceled(address proposedAdmin)`](#SupplyManager-AdminCanceled-address-)

- [`AdminAccepted(address oldAdmin, address newAdmin)`](#SupplyManager-AdminAccepted-address-address-)

- [`MintProposed(uint256 amount, address recipient, uint256 oldSupply, uint256 newSupply, uint256 eta)`](#SupplyManager-MintProposed-uint256-address-uint256-uint256-uint256-)

- [`MintCanceled(uint256 amount, address recipient)`](#SupplyManager-MintCanceled-uint256-address-)

- [`MintAccepted(uint256 amount, address recipient, uint256 oldSupply, uint256 newSupply)`](#SupplyManager-MintAccepted-uint256-address-uint256-uint256-)

- [`BurnProposed(uint256 amount, address source, uint256 oldSupply, uint256 newSupply, uint256 eta)`](#SupplyManager-BurnProposed-uint256-address-uint256-uint256-uint256-)

- [`BurnCanceled(uint256 amount, address source)`](#SupplyManager-BurnCanceled-uint256-address-)

- [`BurnAccepted(uint256 amount, address source, uint256 oldSupply, uint256 newSupply)`](#SupplyManager-BurnAccepted-uint256-address-uint256-uint256-)

- [`MintCapProposed(uint16 oldCap, uint16 newCap, uint256 eta)`](#SupplyManager-MintCapProposed-uint16-uint16-uint256-)

- [`MintCapCanceled(uint16 proposedCap)`](#SupplyManager-MintCapCanceled-uint16-)

- [`MintCapAccepted(uint16 oldCap, uint16 newCap)`](#SupplyManager-MintCapAccepted-uint16-uint16-)

- [`WaitingPeriodProposed(uint32 oldWaitingPeriod, uint32 newWaitingPeriod, uint256 eta)`](#SupplyManager-WaitingPeriodProposed-uint32-uint32-uint256-)

- [`WaitingPeriodCanceled(uint32 proposedWaitingPeriod)`](#SupplyManager-WaitingPeriodCanceled-uint32-)

- [`WaitingPeriodAccepted(uint32 oldWaitingPeriod, uint32 newWaitingPeriod)`](#SupplyManager-WaitingPeriodAccepted-uint32-uint32-)

- [`SupplyManagerProposed(address oldSupplyManager, address newSupplyManager, uint256 eta)`](#SupplyManager-SupplyManagerProposed-address-address-uint256-)

- [`SupplyManagerCanceled(address proposedSupplyManager)`](#SupplyManager-SupplyManagerCanceled-address-)

- [`SupplyManagerAccepted(address oldSupplyManager, address newSupplyManager)`](#SupplyManager-SupplyManagerAccepted-address-address-)

- [`ProposalLengthProposed(uint32 oldProposalLength, uint32 newProposalLength, uint256 eta)`](#SupplyManager-ProposalLengthProposed-uint32-uint32-uint256-)

- [`ProposalLengthCanceled(uint32 proposedProposalLength)`](#SupplyManager-ProposalLengthCanceled-uint32-)

- [`ProposalLengthAccepted(uint32 oldProposalLength, uint32 newProposalLength)`](#SupplyManager-ProposalLengthAccepted-uint32-uint32-)

# Function `constructor(address _token, address _admin)` {#SupplyManager-constructor-address-address-}

Construct a new supply manager

## Parameters:

- `_token`: The address for the token

- `_admin`: The admin account for this contract

# Function `proposeMint(address dst, uint256 amount)` {#SupplyManager-proposeMint-address-uint256-}

Propose a new token mint

## Parameters:

- `dst`: The address of the destination account

- `amount`: The number of tokens to be minted

# Function `cancelMint()` {#SupplyManager-cancelMint--}

Cancel proposed token mint

# Function `acceptMint()` {#SupplyManager-acceptMint--}

Accept proposed token mint

# Function `proposeBurn(address src, uint256 amount)` {#SupplyManager-proposeBurn-address-uint256-}

Propose a new token burn

## Parameters:

- `src`: The address of the account that will burn tokens

- `amount`: The number of tokens to be burned

# Function `cancelBurn()` {#SupplyManager-cancelBurn--}

Cancel proposed token burn

# Function `acceptBurn()` {#SupplyManager-acceptBurn--}

Accept proposed token burn

# Function `proposeMintCap(uint16 newCap)` {#SupplyManager-proposeMintCap-uint16-}

Propose change to the maximum amount of tokens that can be minted at once

## Parameters:

- `newCap`: The new mint cap in bips (10,000 bips = 1% of totalSupply)

# Function `cancelMintCap()` {#SupplyManager-cancelMintCap--}

Cancel proposed mint cap

# Function `acceptMintCap()` {#SupplyManager-acceptMintCap--}

Accept change to the maximum amount of tokens that can be minted at once

# Function `proposeSupplyChangeWaitingPeriod(uint32 newPeriod)` {#SupplyManager-proposeSupplyChangeWaitingPeriod-uint32-}

Propose change to the supply change waiting period

## Parameters:

- `newPeriod`: new waiting period

# Function `cancelWaitingPeriod()` {#SupplyManager-cancelWaitingPeriod--}

Cancel proposed waiting period

# Function `acceptSupplyChangeWaitingPeriod()` {#SupplyManager-acceptSupplyChangeWaitingPeriod--}

Accept change to the supply change waiting period

# Function `proposeSupplyManager(address newSupplyManager)` {#SupplyManager-proposeSupplyManager-address-}

Propose change to the supplyManager address

## Parameters:

- `newSupplyManager`: new supply manager address

# Function `cancelSupplyManager()` {#SupplyManager-cancelSupplyManager--}

Cancel proposed supply manager update

# Function `acceptSupplyManager()` {#SupplyManager-acceptSupplyManager--}

Accept change to the supplyManager address

# Function `proposeNewProposalLength(uint32 newLength)` {#SupplyManager-proposeNewProposalLength-uint32-}

Propose change to the proposal length

## Parameters:

- `newLength`: new proposal length

# Function `cancelProposalLength()` {#SupplyManager-cancelProposalLength--}

Cancel proposed update to proposal length

# Function `acceptProposalLength()` {#SupplyManager-acceptProposalLength--}

Accept change to the proposal length

# Function `proposeAdmin(address newAdmin)` {#SupplyManager-proposeAdmin-address-}

Propose a new admin

## Parameters:

- `newAdmin`: The address of the new admin

# Function `cancelAdmin()` {#SupplyManager-cancelAdmin--}

Cancel proposed admin change

# Function `acceptAdmin()` {#SupplyManager-acceptAdmin--}

Accept proposed admin

# Event `AdminProposed(address oldAdmin, address newAdmin, uint256 eta)` {#SupplyManager-AdminProposed-address-address-uint256-}

An event that's emitted when a new admin is proposed

# Event `AdminCanceled(address proposedAdmin)` {#SupplyManager-AdminCanceled-address-}

An event that's emitted when an admin proposal is canceled

# Event `AdminAccepted(address oldAdmin, address newAdmin)` {#SupplyManager-AdminAccepted-address-address-}

An event that's emitted when a new admin is accepted

# Event `MintProposed(uint256 amount, address recipient, uint256 oldSupply, uint256 newSupply, uint256 eta)` {#SupplyManager-MintProposed-uint256-address-uint256-uint256-uint256-}

An event that's emitted when a new mint is proposed

# Event `MintCanceled(uint256 amount, address recipient)` {#SupplyManager-MintCanceled-uint256-address-}

An event that's emitted when a mint proposal is canceled

# Event `MintAccepted(uint256 amount, address recipient, uint256 oldSupply, uint256 newSupply)` {#SupplyManager-MintAccepted-uint256-address-uint256-uint256-}

An event that's emitted when a new mint is accepted

# Event `BurnProposed(uint256 amount, address source, uint256 oldSupply, uint256 newSupply, uint256 eta)` {#SupplyManager-BurnProposed-uint256-address-uint256-uint256-uint256-}

An event that's emitted when a new burn is proposed

# Event `BurnCanceled(uint256 amount, address source)` {#SupplyManager-BurnCanceled-uint256-address-}

An event that's emitted when a burn proposal is canceled

# Event `BurnAccepted(uint256 amount, address source, uint256 oldSupply, uint256 newSupply)` {#SupplyManager-BurnAccepted-uint256-address-uint256-uint256-}

An event that's emitted when a new burn is accepted

# Event `MintCapProposed(uint16 oldCap, uint16 newCap, uint256 eta)` {#SupplyManager-MintCapProposed-uint16-uint16-uint256-}

An event that's emitted when a new mint cap is proposed

# Event `MintCapCanceled(uint16 proposedCap)` {#SupplyManager-MintCapCanceled-uint16-}

An event that's emitted when a mint cap proposal is canceled

# Event `MintCapAccepted(uint16 oldCap, uint16 newCap)` {#SupplyManager-MintCapAccepted-uint16-uint16-}

An event that's emitted when a new mint cap is accepted

# Event `WaitingPeriodProposed(uint32 oldWaitingPeriod, uint32 newWaitingPeriod, uint256 eta)` {#SupplyManager-WaitingPeriodProposed-uint32-uint32-uint256-}

An event that's emitted when a new waiting period is proposed

# Event `WaitingPeriodCanceled(uint32 proposedWaitingPeriod)` {#SupplyManager-WaitingPeriodCanceled-uint32-}

An event that's emitted when a waiting period proposal is canceled

# Event `WaitingPeriodAccepted(uint32 oldWaitingPeriod, uint32 newWaitingPeriod)` {#SupplyManager-WaitingPeriodAccepted-uint32-uint32-}

An event that's emitted when a new waiting period is accepted

# Event `SupplyManagerProposed(address oldSupplyManager, address newSupplyManager, uint256 eta)` {#SupplyManager-SupplyManagerProposed-address-address-uint256-}

An event that's emitted when a new supply manager is proposed

# Event `SupplyManagerCanceled(address proposedSupplyManager)` {#SupplyManager-SupplyManagerCanceled-address-}

An event that's emitted when a supply manager proposal is canceled

# Event `SupplyManagerAccepted(address oldSupplyManager, address newSupplyManager)` {#SupplyManager-SupplyManagerAccepted-address-address-}

An event that's emitted when a new supply manager is accepted

# Event `ProposalLengthProposed(uint32 oldProposalLength, uint32 newProposalLength, uint256 eta)` {#SupplyManager-ProposalLengthProposed-uint32-uint32-uint256-}

An event that's emitted when a new proposal length is proposed

# Event `ProposalLengthCanceled(uint32 proposedProposalLength)` {#SupplyManager-ProposalLengthCanceled-uint32-}

An event that's emitted when a proposal length proposal is canceled

# Event `ProposalLengthAccepted(uint32 oldProposalLength, uint32 newProposalLength)` {#SupplyManager-ProposalLengthAccepted-uint32-uint32-}

An event that's emitted when a new proposal length is accepted
