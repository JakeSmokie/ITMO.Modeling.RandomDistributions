<template>
  <div>
    <katex-element
      v-bind:expression="formula"
      strict="ignore"
    ></katex-element>
    <div class="slot-wrapper d-none">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Katex',

    data() {
      return {
        formula: ''
      }
    },

    updated() {
      this.render();
    },

    mounted() {
      this.render();
    },

    methods: {
      render() {
        this.formula = this.$el.getElementsByClassName('slot-wrapper')[0].innerHTML;
      }
    }
  }
</script>

<style scoped>

</style>