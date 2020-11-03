<template>
    <section class="level" v-if="grant">
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">
                    <b-tooltip label="Tooltip top">START</b-tooltip>
                </p>
                <p class="title">
                    {{ toDate(grant.startTime).fromNow() }}
                </p>
                <p class="mt-4">
                    {{ toDate(grant.startTime).format('MMM Do YYYY') }}
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">DAYS</p>
                <p class="title">{{ grant.vestingDuration }}</p>
                <p class="mt-4">
                    {{ toDate(grant.startTime).add(parseInt(grant.vestingDuration), 'days').format('MMM Do YYYY') }}
                </p>
            </div>

        </div>
        <div class="level-item has-text-centered" v-if="parseInt(grant.vestingCliff) > 0">
            <div>
                <p class="heading">CLIFF</p>
                <p class="title">{{ grant.vestingCliff }}</p>
                <p class="mt-4">
                    {{ toDate(grant.startTime).add(parseInt(grant.vestingCliff), 'days').format('MMM Do YYYY') }}
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">VESTED AMT</p>
                <p class="title">
                    <animated-number
                            :value="grant.amount"
                            :duration="2000"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    Your balance XXXX
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">CLAIMED</p>
                <p class="title">
                    <animated-number
                            :value="grant.totalClaimed"
                            :duration="2000"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    {{ ((parseFloat(grant.totalClaimed) /  parseFloat(grant.amount)) * 100).toFixed(2) }}% claimed
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">DUE</p>
                <p class="title">
                    <animated-number
                            :value="grant.totalDue"
                            :duration="2000"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    {{ ((parseFloat(grant.totalDue) /  parseFloat(grant.amount)) * 100).toFixed(2) }}% due
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
    props: ['grant'],
    methods: {
      to6DpAndCurrencyFormatted(value) {
        const to6Dp = this.$options.filters.to6Dp(value);
        const formatted = this.$options.filters.currency(to6Dp);
        return `${formatted}`;
      },
      toDate(value) {
        return moment.unix(value);
      },
    },
  };
</script>
