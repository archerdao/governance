import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import {ethers} from 'ethers';

import TokenABI from '../contracts/VestingToken';
import VestingABI from '../contracts/Vesting';
import VotingPowerABI from '../contracts/VotingPower';
// import VotingPowerPrismABI from '../contracts/VotingPowerPrism';

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
    contracts: null,
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
    setContracts(state, contracts) {
      state.contracts = contracts;
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
        const tx = await vestingContract.claimVestedTokens(state.account);

        await tx.wait(1);
      }
    },
  },
  getters: {
    contracts: (state) => state.contracts,
    account: (state) => state.account,
    accountAdmin: (state) => state.account && state.admins.indexOf(ethers.utils.getAddress(state.account)) !== -1,
    tokenGrant: (state) => state.tokenGrant,
    tokenGrantAdmin: (state) => state.tokenGrantAdmin,
    tokenGrantTxs: (state) => state.tokenGrantTxs,
    votingPower: (state) => state.votingPower,
    tokenBalance: (state) => state.tokenBalance,
    loadingVestingSchedules: (state) => state.loadingVestingSchedules,
  },
});
