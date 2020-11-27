<template>
    <section style="height: 100%;">
        <nav class="navbar is-dark">
            <div class="container py-3 is-flex is-justify-between">
                <div class="navbar-brand">
                    <div class="navbar-item">
                        <router-link :to="{name: 'Home'}">
                            Archer DAO
                        </router-link>
                    </div>
                </div>

                <div class="navbar-start">
                    <b-navbar-item tag="router-link" :to="{ name: 'Vesting' }" v-if="account">
                        Vesting
                    </b-navbar-item>
                    <b-navbar-item tag="router-link" :to="{ name: 'Staking' }" v-if="account">
                        Staking
                    </b-navbar-item>
                    <b-navbar-item tag="router-link" :to="{ name: 'VestingAdmin' }" v-if="accountAdmin">
                        Admin Panel
                    </b-navbar-item>
                </div>

                <div class="navbar-end">
                    <div class="navbar-item" v-if="account">
                        <b-button rounded outlined type="is-primary" @click="backToHome">
                            {{ account | shortEth }}
                        </b-button>
                    </div>
                </div>
            </div>
        </nav>

        <router-view></router-view>

        <footer>
            <div class="content has-text-centered">
                <p></p>
            </div>
        </footer>
    </section>
</template>

<script>
  import {mapGetters} from 'vuex';

  export default {
    components: {},
    computed: mapGetters(['account', 'accountAdmin']),
    methods: {
      async backToHome() {
        await this.$store.dispatch('disconnect');
        return this.$router.push({name: 'Home'});
      },
    },
    mounted() {
      if (this.$router.currentRoute.path === '/vesting' || this.$router.currentRoute.path === '/vesting-admin') {
        this.$router.push({name: 'Home'});
      }
    },
  };
</script>

<style lang="scss">

    @import "~bulma/sass/utilities/_all";

    $black: #020203;
    $white: #fff;
    $gray: #D6D7DC;

    $dark: #1B212B;

    $link: $gray;
    $link-hover: $gray;

    @import '~bulma';
</style>
