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

        <section class="hero-body" v-if="account && tokenGrants">
            <div class="container">
                <section>
                  <b-table 
                    :data="tokenGrants" 
                    :checked-rows.sync="checkedRows"
                    :is-row-checkable="(row) => row.totalDue !== `0.0`"
                    checkable
                    checkbox-position="right"
                  >
                    <b-table-column field="startTime" label="Start" align="left" v-slot="props">
                      <p class="subtitle mb-1">{{ toDate(props.row.startTime).fromNow() }}</p>
                      <p>{{ toDate(props.row.startTime).format('MMM Do, YYYY') }}</p>
                    </b-table-column>
                    <b-table-column field="vestingDuration" label="End" v-slot="props">
                      <p class="subtitle mb-1">{{ toDate(props.row.startTime).add(parseInt(props.row.vestingDuration), 'days').fromNow() }}</p>
                      <p>{{ toDate(props.row.startTime).add(parseInt(props.row.vestingDuration), 'days').format('MMM Do, YYYY') }}</p>
                    </b-table-column>
                    <b-table-column field="vestingCliff" label="Cliff" v-slot="props" :visible="false">
                      <p class="subtitle mb-1">{{ props.row.vestingCliff }}</p>
                      <p class="is-light-text">{{ toDate(props.row.startTime).add(parseInt(props.row.vestingCliff), 'days').format('MMM Do, YYYY') }}</p>
                    </b-table-column>
                    <b-table-column field="amount" label="Amount" numeric v-slot="props">
                      <p class="subtitle mb-1">{{ to2DpAndCurrencyFormatted(props.row.amount) }}</p>
                    </b-table-column>
                    <b-table-column field="totalClaimed" label="Claimed" numeric v-slot="props">
                      <p class="subtitle mb-1">{{ percentFormatted(props.row.totalClaimed, props.row.amount) }}</p>
                      <p class="is-text-light">{{ to6DpAndCurrencyFormatted(props.row.totalClaimed) }}</p>
                    </b-table-column>
                    <b-table-column field="totalDue" label="Due" numeric v-slot="props">
                      <p class="subtitle mb-1">{{ percentFormatted(props.row.totalDue, props.row.amount) }}</p>
                      <p class="is-light">{{ to6DpAndCurrencyFormatted(props.row.totalDue) }}</p>
                    </b-table-column>
                  </b-table>
                </section>
                <section class="has-text-centered">
                  <b-button
                          rounded
                          type="is-success"
                          size="is-large"
                          class="mt-6"
                          :disabled="parseFloat(checkedRows.length) === 0" 
                          @click="claimFromLocks"
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
  import moment from 'moment';
  import Spinner from "@/components/Spinner";
  import GrantLevel from '../components/GrantLevel';

  const POLL_RATE = 20 * 1000;
  export default {
    components: {
      GrantLevel,
      Spinner,
    },
    computed: {
      ...mapGetters([
        'account', 
        'tokenGrant', 
        'tokenGrants', 
        'tokenGrantTxs'
      ]),
    },
    data() {
      return {
        claiming: false,
        checkedRows: [],
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
      goToStaking() {
        return this.$router.push({name: 'Staking'});
      },
      async claim() {
        this.claiming = true;
        await this.$store.dispatch('claim');
        this.claiming = false;
      },
      async claimFromLocks() {
        this.claiming = true;
        console.log("claimFromLocks", this.checkedRows.map(x => x.id));
        await this.$store.dispatch('claimFromLocks', this.checkedRows.map(x => x.id));
        this.claiming = false;
      },
      toDate(value) {
        return moment.unix(value);
      },
      to2DpAndCurrencyFormatted(value) {
        const to2Dp = this.$options.filters.to2Dp(value);
        const formatted = this.$options.filters.currency_2(to2Dp);
        return `${formatted} ARCH`;
      },
      to6DpAndCurrencyFormatted(value) {
        const to6Dp = this.$options.filters.to6Dp(value);
        const formatted = this.$options.filters.currency_6(to6Dp);
        return `${formatted}`;
      },
      percentFormatted(numerator, denominator) {
        return `${(parseFloat(numerator) / parseFloat(denominator) * 100).toFixed(0)}%`
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
