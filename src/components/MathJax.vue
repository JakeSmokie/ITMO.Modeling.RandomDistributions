<template>
  <div>
    <vue-mathjax :formula="formula"></vue-mathjax>
    <div class="slot-wrapper d-none">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: "MathJax",

    data() {
      return {
        formula: ''
      }
    },

    updated() {
      this.formula = `$$ ${this.$el.getElementsByClassName('slot-wrapper')[0].innerHTML} $$`;
    }
  }
</script>

<style scoped>

</style>