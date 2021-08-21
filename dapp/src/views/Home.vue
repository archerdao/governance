<template>
    <article>
        <div>
            <div class="hero-body">
                <div class="container has-text-centered mt-6">
                    <h1 class="title is-size-1 mb-5">
                        Archer DAO
                    </h1>
                    <div v-if="!account">
                      <h2 class="subtitle is-size-3 mb-6 pt-5">
                          Connect your web3 wallet to continue
                      </h2>
                      <b-button rounded type="is-success" size="is-large" icon-right="arrow-right" class="mt-3" @click="connect">
                          Connect
                      </b-button>
                    </div>
                    <div v-else>
                      <h2 class="subtitle is-size-3 mb-6 pt-5">
                          Welcome to Archer DAO
                      </h2>
                      <p>
                      <b-button rounded type="is-success" size="is-large" icon-right="arrow-right" class="mt-3 mx-2" @click="goToStaking">
                          Go to Staking
                      </b-button>
                      </p>
                      <p>
                      <b-button rounded outlined type="is-warning" size="is-large" class="mt-4 mx-2" @click="disconnect">
                          Disconnect wallet
                      </b-button>
                      </p>
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
        this.$store.dispatch("bootstrap", {
          onSuccessCallback: () => {
            this.$router.push({name: 'Migrate'});
          },
        });
      },
      disconnect() {
        this.$store.dispatch('disconnect');
      },
      goToStaking() {
        return this.$router.push({name: 'Staking'});
      },
    },
  };
</script>