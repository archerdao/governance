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
            <article class="box is-hidden-mobile">
                <p class="title is-5">What can I do with voting power?</p>
                <div class="content is-family-secondary">
                  <p>
                    <b-button type="is-text" tag="a" href="https://gov.archerdao.io/" target="_blank">
                      <b-tag type="is-primary" class="mr-2">&gt;0</b-tag>
                      <span>Vote on network issues</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                    <b-button type="is-text" tag="a" href="https://discord.gg/98GV73f" target="_blank">
                      <b-tag type="is-primary" class="mr-2">10k</b-tag>
                      <span>Access private Discord channels</span>
                      <span class="icon is-small is-link ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                    <b-button type="is-text" tag="a" href="https://gov.archerdao.io/" target="_blank">
                      <b-tag type="is-primary" class="mr-2">20k</b-tag>
                      <span>Propose new votes</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                  </p>
                </div>
            </article>
            <article class="box is-hidden-mobile">
                <p class="title is-5">
                  <b-tag type="is-success" class="mr-2">NEW</b-tag>
                  <span>SushiSwap Onsen</span>
                </p>
                <div class="content is-family-secondary">
                  <p>ARCH is now part of SushiSwap Onsen. Earn SUSHI by providing ARCH-ETH liquidity.</p>
                  <p>
                    <b-button type="is-text" tag="a" href="https://sushiswap.fi/onsen" target="_blank">
                      <span>Visit SushiSwap</span>
                      <span class="icon is-small ml-1">
                        <i class="mdi mdi-arrow-top-right"></i>
                      </span>
                    </b-button>
                  </p>
                </div>
            </article>
            </div>
        <div class="column">
          <b-tabs v-model="activeTab" expanded class="box" size="is-medium">
            <b-tab-item label="Stake" component="button">
              <p class="title is-4">Increase your voting power</p>
              <b-field grouped label="Tokens to stake" class="mt-6">
                <p class="control">
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
                  :disabled="approving || staking"
                  @input="onStakeInput"
                  placeholder="Amount"
                  type="text" 
                  size="is-medium has-text-right"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      :disabled="approving || staking"
                      type="is-text" 
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
                          rounded
                          type="is-success"
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
                          rounded
                          type="is-success"
                          size="is-large"
                          :disabled="!approved || !isAmountToStakeValid()"
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
              <p class="title is-4">Decrease your voting power</p>
              <b-field grouped label="Tokens to unstake"  class="mt-6">
                <p class="control">
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
                  :disabled="withdrawing"
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
                      :disabled="withdrawing"
                      type="is-text" 
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
                          rounded
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
        </div>
        </div>
    </section>
</template>

<script>
  import AnimatedNumber from "animated-number-vue";
  import { utils, BigNumber } from "ethers";

  const tokenList = [{ symbol: "ARCH" }];

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
          this.onStakeInput(this.format(this.amountToStake));
        }
        else {
          this.amountToUnstake = this.stakedBalance;
          this.onUnstakeInput(this.format(this.amountToUnstake));
        }
      },
      onStakeInput(value) {
        this.amountToStake = this.inputToBigNumber(value);
        if (
          this.amountToStake 
          && this.amountToStake.gt("0") 
          && this.approvedBalance.gte(this.amountToStake)
        ) {
          // Account has on-chain approval
          this.approved = true;
        }
        else {
          // No on-chain approval
          this.approved = false;
        }
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
        let approveResult;
        try {
          approveResult = await this.$store.dispatch('approve', this.amountToStake);
        }
        catch {
          approveResult = false;
        }
        this.approving = false;
        this.approved = approveResult;
      },
      async stake() {
        this.staking = true;
        let stakeResult;
        try {
          stakeResult = await this.$store.dispatch('stakeWithPermit', this.amountToStake);
        }
        catch (err) {
          stakeResult = false;
        }
        if (stakeResult) {
          this.amountToStake = null;
          this.onStakeInput(null);
        }
        this.staking = false;
      },
      async withdraw() {
        this.withdrawing = true;
        let withdrawResult;
        try {
          withdrawResult = await this.$store.dispatch('withdraw', this.amountToUnstake);
        }
        catch {
          withdrawResult = false;
        }
        if (withdrawResult) {
          this.amountToUnstake = null;
        }
        this.withdrawing = false;
      }
    },
  };
</script>
