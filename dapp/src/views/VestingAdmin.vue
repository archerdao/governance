<template>
    <article>
        <div class="hero-body">
            <div class="container has-text-centered">
                <h1 class="title has-text-weight-bold is-size-1">
                    Vesting Admin
                </h1>
            </div>
        </div>

        <div class="has-text-centered mb-6">
            <div class="columns is-centered">
                <div class="column is-half-desktop">
                    <b-field>
                        <b-input placeholder="ETH Wallet"
                                 size="is-large"
                                 icon="ethereum"
                                 v-model="ethWallet"
                                 @input="getTokenGrantsForUserAdmin"
                        >
                        </b-input>
                    </b-field>
                </div>
            </div>
        </div>

        <div class="hero-body" v-if="account && tokenGrantAdmin">
            <div class="container">
                <section class="has-text-centered">
                    <grant-level :grant="tokenGrantAdmin"></grant-level>
                </section>
            </div>
        </div>
        <div class="columns is-centered mb-6" v-else>
            <div class="column is-half-desktop">
                <b-notification>
                    No Grant for {{ ethWallet }}
                </b-notification>
            </div>
        </div>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  import GrantLevel from '../components/GrantLevel';

  export default {
    components: {
      GrantLevel,
    },
    computed: {
      ...mapGetters(['account', 'tokenGrantAdmin']),
    },
    data() {
      return {
        ethWallet: null,
      };
    },
    methods: {
      async getTokenGrantsForUserAdmin() {
        await this.$store.dispatch('getTokenGrantsForUserAdmin', this.ethWallet);
      },
    },
  };
</script>