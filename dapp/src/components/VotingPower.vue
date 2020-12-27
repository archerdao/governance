<template>
    <section v-if="votingPower">
        <div class="columns">
          <div class="column is-two-fifths">
            <article class="notification is-primary">
                <p class="title is-2">
                    <animated-number
                            :value="votingPower && votingPower.toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                </p>
              <p class="subtitle is-5">Voting Power</p>
            </article>
            <article class="box is-dark">
                <p class="subtitle is-5">What can I do with voting power?</p>
                <div class="content is-family-secondary">
                  <p>
                    <b-tag type="is-primary">&gt;0</b-tag>
                    Vote on network issues
                    <!-- <span class="icon is-small">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span> -->
                  </p>
                  <p>
                    <!-- <a href="#" target="_blank"> -->
                    <b-tag type="is-primary">10k</b-tag>
                    Access private Discord channels
                    <!-- <span class="icon is-small">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span> -->
                    <!-- </a> -->
                  </p>
                  <p>
                    <b-tag type="is-primary">20k</b-tag>
                    Propose new votes
                    <!-- <span class="icon is-small">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span> -->
                  </p>
                </div>
            </article>
            </div>
        <div class="column">
          <!-- <article class="notification"> -->
          <b-tabs v-model="activeTab" expanded class="box" size="is-large">
            <b-tab-item label="Stake" component="button">
              <p class="subtitle is-4">Increase your voting power</p>
              <b-field grouped label="Tokens to stake" class="mt-6">
                <p class="control">
                  <!-- <span class="button is-static is-medium">ARCH</span> -->
                  <b-select placeholder="ARCH" size="is-medium" v-model="selectedToken" disabled>
                      <option
                          v-for="token in tokenList"
                          :value="token.symbol"
                          :key="token.symbol">
                          {{ token.symbol }}
                      </option>
                  </b-select>
                </p>
                <b-input 
                  :value="format(amountToStake)"
                  :autofocus="true"
                  @input="onStakeInput"
                  placeholder="Amount"
                  type="text" 
                  size="is-medium has-text-right"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      type="is-info is-outlined" 
                      size="is-medium"
                      @click="setMax(true)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Available balance" class="mt-4">
                <p class="is-family-secondary">{{formatTokenBalance(tokenBalance)}}</p>
              </b-field>
              <b-field label="New voting power" class="mt-4">
                <p class="is-family-secondary">{{ getNewVotingPower(votingPower, amountToStake) }}</p>
              </b-field>
              <div class="columns mt-4">
                <div class="column">
                  <b-button
                          type="is-primary"
                          size="is-large"
                          :disabled="approved || !isAmountToStakeValid()"
                          @click="approve"
                          :loading="approving"
                          expanded
                  >
                      Approve
                  </b-button>
                </div>
                <div class="column">
                  <b-button
                          type="is-primary"
                          size="is-large"
                          :disabled="!approved"
                          @click="stake"
                          :loading="staking"
                          expanded
                  >
                      Stake
                  </b-button>
                </div>
              </div>
            </b-tab-item>
            <b-tab-item label="Unstake">
              <p class="subtitle is-4">Decrease your voting power</p>
              <b-field grouped label="Tokens to unstake"  class="mt-6">
                <p class="control">
                  <!-- <span class="button is-static is-medium">ARCH</span> -->
                  <b-select placeholder="ARCH" size="is-medium" v-model="selectedToken" disabled>
                      <option
                          v-for="token in tokenList"
                          :value="token.symbol"
                          :key="token.symbol">
                          {{ token.symbol }}
                      </option>
                  </b-select>
                </p>
                <b-input 
                  :value="format(amountToUnstake)"
                  @input="onUnstakeInput"
                  placeholder="Amount"
                  type="text" 
                  size="is-medium has-text-right"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      type="is-info is-outlined" 
                      size="is-medium"
                      @click="setMax(false)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Staked balance" class="mt-4">
                <p class="is-family-secondary">{{formatTokenBalance(stakedBalance)}}</p>
              </b-field>
              <b-field label="New voting power" class="mt-4">
                <p class="is-family-secondary">{{ getNewVotingPower(votingPower, amountToUnstake, false) }}</p>
              </b-field>
              <div class="columns mt-4">
                <div class="column">
                  <b-button
                          type="is-danger"
                          size="is-large"
                          :disabled="!isAmountToUnstakeValid()" 
                          @click="withdraw"
                          :loading="withdrawing"
                          expanded
                  >
                      Unstake
                  </b-button>
                </div>
              </div>
            </b-tab-item>
          </b-tabs>
          <!-- </article> -->
        </div>
        </div>
    </section>
