<template>
    <section class="level" v-if="votingPower">
        <div class="level-item has-text-centered">
            <div>
                <p class="heading">
                    <b-tooltip label="Tooltip top">VOTING POWER</b-tooltip>
                </p>
                <p class="title">
                    <animated-number
                            :value="votingPower.toString()"
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
                <p class="title">{{ tokenBalance }}</p>
                <p class="mt-4">
                    ARCH Tokens
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
    props: ['tokenBalance', 'votingPower'],
    methods: {
      to2DpAndCurrencyFormatted(value) {
        const decimal = this.$options.filters.fromWei(value);
        const to2Dp = this.$options.filters.to2Dp(decimal);
        const formatted = this.$options.filters.currency(to2Dp);
        return `${formatted}`;
      }
    },
  };
</script>
