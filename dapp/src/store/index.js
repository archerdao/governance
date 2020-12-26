import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import {ethers} from 'ethers';

import TokenABI from '../contracts/VestingToken';
import VestingABI from '../contracts/Vesting';
import VotingPowerABI from '../contracts/VotingPower';

import DeployedVestingAddresses from '../contracts/DeployedVestingAddresses';
import DeployedVestingTokenAddresses from '../contracts/DeployedVestingTokenAddresses';
import DeployedVotingPowerPrismAddresses from '../contracts/DeployedVotingPowerPrismAddresses';

import {initOnboard, initNotify} from '@/services/BlocknativeServices';

let provider;
const onboard = initOnboard({
  wallet: (wallet) => {
    provider = new ethers.providers.Web3Provider(wallet.provider);
  },
});

const notify = initNotify();

const mapGrant = (tokenGrant, totalDue) => {
  return {
    startTime: tokenGrant.startTime.toString(),
    amount: ethers.utils.formatEther(tokenGrant.amount),
    vestingDuration: tokenGrant.vestingDuration.toString(),
    vestingCliff: tokenGrant.vestingCliff.toString(),
    totalClaimed: ethers.utils.formatEther(tokenGrant.totalClaimed),
    totalDue: ethers.utils.formatEther(totalDue),
  };
};