</template>

<script>
  import AnimatedNumber from "animated-number-vue";
  import { utils, BigNumber } from "ethers";

  const tokenList = [{ symbol: "ARCH" },{ symbol: "SLP" },{ symbol: "UNI" }];

  export default {
    components: {
      AnimatedNumber,
    },
    data() {
      return {
        approved: false,
        approving: false,
        staking: false,
        withdrawing: false,
        amountToStake: null,
        amountToUnstake: null,
        activeTab: 0,
        tokenList,
        selectedToken: "ARCH"
      };
    },
    props: ['approvedBalance', 'stakedBalance', 'tokenBalance', 'votingPower'],
    methods: {
      setMax(staking=true) {
        if (staking) {
          this.amountToStake = this.tokenBalance;
        }
        else {
          this.amountToUnstake = this.stakedBalance;
        }
      },
      onStakeInput(value) {
        this.amountToStake = this.inputToBigNumber(value);
        this.approved = false;
      },
      onUnstakeInput(value) {
        this.amountToUnstake = this.inputToBigNumber(value);
      },
      format(value) {
        try {
          const decimal = utils.formatEther(value); // BN to string
          const formatted = decimal.replace(/[.]0*$/, '') // Drop trailing zeroes
          return formatted;
        }
        catch {
          return null;
        }
      },
      inputToBigNumber(value) {
        try {
          const validInput = value.match(/^[^\D]*[.]{0,1}[^\D]{0,18}/)[0]; // Match a valid decimal
          return utils.parseEther(validInput); // user input to BN
        }
        catch (err) {
          return null;
        }
      },
      to2DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const to2Dp = this.$options.filters.to2Dp(decimal);
        const formatted = this.$options.filters.currency(to2Dp);
        return `${formatted}`;
      },
      to2Dp(value) {
        const decimal = this.$options.filters.fromWei(value);
        const to2Dp = this.$options.filters.to2Dp(decimal);
        return to2Dp;
      },
      formatTokenBalance(value) {
        return `${this.to2DpAndCurrencyFormatted(value)} ARCH`;
      },
      getNewVotingPower(currentValue, amount, staking=true) {
        let value;
        if (BigNumber.isBigNumber(currentValue) && BigNumber.isBigNumber(amount)) {
          if (staking) {
            value = currentValue.add(amount);
          }
          else if (amount.lt(currentValue)) {
            value = currentValue.sub(amount);
          }
        }
        else {
          value = currentValue;
        }
        return `${this.to2DpAndCurrencyFormatted(value)}`;
      },
      isAmountToStakeValid() {
        try {
          return this.amountToStake.gt("0") && this.amountToStake.lte(this.tokenBalance);
        }
        catch {
          return false;
        }
      },
      isAmountToUnstakeValid() {
        try {
          return this.amountToUnstake.gt("0") && this.amountToUnstake.lte(this.stakedBalance);
        }
        catch {
          return false;
        }
      },
      async approve() {
        this.approving = true;
        const approveResult = await this.$store.dispatch('approve', this.amountToStake);
        this.approving = false;
        this.approved = approveResult;
      },
      async stake() {
        this.staking = true;
        const stakeResult = await this.$store.dispatch('stakeWithPermit');
        this.amountToStake = null;
        this.staking = false;
        this.approved = !stakeResult;
      },
      async withdraw() {
        this.withdrawing = true;
        await this.$store.dispatch('withdraw', this.amountToUnstake);
        this.amountToUnstake = null;
        this.withdrawing = false;
      }
    },
  };
</script>
