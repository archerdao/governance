[![MythXBadge](https://badgen.net/https/api.mythx.io/v1/projects/d39258a9-1656-4b0f-867d-d67d0632c976/badge/data?cache=300&icon=https://raw.githubusercontent.com/ConsenSys/mythx-github-badge/main/logo_white.svg)](https://docs.mythx.io/dashboard/github-badges)
[![Discord](https://img.shields.io/discord/761540124940697600?color=blue&label=Discord&logo=Discord)](https://discord.com/channels/761540124940697600/761540124940697604)

# Contract Overview

Archer DAO is a series of Ethereum smart contracts governed by ARCH token holders.

The initial set of smart contracts form the base for controlling product decisions and configurations for the broader Archer product.

Archer DAO is intended to follow the principles of progressive decentralization. From the moment ARCH tokens are deployed, ARCH token holders may join private communication channels and use tokens to signal preferences on governance decisions. Additional smart contracts may be developed and deployed by the community in the future.


# Smart Contracts

The initial set of smart contracts deployed for Archer DAO:
- ARCH Token Contract
- Supply Manager Contract
- Token Vesting Contract
- Voting Power Prism (Proxy)
- Voting Power Implementation Contract
- Multisend
- Vault
- Token Registry
- Lock Manager
- Rewards Manager


## ARCH Token

The ARCH token is ERC-20 compliant, with add-ons to allow for offchain signing for approvals + transfers (see [EIP-712](https://eips.ethereum.org/EIPS/eip-712), [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612), and [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009)). The contract is not upgradable and uses immutable logic. The immutable logic includes configurations for modifying total supply and token metadata.

Supply changes must be initiated by a **supplyManager** address (see _Supply Manager_, below). The configurations are restricted to hardcoded limits with the following default values:
- Time between supply changes (mints/burns): `365 days` (min. 90 days)
- Maximum inflation per mint: `2%` (min. 0%; max 6.5%)

Token metadata changes (name and symbol) must be initiated by a **metadataManager** address.
- Manager: `Team Multisig`


## Supply Manager

The Supply Manager contract controls the configurable values for the ARCH token supply.
- Admin: `Team Multisig`

All decisions made by the Supply Manager are enacted via propose/accept scheme, where proposals have a minimum waiting period (i.e. timelock) before they can be accepted.  Proposals can be canceled at any time by the admin (resetting the waiting period for new proposals of that type).

Initially the proposal length is set to:
- Proposal length: `30 days` (min 7 days)

The community may develop and deploy a replacement Supply Manager contract in the future. It is **not** possible for the Supply Manager contract to circumvent any hardcoded limits in the ARCH token.


## Token Vesting

The Token Vesting contract allows early investors, team members and other Grant recipients to claim unlocked tokens according to individual vesting schedules. Accounts with token balances in this contract receive Voting Power (see _Voting Power Proxy_, below).

The Token Vesting contract stores vesting tokens and distributes vested tokens. Vesting is linear and continuous, with an optional cliff. Vested balances may only be claimed by the Grant recipient.

Grants are initiated with the following parameters:
- Recipient
- Start time
- Token balance
- Vesting duration (days)
- Cliff duration (days)

Each account may have a maximum of one active Grant.

The contract owner is the only account which may create new Grants.


## Voting Power Prism (Proxy)

The Voting Power Prism proxy contract keeps track of how many votes each DAO member has.

Voting Power increases when tokens are staked. Voting Power decreases when tokens are unstaked. Balances in the Token Vesting contract are considered staked for the purpose of Voting Power calculations.

Voting Power snapshots are stored following the Diamond Storage technique outlined by the Diamond Standard (see [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535)). This ensures that snapshots remain available even if the underlying logic to form snapshots changes. Additional contracts may be developed and deployed by the community to modify how Voting Power is tracked.


## Voting Power Implementation Contract

The Voting Power Implementation contract determines how votes are recorded for snapshots.

Initially, the ARCH token is used to calculate Voting Power. This contract may be redeployed to allow for extended functionality, such as delegation or accepting additional tokens.

## Multisend

Multisend is a simple contract that allows the sender to transfer multiple token balances in one transaction.

## Vault

Vaults are used to lock up multiple token balances per user for a given period of time - optionally providing voting power

## Token Registry

The Token Registry contract maintains a list of "Token Formula" contracts that are used to convert token amounts to their corresponding voting power within Archer DAO

## Lock Manager

Lock Manager keeps track of tokens that are locked up within the Archer ecosystem (somewhere other than in the Voting Power Prism) and the resulting voting power from these locked balances.

Special contracts with the "LOCKER_ROLE" role are in charge of maintaining these locked balances and calling the functions to add or remove voting power

## Rewards Manager

The Rewards Manager is responsible for distributing ARCH (and optionally, SUSHI) rewards to users who provide ARCH liquidity to approved markets or otherwise benefit the  Archer Network as decided by the DAO
