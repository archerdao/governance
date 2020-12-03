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
            <article class="notification is-light">
                <p class="title is-5">What can I do with voting power?</p>
                <div class="content is-small">
                  <p>
                    <b-tag type="is-primary is-light">&gt;0</b-tag>
                    Vote on network issues
                    <!-- <span class="icon is-small">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span> -->
                  </p>
                  <p>
                    <!-- <a href="#" target="_blank"> -->
                    <b-tag type="is-primary is-light">10k</b-tag>
                    Access private Discord channels
                    <!-- <span class="icon is-small">
                      <i class="mdi mdi-arrow-top-right"></i>
                    </span> -->
                    <!-- </a> -->
                  </p>
                  <p>
                    <b-tag type="is-primary is-light">20k</b-tag>
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
          <b-tabs v-model="activeTab" expanded class="notification">
            <b-tab-item label="Stake" component="button">
              <p class="title is-3">Stake tokens</p>
              <p class="subtitle is-5">Increase your voting power</p>
              <b-field
                grouped
                label="Amount to stake"
              >
                <p class="control">
                  <span class="button is-static is-medium">ARCH</span>
                </p>
                <b-input 
                  :value="format(amountToStake)"
                  @input="onStakeInput"
                  type="text" 
                  size="is-medium"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      type="is-primary is-outlined" 
                      size="is-medium"
                      @click="setMax(true)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Available balance">
                <p>{{formatTokenBalance(tokenBalance)}}</p>
              </b-field>
              <b-field label="New voting power">
                <p>{{ getNewVotingPower(votingPower, amountToStake) }}</p>
              </b-field>
              <div class="columns">
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
              <p class="title is-3">Unstake tokens</p>
              <p class="subtitle is-5">Decrease your voting power</p>
              <b-field
                grouped
                label="Amount to unstake"
              >
                <p class="control">
                  <span class="button is-static is-medium">ARCH</span>
                </p>
                <b-input 
                  :value="format(amountToUnstake)"
                  @input="onUnstakeInput"
                  type="text" 
                  size="is-medium"
                  expanded
                >
                </b-input>
                <p class="control">
                    <b-button 
                      type="is-primary is-outlined" 
                      size="is-medium"
                      @click="setMax(false)"
                    >
                      Max
                    </b-button>
                </p>
              </b-field>
              <b-field label="Staked balance">
                <p>{{formatTokenBalance(stakedBalance)}}</p>
              </b-field>
              <b-field label="New voting power">
                <p>{{ getNewVotingPower(votingPower, amountToUnstake, false) }}</p>
              </b-field>
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
        amountToStake: utils.parseEther("0"),
        amountToUnstake: utils.parseEther("0"),
        activeTab: 0,
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
        const decimal = utils.formatEther(value); // BN to string
        const formatted = decimal.replace(/[.]0*$/, '') // Drop trailing zeroes
        return formatted;
      },
      inputToBigNumber(value) {
        try {
          const validInput = value.match(/^[^\D]*[.]{0,1}[^\D]{0,18}/)[0]; // Match a valid decimal
          return utils.parseEther(validInput); // user input to BN
        }
        catch (err) {
          return utils.parseEther("0");
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
        if (BigNumber.isBigNumber(currentValue) && BigNumber.isBigNumber(amount)) {
          let value;
          if (staking) {
            value = currentValue.add(amount);
          }
          else {
            value = currentValue.sub(amount);
          }
          return `${this.to2DpAndCurrencyFormatted(value)}`;
        }
        else {
          return null;
        }
      },
      isAmountToStakeValid() {
        return this.amountToStake.gt("0") && this.amountToStake.lte(this.tokenBalance);
      },
      isAmountToUnstakeValid() {
        return this.amountToUnstake.gt("0") && this.amountToUnstake.lte(this.stakedBalance);
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
        this.staking = false;
        this.approved = !stakeResult;
      },
      async withdraw() {
        this.withdrawing = true;
        await this.$store.dispatch('withdraw', this.amountToUnstake);
        this.withdrawing = false;
      }
    },
  };
</script>
