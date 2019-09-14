<template>
  <b-container fluid>
    <router-view/>
  </b-container>
</template>

<style lang="scss">
  body {
    padding: 0;
    margin: 0;
  }

  .w-fit-content {
    width: fit-content !important;
  }

  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
</style>
