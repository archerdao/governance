<template>
    <article>
        <div class="hero-body">
            <div class="container has-text-centered">
                <h1 class="title has-text-weight-bold is-size-1">
                    Staking
                </h1>
                <!-- <h2 class="title has-text-weight-bold is-size-3 has-text-primary">
                    Stake tokens for voting power
                </h2> -->
            </div>
        </div>

        <section v-if="account && (votingPower || tokenBalances) && stakingTokenList">
            <div class="container is-max-desktop">
                <section>
                    <voting-power 
                      :approvedBalances="approvedBalances"
                      :pendingBalances="pendingBalances"
                      :stakedBalances="stakedBalances"
                      :stakingTokenList="stakingTokenList"
                      :tokenBalances="tokenBalances"
                      :votingPower="votingPower"
                    ></voting-power>
                </section>
            </div>
        </section>

        <!-- <section v-else-if="account">
            <div class="container has-text-centered">
                <h2 class="title has-text-weight-bold is-size-3 has-text-primary">
                    Stake tokens for voting power.
                </h2>
            </div>
        </section> -->

        <spinner v-else></spinner>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  import Spinner from "@/components/Spinner";
  import VotingPower from '../components/VotingPower';

  const POLL_RATE = 15 * 1000;
  export default {
    components: {
      VotingPower,
      Spinner,
    },
    computed: {
      ...mapGetters([
        'account',
        'approvedBalances',
        'pendingBalances',
        'stakedBalances', 
        'tokenBalances', 
        'stakingTokenList',
        'votingPower',
      ]),
    },
    data() {
      return {
        polling: null,
      };
    },
    mounted() {
      this.getStakingBalancesForUser();
      this.polling = setInterval(this.getStakingBalancesForUser, POLL_RATE);
      this.getStakingTokenList();
    },
    beforeDestroy() {
      clearInterval(this.polling);
    },
    methods: {
      async getStakingBalancesForUser() {
        await this.$store.dispatch('getVotingPowerForUser');
        await this.$store.dispatch('getTokenBalancesForUser');
        await this.$store.dispatch('getPendingBalancesForUser');
        await this.$store.dispatch('getStakedBalancesForUser');
        await this.$store.dispatch('getApprovedBalancesForUser');
      },
      async getStakingTokenList() {
        await this.$store.dispatch('getStakingTokenList');
      }
    },
  };
</script>
