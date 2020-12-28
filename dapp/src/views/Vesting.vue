<template>
    <article>
        <div class="hero-body">
            <div class="container has-text-centered">
                <h1 class="title has-text-weight-bold is-size-1">
                    Vesting
                </h1>
            </div>
        </div>

        <section class="hero-body" v-if="account && tokenGrant && !hasNoTokenGrant">
            <div class="container">
                <section class="has-text-centered">
                    <grant-level :grant="tokenGrant"></grant-level>
                    <b-button
                            rounded
                            type="is-success"
                            size="is-large"
                            class="mt-6"
                            :disabled="parseFloat(tokenGrant.totalDue) === 0" @click="claim"
                            :loading="claiming"
                    >
                        Claim
                    </b-button>
                </section>
            </div>
        </section>

        <section v-else-if="account && tokenGrant && hasNoTokenGrant">
            <div class="container has-text-centered">
                <h2 class="subtitle is-size-3">
                    Your account has no vesting tokens
                </h2>

                <b-button rounded type="is-success" size="is-large" icon-right="arrow-right" class="mt-3 mx-2" @click="goToStaking">
                    Go to Staking
                </b-button>
            </div>
        </section>

        <spinner v-else></spinner>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  import Spinner from "@/components/Spinner";
  import GrantLevel from '../components/GrantLevel';

  const POLL_RATE = 20 * 1000;
  export default {
    components: {
      GrantLevel,
      Spinner,
    },
    computed: {
      ...mapGetters(['account', 'tokenGrant', 'tokenGrantTxs']),
    },
    data() {
      return {
        claiming: false,
        columns: [
          {
            field: 'tx',
            label: 'TX',
          },
          {
            field: 'timestamp',
            label: 'Time',
          },
          {
            field: 'amountVested',
            label: 'Amt. Vested',
          },
        ],
        polling: null,
        hasNoTokenGrant: false,
      };
    },
    mounted() {
      this.getTokenGrantsForUser();
      this.polling = setInterval(this.getTokenGrantsForUser, POLL_RATE);
    },
    beforeDestroy() {
      clearInterval(this.polling);
    },
    methods: {
      async getTokenGrantsForUser() {
        await this.$store.dispatch('getTokenGrantsForUser');
      },
      async backToHome() {
        await this.$store.dispatch('disconnect');
        return this.$router.push({name: 'Home'});
      },
      goToStaking() {
        return this.$router.push({name: 'Staking'});
      },
      async claim() {
        this.claiming = true;
        await this.$store.dispatch('claim');
        this.claiming = false;
      },
    },
    watch: {
      tokenGrant(newVal, oldVal) {
        if (newVal !== oldVal) {
          if (newVal) {
            if (parseInt(newVal.startTime) === 0) {
              this.hasNoTokenGrant = true;
            }
          }
        }
      },
    },
  };
</script>
