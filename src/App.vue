<template>
  <div class="d-flex flex-column flex-xl-row align-items-stretch">
    <div class="text-nowrap bg-light border-bottom shadow-sm min-vh-xl-100">
      <div
        class="border-bottom p-2 pl-4 font-weight-bold"
        style="font-size: 20px"
      >
        📗 Моделирование
      </div>
      <b-nav
        vertical
        class="p-2"
      >
        <b-nav-item to="/">Равномерное распределение</b-nav-item>
        <b-nav-item class="mt-n2" to="/gamma">Распределение Эрланга</b-nav-item>
      </b-nav>
    </div>

    <b-container
      fluid
      class="px-0"
    >
      <router-view/>
    </b-container>
  </div>
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

  $xs: 0;
  $sm: 576px;
  $md: 768px;
  $lg: 992px;
  $xl: 1200px;

  @media (min-width: $xl) {
    .min-vh-xl-100 {
      min-height: 100vh;
    }
  }
</style>