<template>
    <section class="level" v-if="votingPower && tokenBalance && stakedBalance">
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">VOTING POWER</p>
                <p class="title">
                    <animated-number
                            :value="votingPower && votingPower.toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4"></p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">TOKEN BALANCE</p>
                <p class="title">
                    <animated-number
                            :value="tokenBalance && tokenBalance.toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">ARCH Tokens</p>
                <div class="columns">
                  <div class="column">
                    <b-button
                            type="is-primary"
                            size="is-large"
                            class="mt-6"
                            :disabled="approved || parseFloat(tokenBalance) === 0" @click="approve"
                            :loading="approving"
                    >
                        Approve
                    </b-button>
                  </div>
                  <div class="column">
                    <b-button
                            type="is-primary"
                            size="is-large"
                            class="mt-6"
                            :disabled="!approved || parseFloat(tokenBalance) === 0" @click="stake"
                            :loading="staking"
                    >
                        Stake
                    </b-button>
                  </div>
                </div>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">STAKED BALANCE</p>
                <p class="title">
                    <animated-number
                            :value="stakedBalance && stakedBalance.toString()"
                            :duration="1200"
                            :formatValue="to2DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">ARCH Tokens</p>
                <p>
                    <b-button
                            type="is-danger"
                            size="is-large"
                            class="mt-6"
                            :disabled="parseFloat(stakedBalance) === 0" @click="withdraw"
                            :loading="withdrawing"
                    >
                        Unstake
                    </b-button>
                </p>
            </div>
        </div>
    </section>
</template>

<script>
  import AnimatedNumber from "animated-number-vue";
  import moment from 'moment';

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
      };
    },
    props: ['approvedBalance', 'stakedBalance', 'tokenBalance', 'votingPower'],
    methods: {
      to2DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const to2Dp = this.$options.filters.to2Dp(decimal);
        const formatted = this.$options.filters.currency(to2Dp);
        return `${formatted}`;
      },
      async approve() {
        this.approving = true;
        const approveResult = await this.$store.dispatch('approve');
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
        await this.$store.dispatch('withdraw');
        this.withdrawing = false;
      }
    },
  };
</script>
