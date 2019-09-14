<template>
  <b-container
    fluid
    class="p-4"
  >
    <div class="d-flex flex-row align-items-start">
      <b-card class="main text-center">
        <b-input-group prepend="Ваше ФИО">
          <b-form-input
            :state="nameState"
            aria-describedby="input-live-help input-live-feedback"
            autofocus
            id="input-live"
            trim
            v-model="name"
            v-on:update="generateValues()"
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
              <katex class="my-auto text-center">
                V = {{ coefficientsValues.VariationCoefficient | truncate }} \\
                M_{теор} = {{ coefficientsValues.Expected }} \\ \: \\

                \theta = {{ scale }}
              </katex>
            </b-card>
          </div>

          <b-card class="mt-4">
            <katex>
              M = k * \theta \qquad
              \theta = \frac{M}{k} =
              \frac{ {{ coefficientsValues.Expected }} }{ {{ coefficientsValues.Shape }} } =
              {{ scale | truncate }} \\

              D = k * \theta^2 =
              {{ coefficientsValues.Shape }} * {{ scale | truncate }}^2 =
              {{ variance | truncate }} \\
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
      <b-card
        v-if="values.length > 0"
        class="main ml-4 text-left"
      >
        <katex>
          M_{экс} = \sum{x_i * p_i} = {{ actualExpectedValue | truncate }} \\
          D_{экс} = M[x^2] - M^2[x] = {{ actualVariance | truncate }} \\
          \sigma_{экс} = \sqrt{D_{экс}} = {{ actualDerivation | truncate }} \\
          V_{экс} = \frac{\sigma_{экс}}{M_{экс}} = {{ actualVariationCoefficient | truncate(4)}} \\ \: \\

          \omega_M = \frac{M_{экс} - M_{теор}}{M_{теор}} = {{ expectedValueError * 100 | truncate(4)}} \% \\
          \omega_D = \frac{D_{экс} - D_{теор}}{D_{теор}} = {{ varianceError * 100 | truncate(4)}} \% \\
          \omega_\sigma = \frac{\sigma_{экс} - \sigma_{теор}}{\sigma_{теор}}
          = {{ derivationError * 100 | truncate(4)}} \% \\
          \omega_V = \frac{V_{экс} - V_{теор}}{V_{теор}} = {{ variationCoefficientError * 100 | truncate(4)}} \% \\

        </katex>
      </b-card>
    </div>

    <div v-if="values.length > 0">
      <b-card class="mt-4">
        <line-chart
          :chartdata="densityChart"
          :options="options"
        />
      </b-card>
      <b-card class="mt-4">
        <line-chart
          :chartdata="distributionChart"
          :options="options"
        />
      </b-card>
      <b-card class="mt-4">
        <bar-chart
          :chartdata="countChart"
          :options="options"
        />
      </b-card>
      <div class="mt-4"></div>
    </div>
  </b-container>
