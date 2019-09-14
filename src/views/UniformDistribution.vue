<template>
  <b-container
    fluid
    class="mt-4"
  >
    <b-card class="main mx-auto">
      <b-input-group prepend="Ваше ФИО">
        <b-form-input
          :state="nameState"
          aria-describedby="input-live-help input-live-feedback"
          autofocus
          id="input-live"
          trim
          v-model="name"
        ></b-form-input>
        <b-form-invalid-feedback id="input-live-feedback">
          Введённая строка не является ФИО
        </b-form-invalid-feedback>
      </b-input-group>

      <b-card
        no-body
        class="p-2 mt-4"
      >
        <b-form-group
          class="mb-0"
          label-cols="3"
          description="Количество генерируемых значений"
          label-for="range"
          label-align="center"
        >
          <template v-slot:label>
            <katex class="mt-2">N = {{ valuesCount }}</katex>
          </template>

          <b-form-input
            class="pt-3 px-3"
            id="range"
            v-model="valuesCount"
            type="range"
            min="50"
            max="10000"
            step="50"
            v-on:change="generateValues()"
          />
        </b-form-group>
      </b-card>

      <template v-if="coefficients">
        <div class="mt-4 d-flex flex-row">
          <div class="mr-4 text-nowrap text-left">
            <b-card>
              <katex>
                Ф = {{ fullName.surname.length || 0 }} \\
                И = {{ fullName.name.length }} \\
                О = {{ fullName.fatherName.length }} \\ \: \\

                {{ fullCoefficientsFormula }}
              </katex>
            </b-card>
          </div>
          <b-card class="w-100">
            <katex class="my-auto">
              V = {{ coefficientsValues.VariationCoefficient | truncateNumber }} \\
              M_{теор} = {{ coefficientsValues.Expected }} \\ \: \\
              \sigma_{теор} = {{ standardDerivation | truncateNumber }} \\
              D_{теор} = {{ variance | truncateNumber }} \\ \: \\
              l = {{ radius | truncateNumber }} \\
              a = {{ leftEdge | truncateNumber }} \\
              b = {{ rightEdge | truncateNumber }} \\
            </katex>
          </b-card>
        </div>

        <b-card class="mt-4">
          <katex>
            V = \frac{\sigma}{\overline{x}} \qquad
            \sigma = V * \overline{x} = V * M =
            {{ coefficientsValues.VariationCoefficient | truncateNumber }} * {{ coefficientsValues.Expected }} =
            {{ standardDerivation | truncateNumber }} \\ \: \\

            D = \sigma^2 = {{ variance | truncateNumber }} \\ \: \\
            D_{uniform} = \frac{1}{12}(b - a)^2 = \frac{1}{12}(M + l - (M - l))^2 = \frac{1}{3}l^2 \\ \: \\
            \frac{1}{3}l^2 = {{ variance | truncateNumber }} \qquad
            l = \sqrt{ {{ variance | truncateNumber }} * 3 } = \sqrt{ {{ variance * 3 | truncateNumber }} } = {{ radius | truncateNumber }}
          </katex>
        </b-card>

        <b-button
          v-if="false"
          block
          variant="outline-primary"
          class="mt-4"
          v-on:click="generateValues()"
        >
          Сгенерировать значения
        </b-button>
      </template>
    </b-card>

    <div v-if="values.length > 0">
      <b-card class="main mx-auto mt-4">
        <katex>
          M_{экс} = {{ actualExpectedValue | truncateNumber }}
        </katex>
      </b-card>
      <b-card class="text-left mt-4">
        <line-chart
          :chartdata="densityChart"
          :options="options"
        />
      </b-card>
      <b-card class="text-left mt-4">
        <line-chart
          :chartdata="distributionChart"
          :options="options"
        />
      </b-card>
    </div>
  </b-container>
