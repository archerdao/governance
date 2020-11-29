<template>
    <article>
        <div class="hero-body">
            <div class="container has-text-centered">
                <h1 class="title has-text-weight-bold is-size-1">
                    Staking
                </h1>
                <h2 class="title has-text-weight-bold is-size-3 has-text-primary">
                    Stake tokens to get voting power.
                </h2>
            </div>
        </div>

        <section class="hero-body" v-if="account && (votingPower || tokenBalance)">
            <div class="container">
                <section class="has-text-centered">
                    <voting-power-level 
                      :votingPower="votingPower"
                      :stakedBalance="stakedBalance"
                      :tokenBalance="tokenBalance"
                    ></voting-power-level>
                </section>
            </div>
        </section>

        <section v-else-if="account">
            <div class="container has-text-centered">
                <h2 class="title has-text-weight-bold is-size-3 has-text-primary">
                    Stake tokens to get voting power.
                </h2>
            </div>
        </section>

        <spinner v-else></spinner>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  import Spinner from "@/components/Spinner";
  import VotingPowerLevel from '../components/VotingPowerLevel';

  const POLL_RATE = 20 * 1000;
  export default {
    components: {
      VotingPowerLevel,
      Spinner,
    },
    computed: {
      ...mapGetters([
        'account', 
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
      this.getVotingPowerForUser();
      this.polling = setInterval(this.getVotingPowerForUser, POLL_RATE);
    },
    beforeDestroy() {
      clearInterval(this.polling);
    },
    methods: {
      async getVotingPowerForUser() {
        await this.$store.dispatch('getVotingPowerForUser');
        await this.$store.dispatch('getTokenBalanceForUser');
        await this.$store.dispatch('getStakedBalanceForUser');
      },
      async backToHome() {
        await this.$store.dispatch('disconnect');
        return this.$router.push({name: 'Home'});
      },
    },
  };
</script>
