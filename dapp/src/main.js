import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import Buefy from "buefy";

Vue.use(Buefy);

Vue.config.productionTip = false;

Vue.filter("to2Dp", function (value) {
  if (!value) return value;
  return parseFloat(value).toFixed(2);
});

Vue.filter("to6Dp", function (value) {
  if (!value) return value;
  return parseFloat(value).toFixed(6);
});

Vue.filter("fromWei", function (value) {
  if (!value) return value;
  return parseFloat(value) / 1e18;
});

import VueCurrencyFilter from "vue-currency-filter";

Vue.use(VueCurrencyFilter, [
  {
    symbol: "",
    thousandsSeparator: ",",
    fractionCount: 0,
    fractionSeparator: ".",
    symbolPosition: "front",
    symbolSpacing: false,
  },
]);

Vue.filter("shortEth", function (value) {
  if (!value) return value;

  return `
  ${value.substr(0, 7)}...${value.substr(value.length - 5, value.length)}
  `;
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