export default new Vuex.Store({
  state: {
    account: null,
    approvedBalance: null,
    contracts: null,
    stakedBalance: null,
    stakeWithPermit: null,
    tokenBalance: null,
    tokenGrant: null,
    tokenGrantAdmin: null,
    tokenGrantTxs: null,
    votingPower: null,
    loadingVestingSchedules: true,
    admins: [
      ethers.utils.getAddress('0x818Ff73A5d881C27A945bE944973156C01141232'),
      ethers.utils.getAddress('0xFd90411B0c246743aE0000BB18c723A3BB909Dee'),
      ethers.utils.getAddress('0x612B33827A46b50bCF13e8Ab0E70fa020e6D8933'),
    ],
  },
  mutations: {
    setAccount(state, account) {
      state.account = account;
    },
    setApprovedBalance(state, approvedBalance) {
      state.approvedBalance = approvedBalance;
    },
    setContracts(state, contracts) {
      state.contracts = contracts;
    },
    setStakedBalance(state, stakedBalance) {
      state.stakedBalance = stakedBalance;
    },
    setStakeWithPermit(state, stakeWithPermit) {
      state.stakeWithPermit = stakeWithPermit;
    },
    setTokenBalance(state, tokenBalance) {
      state.tokenBalance = tokenBalance;
    },
    setTokenGrant(state, tokenGrant) {
      state.tokenGrant = tokenGrant;
    },
    setTokenGrantAdmin(state, tokenGrantAdmin) {
      state.tokenGrantAdmin = tokenGrantAdmin;
    },
    setTokenGrantTxs(state, tokenGrantTxs) {
      state.tokenGrantTxs = tokenGrantTxs;
    },
    setVotingPower(state, votingPower) {
      state.votingPower = votingPower;
    },
  },
  actions: {
    async bootstrap({dispatch, commit}, {onSuccessCallback}) {

      await onboard.walletSelect();

      const readyToTransact = await onboard.walletCheck();

      if (readyToTransact) {
        const onboardState = onboard.getState();
        commit('setAccount', onboardState.address);
        await dispatch('setupContracts');

        if (onSuccessCallback) {
          onSuccessCallback();
        }
      }
    },
    async disconnect({commit}) {
      commit('setAccount', null);
      commit('setApprovedBalance', null);
      commit('setStakedBalance', null);
      commit('setStakeWithPermit', null);
      commit('setTokenGrant', null);
      commit('setTokenBalance', null);
      commit('setVotingPower', null);
    },
    async setupContracts({commit, dispatch}) {
      const signer = provider.getSigner();
      const chain = await provider.getNetwork();

      const vestingContractAddress = DeployedVestingAddresses[chain.chainId.toString()];
      const vestingContract = new ethers.Contract(
        vestingContractAddress,
        VestingABI,
        signer
      );

      const votingPowerPrismContractAddress = DeployedVotingPowerPrismAddresses[chain.chainId.toString()];
      const votingPowerPrismContract = new ethers.Contract(
        votingPowerPrismContractAddress,
        VotingPowerABI,
        signer
      );

      const tokenContractAddress = DeployedVestingTokenAddresses[chain.chainId.toString()];
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        TokenABI,
        signer
      );

      commit('setContracts', {tokenContract, vestingContract, votingPowerPrismContract});
      dispatch('getTokenGrantsForUser');
      dispatch('getVotingPowerForUser');
      dispatch('getTokenBalanceForUser');
      dispatch('getStakedBalanceForUser');
      dispatch('getApprovedBalanceForUser');
    },
    async getVotingPowerForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {votingPowerPrismContract} = state.contracts;
        const votingPower = await votingPowerPrismContract.balanceOf(state.account);
        commit('setVotingPower', votingPower);
      }
    },
    async getTokenGrantsForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {vestingContract} = state.contracts;
        const tokenGrant = await vestingContract.getTokenGrant(state.account);
        const totalDue = await vestingContract.calculateGrantClaim(state.account);
        commit('setTokenGrant', mapGrant(tokenGrant, totalDue));
      }
    },
    async getApprovedBalanceForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {tokenContract, votingPowerPrismContract} = state.contracts;
        const approvedBalance = await tokenContract.allowance(
          state.account,
          votingPowerPrismContract.address
        );
        commit('setApprovedBalance', approvedBalance);
      }
    },
    async getStakedBalanceForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {votingPowerPrismContract} = state.contracts;
        const stakedBalance = await votingPowerPrismContract.getARCHAmountStaked(state.account);
        commit('setStakedBalance', stakedBalance);
      }
    },
    async getTokenBalanceForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {tokenContract} = state.contracts;
        const tokenBalance = await tokenContract.balanceOf(state.account);
        commit('setTokenBalance', tokenBalance);
      }
    },
    async getTokenGrantsForUserAdmin({state, commit}, address) {
      if (state.contracts && address) {

        if (!ethers.utils.isAddress(address)) return;

        const {vestingContract} = state.contracts;
        const tokenGrant = await vestingContract.getTokenGrant(address);
        const totalDue = await vestingContract.calculateGrantClaim(address);
        commit('setTokenGrantAdmin', mapGrant(tokenGrant, totalDue));
      }
    },
    async claim({state}) {
      if (state.contracts && state.account) {
        const {vestingContract} = state.contracts;
        try {
          const tx = await vestingContract.claimVestedTokens(state.account);
          await tx.wait(1);
          return true;
        }
        catch (err) {
          return false;
        }
      }
    },
    async approve({state}, stakeAmount) {
      // Approval function for EIP-712
      // Note: this solution uses provider.sent("eth_signTypedData_v4", ...)
      // instead of experimental _signTypedData.
      // See https://github.com/ethers-io/ethers.js/issues/298
      if (state.contracts && state.account) {
        const {tokenContract, votingPowerPrismContract} = state.contracts;
        const chain = await provider.getNetwork();

        const name = await tokenContract.name(); // token name
        const version = "1";
        const chainId = chain.chainId.toString();
        const verifyingContract = ethers.utils.getAddress(tokenContract.address);

        const nonce = await tokenContract.nonces(state.account);
        const deadline = parseInt(Date.now() / 1000) + 1200; // now plus 20 mins

        const domain = {
          name,
          version,
          chainId,
          verifyingContract
        };

        const types = {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ]
        };

        const value = {
          owner: ethers.utils.getAddress(state.account),
          spender: ethers.utils.getAddress(votingPowerPrismContract.address),
          value: stakeAmount.toString(),
          nonce: nonce.toString(),
          deadline: deadline.toString(),
        };

        const msgParams = JSON.stringify({
          types,
          domain,
          primaryType: "Permit",
          message: value,
        });

        const params = [state.account, msgParams];

        try {
          const signature = await provider.send("eth_signTypedData_v4", params);
          this.commit('setStakeWithPermit', {
            amount: stakeAmount.toString(),
            deadline: deadline.toString(),
            r: ethers.utils.arrayify("0x" + signature.substring(2).substring(0,64)),
            s: ethers.utils.arrayify("0x" + signature.substring(2).substring(64, 128)),
            v: parseInt(signature.substring(2).substring(128, 130), 16),
          });
          return true;
        }
        catch (err) {
          return false;
        }
      }
    },
    async stakeWithPermit({state}) {
      if (state.contracts && state.account && state.stakeWithPermit) {
        const {amount, deadline, v, r, s} = state.stakeWithPermit;

        const {votingPowerPrismContract} = state.contracts;
        try {
          const tx = await votingPowerPrismContract.stakeWithPermit(amount, deadline, v, r, s);
          await tx.wait(1);
          return true;
        }
        catch (err) {
          return false;
        }
      }
    },
    async withdraw({state}, unstakeAmount) {
      if (state.contracts && state.account) {
        const {votingPowerPrismContract} = state.contracts;
        try {
          const tx = await votingPowerPrismContract.withdraw(unstakeAmount);
          await tx.wait(1);
          return true;
        }
        catch (err) {
          return false;
        }
      }
    },
  },
  getters: {
    contracts: (state) => state.contracts,
    account: (state) => state.account,
    accountAdmin: (state) => state.account && state.admins.indexOf(ethers.utils.getAddress(state.account)) !== -1,
    approvedBalance: (state) => state.approvedBalance,
    tokenGrant: (state) => state.tokenGrant,
    tokenGrantAdmin: (state) => state.tokenGrantAdmin,
    tokenGrantTxs: (state) => state.tokenGrantTxs,
    votingPower: (state) => state.votingPower,
    stakeWithPermit: (state) => state.stakeWithPermit,
    stakedBalance: (state) => state.stakedBalance,
    tokenBalance: (state) => state.tokenBalance,
    loadingVestingSchedules: (state) => state.loadingVestingSchedules,
  },
});
