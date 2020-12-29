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

        <section v-if="account && (votingPower || tokenBalance)">
            <div class="container is-max-desktop">
                <section>
                    <voting-power 
                      :approvedBalance="approvedBalance"
                      :stakedBalance="stakedBalance"
                      :tokenBalance="tokenBalance"
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
        'approvedBalance',
        'stakedBalance', 
        'tokenBalance', 
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
    },
    beforeDestroy() {
      clearInterval(this.polling);
    },
    methods: {
      async getStakingBalancesForUser() {
        await this.$store.dispatch('getVotingPowerForUser');
        await this.$store.dispatch('getTokenBalanceForUser');
        await this.$store.dispatch('getStakedBalanceForUser');
        await this.$store.dispatch('getApprovedBalanceForUser');
      },
    },
  };
</script>
