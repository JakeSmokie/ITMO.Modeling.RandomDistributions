import '@babel/polyfill'
import 'mutationobserver-shim'
import Vue from "vue";
import './plugins/bootstrap-vue'
import App from "./App.vue";
import router from "./router";
import store from "./store";

require('mathjax').init({
  loader: {load: ['input/tex', 'output/svg']}
}).then((MathJax) => {
  const svg = MathJax.tex2svg('\\frac{1}{x^2-1}', {display: true});
  console.log(MathJax.startup.adaptor.outerHTML(svg));
}).catch((err) => console.log(err.message));

import VueMathjax from 'vue-mathjax'
Vue.use(VueMathjax);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
