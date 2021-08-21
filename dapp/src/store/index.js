import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import {ethers} from 'ethers';

import FormulaABI from '../contracts/ArchFormula';
import MigratorABI from '../contracts/Migrator';
import PairABI from '../contracts/UniswapV2Pair';
import RegistryABI from '../contracts/TokenRegistry';
import RewardsManagerABI from '../contracts/RewardsManager';
import TokenABI from '../contracts/VestingToken';
import VaultABI from '../contracts/Vault';
import VestingABI from '../contracts/Vesting';
import VotingPowerABI from '../contracts/VotingPower';

import DeployedAddresses from '../contracts/Deployed';

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

const mapTokenLock = (tokenLock) => {
  return {
    id: tokenLock.id.toString(),
    startTime: tokenLock.lock.startTime.toString(),
    amount: ethers.utils.formatEther(tokenLock.lock.amount),
    vestingDuration: tokenLock.lock.vestingDurationInDays.toString(),
    vestingCliff: tokenLock.lock.cliffDurationInDays.toString(),
    totalClaimed: ethers.utils.formatEther(tokenLock.lock.amountClaimed),
    totalDue: ethers.utils.formatEther(tokenLock.claimableAmount),
  };
};

export default new Vuex.Store({
  state: {
    account: null,
    approvedBalances: null,
    contracts: null,
    depositWithPermit: null,
    pendingBalances: null,
    stakedBalances: null,
    stakeWithPermit: null,
    stakingTokenList: null,
    tokenBalances: null,
    tokenGrant: null,
    tokenGrants: null,
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
    setApprovedBalances(state, approvedBalances) {
      state.approvedBalances = approvedBalances;
    },
    setContracts(state, contracts) {
      state.contracts = contracts;
    },
    setDepositWithPermit(state, depositWithPermit) {
      state.depositWithPermit = depositWithPermit;
    },
    setPendingBalances(state, pendingBalances) {
      state.pendingBalances = pendingBalances;
    },
    setStakedBalances(state, stakedBalances) {
      state.stakedBalances = stakedBalances;
    },
    setStakeWithPermit(state, stakeWithPermit) {
      state.stakeWithPermit = stakeWithPermit;
    },
    setStakingTokenList(state, stakingTokenList) {
      state.stakingTokenList = stakingTokenList;
    },
    setTokenBalances(state, tokenBalances) {
      state.tokenBalances = tokenBalances;
    },
    setTokenGrant(state, tokenGrant) {
      state.tokenGrant = tokenGrant;
    },
    setTokenGrants(state, tokenGrants) {
      state.tokenGrants = tokenGrants;
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
      commit('setApprovedBalances', null);
      commit('setDepositWithPermit', null);
      commit('setPendingBalances', null);
      commit('setStakedBalances', null);
      commit('setStakeWithPermit', null);
      commit('setStakingTokenList', null);
      commit('setTokenGrant', null);
      commit('setTokenGrants', null);
      commit('setTokenBalances', null);
      commit('setVotingPower', null);
    },
    async setupContracts({commit, dispatch}) {
      const signer = provider.getSigner();
      const chain = await provider.getNetwork();

      const migratorContractAddress = DeployedAddresses.Migrator[chain.chainId.toString()];
      const migratorContract = new ethers.Contract(
        migratorContractAddress,
        MigratorABI,
        signer
      );

      const edenTokenAddress = DeployedAddresses.EDEN[chain.chainId.toString()];
      const edenTokenContract = new ethers.Contract(
        edenTokenAddress,
        TokenABI,
        signer
      );

      const rewardsManagerContractAddress = DeployedAddresses.RewardsManager[chain.chainId.toString()];
      const rewardsManagerContract = new ethers.Contract(
        rewardsManagerContractAddress,
        RewardsManagerABI,
        signer
      );

      const sushiTokenAddress = DeployedAddresses.SUSHI[chain.chainId.toString()];
      const sushiTokenContract = new ethers.Contract(
        sushiTokenAddress,
        TokenABI,
        signer
      );

      const sushiswapPairContractAddress = DeployedAddresses.SLP[chain.chainId.toString()];
      const sushiswapPairContract = new ethers.Contract(
        sushiswapPairContractAddress,
        PairABI,
        signer
      );

      const tokenContractAddress = DeployedAddresses.ARCH[chain.chainId.toString()];
      const tokenContract = new ethers.Contract(
        tokenContractAddress,
        TokenABI,
        signer
      );

      const tokenRegistryAddress = DeployedAddresses.TokenRegistry[chain.chainId.toString()];
      const tokenRegistryContract = new ethers.Contract(tokenRegistryAddress, RegistryABI, signer);

      const vaultContractAddress = DeployedAddresses.Vault[chain.chainId.toString()];
      const vaultContract = new ethers.Contract(vaultContractAddress, VaultABI, signer);

      const vestingContractAddress = DeployedAddresses.Vesting[chain.chainId.toString()];
      const vestingContract = new ethers.Contract(vestingContractAddress, VestingABI, signer);

      const votingPowerPrismContractAddress = DeployedAddresses.VotingPowerPrism[chain.chainId.toString()];
      const votingPowerPrismContract = new ethers.Contract(votingPowerPrismContractAddress, VotingPowerABI, signer);

      commit('setContracts', {
        edenTokenContract,
        migratorContract,
        rewardsManagerContract,
        sushiswapPairContract,
        sushiTokenContract,
        tokenRegistryContract,
        tokenContract, 
        vaultContract, 
        vestingContract, 
        votingPowerPrismContract
      });
      dispatch('getTokenGrantsForUser');
      dispatch('getVotingPowerForUser');
      dispatch('getTokenBalancesForUser');
      dispatch('getPendingBalancesForUser');
      dispatch('getStakedBalancesForUser');
      dispatch('getStakingTokenList');
      dispatch('getApprovedBalancesForUser');
    },
    async addToMetaMask({state}) {
      if (state.contracts) {
        try {
          let result = await window.ethereum?.request({
            method: "wallet_watchAsset",
            params: {
              type: "ERC20",
              options: {
                address: state.contracts.edenTokenContract.address,
                symbol: "EDEN",
                decimals: 18
              }
            }
          });
        }
        catch (err) {
          console.log(err);
        }
      }
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
        const {vaultContract, vestingContract} = state.contracts;
        const tokenGrant = await vestingContract.getTokenGrant(state.account);
        const totalDue = await vestingContract.calculateGrantClaim(state.account);

        let grants = []
        const activeLocks = await vaultContract.activeLockBalances(state.account);
        for (let lock of activeLocks) {
          grants.push(mapTokenLock(lock));
        }
        commit('setTokenGrant', mapGrant(tokenGrant, totalDue));
        commit('setTokenGrants', grants);
      }
    },
    async getApprovedBalancesForUser({state, commit}) {
      if (state.contracts && state.account) {
        const { sushiswapPairContract, tokenContract, rewardsManagerContract, votingPowerPrismContract, migratorContract } = state.contracts;
        let approvedBalances = {};
        approvedBalances[tokenContract.address] = await tokenContract.allowance(state.account, migratorContract.address);
        // approvedBalances[sushiswapPairContract.address] = await sushiswapPairContract.allowance(state.account, rewardsManagerContract.address);
        commit('setApprovedBalances', approvedBalances);
      }
    },
    async getPendingBalancesForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {rewardsManagerContract, sushiTokenContract, tokenContract} = state.contracts;
        let pendingBalances = [];
        let pid = 0; // Hardcoded RewardsManager PID
        pendingBalances.push({
          address: tokenContract.address,
          amount: await rewardsManagerContract.pendingRewardTokens(pid, state.account), // Includes claimable, plus vesting
          symbol: "ARCH"
        });
        pendingBalances.push({
          address: sushiTokenContract.address,
          amount: await rewardsManagerContract.pendingSushi(pid, state.account), // Includes only claimable, not vesting
          symbol: "SUSHI"
        });
        commit('setPendingBalances', pendingBalances);
      }
    },
    async getStakedBalancesForUser({state, commit}) {
      if (state.contracts && state.account) {
        const {rewardsManagerContract, sushiswapPairContract, tokenContract, votingPowerPrismContract} = state.contracts;
        let stakedBalances = {};
        stakedBalances[tokenContract.address] = await votingPowerPrismContract.getAmountStaked(state.account, tokenContract.address);
        let userInfo = await rewardsManagerContract.userInfo(0, state.account); // hardcoded RewardsManager PID
        stakedBalances[sushiswapPairContract.address] = userInfo.amount;
        commit('setStakedBalances', stakedBalances);
      }
    },
    async getStakingTokenList({state, commit}) {
      if (state.contracts) {
        const {tokenRegistryContract, tokenContract, sushiswapPairContract} = state.contracts;
        const stakingTokenList = [];

        let archTokenFormulaAddress = await tokenRegistryContract.tokenFormulas(tokenContract.address);
        let archTokenFormulaContract = new ethers.Contract(
          archTokenFormulaAddress,
          FormulaABI,
          provider
        );
        let archRatio = await archTokenFormulaContract.convertTokensToVotingPower(ethers.utils.parseUnits("1"));

        let slptokenFormulaAddress = await tokenRegistryContract.tokenFormulas(sushiswapPairContract.address);
        let slpTokenFormulaContract = new ethers.Contract(
          slptokenFormulaAddress,
          FormulaABI,
          provider
        );
        let slpRatio = await slpTokenFormulaContract.convertTokensToVotingPower(ethers.utils.parseUnits("1"));

        stakingTokenList.push({ 
          symbol: await tokenContract.symbol(), 
          address: tokenContract.address,
          ratio: archRatio
        });
        stakingTokenList.push({ 
          symbol: await sushiswapPairContract.symbol(), 
          address: sushiswapPairContract.address,
          ratio: slpRatio
        });
        commit('setStakingTokenList', stakingTokenList);
      }
    },
    async getTokenBalancesForUser({state, commit}) {
      if (state.contracts && state.account) {
        const { sushiswapPairContract, tokenContract, edenTokenContract } = state.contracts;
        let tokenBalances = {};
        tokenBalances[tokenContract.address] = await tokenContract.balanceOf(state.account);
        tokenBalances[sushiswapPairContract.address] = await sushiswapPairContract.balanceOf(state.account);
        tokenBalances[edenTokenContract.address] = await edenTokenContract.balanceOf(state.account);
        commit('setTokenBalances', tokenBalances);
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
    async claimFromLocks({state}, lockIds) {
      // console.log("claimFromLocks", lockIds);
      if (state.contracts && state.account) {
        const {vaultContract} = state.contracts;
        try {
          const tx = await vaultContract.claimAllUnlockedTokens(lockIds);
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
      // instead of experimental _signTypedData. This is not supported by Ledger
      // and Trezor, so there is a fallback for normal approvals.
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
          throw Error(); // disable stake with permit Jul 22
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
          // if (err.code == -32603) {
            // MetaMask Message Signature: Error: Not supported on this device
            // Use on-chain approval method
            try {
              const votingPowerPrismContractAddress = DeployedAddresses.VotingPowerPrism[chain.chainId.toString()];
              const tx = await tokenContract.approve(votingPowerPrismContractAddress, ethers.constants.MaxUint256);
              await tx.wait(1);
              return true;
            }
            catch (err) {
              return false;
            }
          // }
          // return false;
        }
      }
    },
    async approveARCHForMigration({state}) {
      if (state.contracts && state.account) {
        const { tokenContract, migratorContract } = state.contracts;
        try {
          const tx = await tokenContract.approve(migratorContract.address, ethers.constants.MaxUint256);
          const txReceipt = await tx.wait(1);
          return txReceipt.status;
        }
        catch (err) {
          return false;
        }
      }
    },
    async migrateARCHToEDEN({state}, amount) {
      if (state.contracts && state.account) {
        const { migratorContract } = state.contracts;
        try {
          const tx = await migratorContract.migrate(amount);
          const txReceipt = await tx.wait(1);
          return txReceipt.status;
        }
        catch (err) {
          return false;
        }
      }
    },
    async approveSLP({state}, stakeAmount) {
      // Approval function for EIP-712
      // Note: this solution uses provider.sent("eth_signTypedData_v4", ...)
      // instead of experimental _signTypedData. This is not supported by Ledger
      // and Trezor, so there is a fallback for normal approvals.
      // See https://github.com/ethers-io/ethers.js/issues/298
      if (state.contracts && state.account) {
        const {sushiswapPairContract, rewardsManagerContract} = state.contracts;
        const chain = await provider.getNetwork();

        let pid = 0; // hardcoded for RewardsManager PID

        const name = await sushiswapPairContract.name(); // token name
        const version = "1";
        const chainId = chain.chainId.toString();
        const verifyingContract = ethers.utils.getAddress(sushiswapPairContract.address);

        const nonce = await sushiswapPairContract.nonces(state.account);
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
          spender: ethers.utils.getAddress(rewardsManagerContract.address),
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
          this.commit('setDepositWithPermit', {
            pid: pid.toString(),
            amount: stakeAmount.toString(),
            deadline: deadline.toString(),
            r: ethers.utils.arrayify("0x" + signature.substring(2).substring(0,64)),
            s: ethers.utils.arrayify("0x" + signature.substring(2).substring(64, 128)),
            v: parseInt(signature.substring(2).substring(128, 130), 16),
          });
          return true;
        }
        catch (err) {
          if (err.code == -32603) {
            // MetaMask Message Signature: Error: Not supported on this device
            // Use on-chain approval method
            try {
              const tx = await sushiswapPairContract.approve(rewardsManagerContract.address, ethers.constants.MaxUint256);
              await tx.wait(1);
              return true;
            }
            catch (err) {
              return false;
            }
          }
          return false;
        }
      }
    },
    async depositWithPermit({state}, amountToStake) {
      if (state.contracts && state.account) {
        const {rewardsManagerContract} = state.contracts;

        if (state.depositWithPermit) {
          // Handle depositWithPermit
          const {pid, amount, deadline, v, r, s} = state.depositWithPermit;
  
          try {
            const tx = await rewardsManagerContract.depositWithPermit(pid, amount, deadline, v, r, s);
            await tx.wait(1);
            return true;
          }
          catch (err) {
            return false;
          }
        }
        else {
          // Handle deposit
          try {
            let pid = 0; // Hardcoded RewardsManager PID
            const tx = await rewardsManagerContract.deposit(pid, amountToStake);
            await tx.wait(1);
            return true;
          }
          catch (err) {
            return false;
          }
        }
      }
    },
    async stakeWithPermit({state}, amountToStake) {
      if (state.contracts && state.account) {
        const {votingPowerPrismContract} = state.contracts;
        if (1 == 0 && state.stakeWithPermit) { // disable stake with permit Jul 22
          // Handle stake with permit
          const {amount, deadline, v, r, s} = state.stakeWithPermit;
  
          try {
            const tx = await votingPowerPrismContract.stakeWithPermit(amount, deadline, v, r, s);
            await tx.wait(1);
            return true;
          }
          catch (err) {
            return false;
          }
        }
        else {
          // Handle stake
          try {
            const tx = await votingPowerPrismContract.stake(amountToStake);
            await tx.wait(1);
            // updated approved amount?
            return true;
          }
          catch (err) {
            return false;
          }
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
    async withdrawSLP({state}, unstakeAmount) {
      if (state.contracts && state.account) {
        const {rewardsManagerContract} = state.contracts;
        try {
          let pid = 0; // RewardsManager PID
          const tx = await rewardsManagerContract.withdraw(pid, unstakeAmount);
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
    approvedBalances: (state) => state.approvedBalances,
    depositWithPermit: (state) => state.depositWithPermit,
    tokenGrant: (state) => state.tokenGrant,
    tokenGrants: (state) => state.tokenGrants,
    tokenGrantAdmin: (state) => state.tokenGrantAdmin,
    tokenGrantTxs: (state) => state.tokenGrantTxs,
    votingPower: (state) => state.votingPower,
    pendingBalances: (state) => state.pendingBalances,
    stakeWithPermit: (state) => state.stakeWithPermit,
    stakedBalances: (state) => state.stakedBalances,
    stakingTokenList: (state) => state.stakingTokenList,
    tokenBalances: (state) => state.tokenBalances,
    loadingVestingSchedules: (state) => state.loadingVestingSchedules,
  },
});
