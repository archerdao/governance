import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import {ethers} from 'ethers';

import VestingABI from '../contracts/Vesting';
import DeployedVestingAddresses from '../contracts/DeployedVestingAddresses';

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
    tokenGrant: null,
    tokenGrantAdmin: null,
    tokenGrantTxs: null,
    loadingVestingSchedules: true,
    admins: [
      ethers.utils.getAddress('0x818Ff73A5d881C27A945bE944973156C01141232'),
      ethers.utils.getAddress('0xFd90411B0c246743aE0000BB18c723A3BB909Dee'),
    ],
  },
  mutations: {
    setAccount(state, account) {
      state.account = account;
    },
    setContracts(state, contracts) {
      state.contracts = contracts;
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

      commit('setContracts', {vestingContract});
      dispatch('getTokenGrantsForUser');
    },
    async getTokenGrantsForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {vestingContract} = state.contracts;

        const tokenGrant = await vestingContract.getTokenGrant(state.account);
        const totalDue = await vestingContract.calculateGrantClaim(state.account);

        commit('setTokenGrant', mapGrant(tokenGrant, totalDue));
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
    loadingVestingSchedules: (state) => state.loadingVestingSchedules,
  },
});
