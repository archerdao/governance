<template>
    <article>
        <div>
            <div class="hero-body">
                <div class="container has-text-centered mt-6">
                    <h1 class="title has-text-weight-bold is-size-1 mb-5">
                        Hello welcome to ACME Inc.
                    </h1>
                    <h2 class="subtitle mb-6 pt-5">
                        Connect your web3 wallet
                    </h2>
                    <b-button type="is-primary" size="is-large" class="mt-3" @click="connect" v-if="!account">
                        Connect
                    </b-button>
                    <div v-else>
                        <b-button type="is-primary" outlined size="is-large" class="mt-3 mx-2" @click="disconnect">
                            Connect to another wallet
                        </b-button>
                        <b-button type="is-primary" size="is-large" class="mt-3 mx-2" @click="connect">
                           Go to Vesting
                        </b-button>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>
<script>
  import {mapGetters} from 'vuex';
  export default {
    components: {},
    computed: {
      ...mapGetters(['tokenGrant', 'account']),
    },
    methods: {
      connect() {
        if (this.account && this.tokenGrant) {
          console.log('Have account and token grant >>> Vesting');
          this.$router.push({name: 'Vesting'});
          return;
        }
        this.$store.dispatch("bootstrap", {
          onSuccessCallback: () => {
            console.log('Bootstrapped >>> Vesting');
            this.$router.push({name: 'Vesting'});
          },
        });
      },
      disconnect() {
        this.$store.dispatch('disconnect');
      },
    },
  };
</script>