</template>
<script>
  import {debounce, roundBy, sleep, truncateNumber} from '../utils';
  import Katex from "../components/Katex";
  import {MersenneTwister19937, real} from "random-js";
  import LineChart from "../components/LineChart.js";
  import BarChart from "../components/BarChart";

  export default {
    components: {BarChart, LineChart, Katex},
    data() {
      return {
        name: '',
        valuesCount: 500,
        values: [],
        formulasShown: true,
        debounce: debounce(x => this.name = x, 0),
        step: 10,
        bigStep: 50,

        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      }
    },

    mounted() {
      this.name = 'Айгузин Иван Олегович';
      this.generateValues();
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
          Shape: {label: "Г", formula: `3 + ${A}`, result: 3 + A},
          Seed: {label: "Е", formula: `(${A} * ${B}) + ${C}`, result: (A * B) + C},
        }
      },

      coefficientsValues() {
        return Object.fromEntries(
          Object.entries(this.coefficients)
            .map(([key, {result}]) => [key, result])
        )
      },

      scale() {
        return this.coefficientsValues.Expected / this.coefficientsValues.Shape;
      },

      variance() {
        return this.coefficientsValues.Shape * this.scale * this.scale;
      },

      fullCoefficientsFormula() {
        return Object.values(this.coefficients)
          .map(({label, formula, result}) => `${label} = ${formula} = ${truncateNumber(result)}`)
          .join('\\\\');
      },

      densityHistogram() {
        return step => this.values
          .groupBy(x => roundBy(x, step))
          .map(([k, xs]) => [Number(k), xs.length / this.values.length]);
      },

      countHistogram() {
        return step => this.values
          .groupBy(x => roundBy(x, step))
          .map(([k, xs]) => [Number(k), xs.length]);
      },

      densityChart() {
        const step = this.step;

        return {
          labels: this.densityHistogram(step).map(([k]) => k),
          datasets: [{
            label: 'Actual density',
            backgroundColor: 'rgba(0,220,24,0.3)',
            data: this.densityHistogram(step)
              .map(([, xs]) => xs)
              .map(x => x.toFixed(3))
          }, {
            label: 'Expected density',
            backgroundColor: 'rgba(92,95,90,0.3)',
            data: this.densityHistogram(step)
              .map(([k]) => k)
              .map(this.calcSectionLength(step))
              .map(k => k / (2 * this.radius))
              .map(x => x.toFixed(3))
          }]
        }
      },

      distributionChart() {
        const step = this.step;

        return {
          labels: this.densityHistogram(step).map(([k]) => k),
          datasets: [{
            label: 'Actual distribution',
            backgroundColor: 'rgba(0,220,24,0.3)',
            data: this.calcDistribution(this.densityHistogram(step).map(([, density]) => density))
              .map(x => x.toFixed(4))
          }, {
            label: 'Expected distribution',
            backgroundColor: 'rgba(92,95,90,0.3)',
            data: this.calcDistribution(this.densityHistogram(step)
              .map(([k]) => k)
              .map(this.calcSectionLength(step))
              .map(k => k / (2 * this.radius))
            ).map(x => x.toFixed(4))
          }]
        }
      },

      countChart() {
        const step = this.bigStep;
        const histogram = this.countHistogram(step);

        return {
          labels: histogram.map(([k]) => k),
          datasets: [{
            label: 'Actual count',
            backgroundColor: 'rgba(0,220,24,0.3)',
            data: histogram.map(([, xs]) => xs)
          }, {
            label: 'Expected count',
            backgroundColor: 'rgba(92,95,90,0.3)',
            data: histogram
              .map(([k]) => k)
              .map(this.calcSectionLength(step))
              .map(k => this.values.length * k / (2 * this.radius))
              .map(x => x.toFixed(0))
          }]
        }
      },

      actualExpectedValue() {
        return this.densityHistogram(this.step)
          .map(([k, p]) => k * p)
          .reduce((acc, x) => acc + x, 0);
      },

      actualSquaredExpectedValue() {
        return this.densityHistogram(this.step)
          .map(([k, p]) => k * k * p)
          .reduce((acc, x) => acc + x, 0);
      },

      actualVariance() {
        return this.actualSquaredExpectedValue - this.actualExpectedValue * this.actualExpectedValue;
      },

      actualDerivation() {
        return Math.sqrt(this.actualVariance);
      },

      actualVariationCoefficient() {
        return this.actualDerivation / this.actualExpectedValue
      },

      expectedValueError() {
        return Math.abs(this.actualExpectedValue - this.coefficientsValues.Expected) / this.coefficientsValues.Expected
      },

      varianceError() {
        return Math.abs(this.actualVariance - this.variance) / this.variance
      },

      derivationError() {
        return Math.abs(this.actualDerivation - this.standardDerivation) / this.standardDerivation
      },

      variationCoefficientError() {
        return Math.abs(this.actualVariationCoefficient - this.coefficientsValues.VariationCoefficient) / this.coefficientsValues.VariationCoefficient
      }

    },

    methods: {
      async generateValues() {
        this.values = [];
        await sleep(0);

        const random = () => 0;

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

      calcSectionLength(step) {
        return (k, i, arr) => {
          if (i === 0) {
            return k + step - this.leftEdge;
          }

          if (i === arr.length - 1) {
            return this.rightEdge - k;
          }

          return step;
        }
      }
    },

    filters: {
      truncate(x, digits = 2) {
        return truncateNumber(x, digits);
      }
    }
  }
</script>
<style scoped>
  .main {
    width: fit-content;
  }
</style>