</template>
<script>
  import {debounce, roundBy, sleep, truncateNumber} from '../utils';
  import Katex from "../components/Katex";
  import {MersenneTwister19937, real} from "random-js";
  import LineChart from "../components/LineChart.js";

  export default {
    components: {LineChart, Katex},
    data() {
      return {
        name: '',
        valuesCount: 500,
        values: [],
        formulasShown: true,
        debounce: debounce(x => this.name = x, 0),
        step: 10,

        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      }
    },

    mounted() {
      this.name = 'Айгузин Иван Олегович';
    },

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
          Expected: {label: "А", formula: `${A} * 100`, result: A * 100},
          VariationCoefficient: {label: "Б", formula: `1 / ${B}`, result: 1 / B},
          C: {label: "В", formula: `${A} - ${C} * 10`, result: A - C * 10},
          D: {label: "Г", formula: `3 + ${A}`, result: 3 + A},
          E: {label: "Д", formula: `1 + ${C} / ${B}`, result: 1 + C / B},
          Seed: {label: "Е", formula: `(${A} * ${B}) + ${C}`, result: (A * B) + C},
        }
      },

      coefficientsValues() {
        return Object.fromEntries(
          Object.entries(this.coefficients)
            .map(([key, {result}]) => [key, result])
        )
      },

      standardDerivation() {
        return this.coefficientsValues.VariationCoefficient * this.coefficientsValues.Expected;
      },

      variance() {
        return this.standardDerivation * this.standardDerivation
      },

      radius() {
        return Math.sqrt(this.variance * 3);
      },

      leftEdge() {
        return this.coefficientsValues.Expected - this.radius;
      },

      rightEdge() {
        return this.coefficientsValues.Expected + this.radius;
      },

      fullCoefficientsFormula() {
        return Object.values(this.coefficients)
          .map(({label, formula, result}) => `${label} = ${formula} = ${truncateNumber(result)}`)
          .join('\\\\');
      },

      histogram() {
        return this.values
          .groupBy(x => roundBy(x, this.step))
          .map(([k, xs]) => [Number(k), xs.length / this.values.length]);
      },

      densityChart() {
        return {
          labels: this.histogram.map(([k]) => k),
          datasets: [{
            label: 'Actual density',
            backgroundColor: 'rgba(248,121,121, 0.3)',
            data: this.histogram.map(([, xs]) => xs)
          }, {
            label: 'Expected density',
            backgroundColor: 'rgba(0,255,180,0.3)',
            data: this.histogram.map(([k], i) => {
              if (i === 0) {
                return (k + this.step - this.leftEdge) / (2 * this.radius);
              }

              if (i === this.histogram.length - 1) {
                return (this.rightEdge - k) / (2 * this.radius);
              }

              return this.step / (2 * this.radius);
            })
          }]
        }
      },

      distributionChart() {
        return {
          labels: this.histogram.map(([k]) => k),
          datasets: [{
            label: 'Actual distribution',
            backgroundColor: 'rgba(248,121,121, 0.3)',
            data: this.calcDistribution(this.histogram.map(([, density]) => density))
              .map(x => x.toFixed(3))
          }, {
            label: 'Expected distribution',
            backgroundColor: 'rgba(0,255,180,0.3)',
            data: this.calcDistribution(
              this.histogram
                .map(([k]) => k)
                .map(this.calcSectionLength)
                .map(k => k / (2 * this.radius))
            ).map(x => x.toFixed(3))
          }]
        }
      },

      actualExpectedValue() {
        return this.histogram
          .map(([k, p]) => k * p)
          .reduce((acc, x) => acc + x, 0);
      },
    },

    methods: {
      async generateValues() {
        this.values = [];
        await sleep(50);

        const mt = MersenneTwister19937.seed(this.coefficientsValues.Seed);
        const random = () => real(this.leftEdge, this.rightEdge, true)(mt);

        this.values = [...Array(Number(this.valuesCount)).keys()].map(random);
      },

      calcDistribution(densities) {
        return densities.reduce((acc, density) => {
          if (acc) {
            acc.push(density + acc[acc.length - 1]);
          }

          return acc || [density];
        }, null)
      },

      calcSectionLength(k, i, arr) {
        if (i === 0) {
          return k + this.step - this.leftEdge;
        }

        if (i === arr.length - 1) {
          return this.rightEdge - k;
        }

        return this.step;
      }
    },

    filters: {
      truncateNumber(x) {
        return truncateNumber(x);
      }
    }
  }
</script>
<style scoped>
  .main {
    width: fit-content;
  }
</style>
