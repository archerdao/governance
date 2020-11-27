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
                    {{ toDate(grant.startTime).format('MMM Do, YYYY') }}
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">DAYS</p>
                <p class="title">{{ grant.vestingDuration }}</p>
                <p class="mt-4">
                    {{ toDate(grant.startTime).add(parseInt(grant.vestingDuration), 'days').format('MMM Do, YYYY') }}
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered" v-if="parseInt(grant.vestingCliff) > 0">
            <div>
                <p class="heading">CLIFF</p>
                <p class="title">{{ grant.vestingCliff }}</p>
                <p class="mt-4">
                    {{ toDate(grant.startTime).add(parseInt(grant.vestingCliff), 'days').format('MMM Do, YYYY') }}
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">GRANT AMT</p>
                <p class="title">
                    <animated-number
                            :value="grant.amount"
                            :duration="1200"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    ARCH Tokens
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">CLAIMED</p>
                <p class="title">
                    <animated-number
                            :value="grant.totalClaimed"
                            :duration="1200"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    {{ percentFormatted(grant.totalClaimed, grant.amount) }} claimed
                </p>
            </div>
        </div>
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">AVAILABLE</p>
                <p class="title">
                    <animated-number
                            :value="grant.totalDue"
                            :duration="1200"
                            :formatValue="to6DpAndCurrencyFormatted"
                    />
                </p>
                <p class="mt-4">
                    {{ percentFormatted(grant.totalDue, grant.amount) }} due
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
      percentFormatted(numerator, denominator) {
        return `${(parseFloat(numerator) / parseFloat(denominator) * 100).toFixed(0)}%`
      },
      toDate(value) {
        return moment.unix(value);
      },
    },
  };
</script>
