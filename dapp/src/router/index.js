import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Vesting from '../views/Vesting.vue';
import Staking from '../views/Staking.vue';
import VestingAdmin from '../views/VestingAdmin.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/vesting',
        name: 'Vesting',
        component: Vesting
    },
    {
        path: '/staking',
        name: 'Staking',
        component: Staking
    },
    {
        path: '/vesting-admin',
        name: 'VestingAdmin',
        component: VestingAdmin
    },
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;
