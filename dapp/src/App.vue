<template>
    <section style="height: 100%;">
        <nav class="navbar is-transparent">
            <div class="container py-3 is-flex is-justify-between">
                <div class="navbar-brand">
                    <div class="navbar-item">
                        <router-link :to="{name: 'Home'}">
                            <img src="@/assets/head-logo.png" alt="Archer Logo" class="mt-1" />
                        </router-link>
                    </div>
                </div>

                <div class="navbar-start" v-if="account">
                    <b-navbar-item tag="router-link" :to="{ name: 'Staking' }">
                        Staking
                    </b-navbar-item>
                    <b-navbar-item tag="router-link" :to="{ name: 'Vesting' }">
                        Vesting
                    </b-navbar-item>
                    <b-navbar-item href="https://gov.archerdao.io" target="_blank">
                       <span>Voting</span>
                        <span class="icon is-medium ml-1">
                            <i class="mdi mdi-arrow-top-right"></i>
                        </span>
                    </b-navbar-item>
                    <b-navbar-item tag="router-link" :to="{ name: 'VestingAdmin' }" v-if="accountAdmin">
                        Admin Panel
                    </b-navbar-item>
                </div>

                <div class="navbar-end">
                    <div class="navbar-item" v-if="account">
                        <b-button rounded type="is-primary" @click="backToHome">
                            <span class="icon">
                                <i class="mdi mdi-ethereum"></i>
                            </span>
                            <span>
                                {{ account | shortEth }}
                            </span>
                        </b-button>
                    </div>
                </div>
            </div>
        </nav>

        <router-view></router-view>

        <footer class="footer">
            <div class="content has-text-centered">
                <p>&nbsp;</p>
            </div>
        </footer>

        <nav class="navbar is-fixed-bottom is-transparent is-hidden-mobile">
            <div class="container py-3 is-flex is-justify-between">
                <div class="navbar-end">
                    <b-navbar-item class="is-family-secondary" href="https://github.com/archerdao/governance" target="_blank">
                        <span class="icon is-medium">
                            <i class="mdi mdi-github"></i>
                        </span>
                        Github
                    </b-navbar-item>
                    <b-navbar-item class="is-family-secondary" href="https://twitter.com/Archer_DAO" target="_blank">
                        <span class="icon is-medium">
                            <i class="mdi mdi-twitter"></i>
                        </span>
                        Twitter
                    </b-navbar-item>
                    <b-navbar-item class="is-family-secondary" href="https://discord.gg/98GV73f" target="_blank">
                        <span class="icon is-medium">
                            <i class="mdi mdi-discord"></i>
                        </span>
                        Discord
                    </b-navbar-item>
                </div>
            </div>
        </nav>
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
      if (
          this.$router.currentRoute.path === '/staking' ||
          this.$router.currentRoute.path === '/vesting' || 
          this.$router.currentRoute.path === '/vesting-admin'
        ) {
        this.$router.push({name: 'Home'});
      }
    },
  };
</script>

<style lang="scss">

    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&family=Open+Sans;&display=swap');

    // Archer colors
    $archer-background: #11141c;
    $archer-primary-green: #6ab04c;
    $archer-primary-purple: #5545bf;
    $archer-primary-cyan: #00cec9;
    $archer-primary-orange: #fdcb6e;
    $archer-secondary-silver: #DEDBFF;
    $archer-secondary-gray: #303642;
    $archer-secondary-red: #E17055;
    $archer-helper-box: #151926;

    $white: #fff;
    $dark: $archer-background;
    $background: $archer-background;
    $footer-background-color: $archer-background;

    $family-primary: "Montserrat", BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    $family-secondary: "Open Sans", BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;

    $primary: $archer-primary-purple;
    $link: $archer-primary-green;
    $success: $archer-primary-green;
    $info: $archer-primary-cyan;
    $warning: $archer-primary-orange;
    $danger: $archer-secondary-red;

    $text: $archer-secondary-silver;
    $text-light: $archer-secondary-gray;
    $text-strong: $archer-secondary-silver;

    $button-text-decoration: "none";
    $button-text-hover-background-color: $archer-helper-box;
    $button-text-hover-color: $link;

    $input-border-color: $archer-background;
    $input-hover-border-color: $archer-background;
    $input-focus-border-color: $text;

    $weight-normal: 500;
    $weight-semibold: 700;

    $size-1: 4rem;

    $box-background-color: $archer-helper-box;
    $box-shadow: -8px 0 8px 0 #3f3f3f38, 8px 0 8x 0 #d0d0d038;

    $navbar-z: 0;
    $navbar-fixed-z: 0;

    $scheme-main: $archer-background;

    @import "~bulma/sass/utilities/_all";
    @import '~bulma';
    @import "~buefy/src/scss/buefy";
</style>
