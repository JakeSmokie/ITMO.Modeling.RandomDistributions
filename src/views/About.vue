<template>
  <b-container
    fluid
    class="main"
  >
    <b-card>
      <b-input-group prepend="Ваше ФИО">
        <b-form-input
          id="input-live"
          v-model="name"
          :state="nameState"
          aria-describedby="input-live-help input-live-feedback"
          trim
          autofocus
        ></b-form-input>

        <b-form-invalid-feedback id="input-live-feedback">
          Введённая строка не является ФИО
        </b-form-invalid-feedback>
      </b-input-group>

      <b-card no-body class="p-2 mt-4">
        <b-form-group
          class="mb-0"
          label-cols="2"
          description="Количество генерируемых значений"
          :label="`N = ${numbersAmount}`"
          label-for="range"
          label-align="right"
        >
          <b-form-input
            class="pt-3 px-3"
            id="range"
            v-model="numbersAmount"
            type="range"
            min="50"
            max="1000"
            step="50"
          />
        </b-form-group>

      </b-card>

      <div
        v-if="coefficients"
        class="mt-4 d-flex flex-row"
      >
        <div class="mr-4 text-monospace text-left text-nowrap fit-content">
          <b-card>
            <div>Ф = {{ fullName.surname.length }}</div>
            <div>И = {{ fullName.name.length }}</div>
            <div>О = {{ fullName.fatherName.length }}</div>
          </b-card>
          <b-card class="mt-4">
            <div v-for="{label, formula, result} in Object.values(coefficients)">
              {{ label }} = {{ formula }} = {{ result }}
            </div>
          </b-card>
        </div>
        <b-card class="w-100">

        </b-card>
      </div>
    </b-card>
  </b-container>
</template>
<script>
  export default {
    computed: {
      nameState() {
        const length = this.name.split(' ').length;
        return length === 2 || length === 3;
      },

      fullName() {
        const full = this.name.split(' ');

        if (full.length < 2) {
          return null;
        }

        return {
          surname: full[0],
          name: full[1],
          fatherName: full[2] || full[1]
        }
      },

      coefficients() {
        const name = this.fullName;

        if (name === null) {
          return null
        }

        const A = name.surname.length;
        const B = name.name.length;
        const C = name.fatherName.length;

        return {
          A: {label: "А", formula: `${A} * 100`, result: A * 100},
          B: {label: "Б", formula: `1 / ${B}`, result: 1 / B},
          C: {label: "В", formula: `${A} - ${C} * 10`, result: A - C * 10},
          D: {label: "Г", formula: `3 + ${A}`, result: 3 + A},
          E: {label: "Д", formula: `1 + ${C} / ${B}`, result: 1 + C / B},
          F: {label: "Е", formula: `(${A} * ${B}) + ${C}`, result: (A * B) + C},
        }
      },
    },

    data() {
      return {
        name: '',
        numbersAmount: 500
      }
    }
  }
</script>
<style scoped>
  .main {
    max-width: 600px;
  }
</style>
