<template>
    <article>
        <div class="hero-body">
            <div class="container has-text-centered">
                <h1 class="title has-text-weight-bold is-size-1">
                    Token Migration
                </h1>
                <h2 class="subtitle has-text-weight-bold is-size-4 has-text-primary">
                    <a href="https://medium.com/archer-dao/arch-token-migration-915e6af976c6" target="_blank">Learn more&nbsp;&nearr;</a>
                </h2>
            </div>
        </div>

        <section v-if="account && (votingPower || tokenBalances) && stakingTokenList">
            <div class="container is-max-desktop">
                <section>
                    <migrator 
                      :approvedBalances="approvedBalances"
                      :pendingBalances="pendingBalances"
                      :stakedBalances="stakedBalances"
                      :stakingTokenList="stakingTokenList"
                      :tokenBalances="tokenBalances"
                    ></migrator>
                </section>
            </div>
        </section>

        <spinner v-else></spinner>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  import Spinner from "@/components/Spinner";
  import Migrator from '../components/Migrator';

  const POLL_RATE = 15 * 1000;
  export default {
    components: {
      Migrator,
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
