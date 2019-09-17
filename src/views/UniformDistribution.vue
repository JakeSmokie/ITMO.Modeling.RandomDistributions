<template>
  <b-container
    fluid
    class="p-4"
  >
    <div class="d-flex flex-row align-items-start">
      <div class="main text-center">
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
              max="20000"
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
                \sigma_{теор} = {{ standardDerivation | truncate }} \\
                D_{теор} = {{ variance | truncate }} \\ \: \\
                l = {{ radius | truncate }} \\
                a = {{ leftEdge | truncate }} \\
                b = {{ rightEdge | truncate }} \\
              </katex>
            </b-card>
          </div>

          <b-card class="mt-4">
            <katex>
              V = \frac{\sigma}{\overline{x}} \qquad
              \sigma = V * \overline{x} = V * M =
              {{ coefficientsValues.VariationCoefficient | truncate }} * {{ coefficientsValues.Expected }} =
              {{ standardDerivation | truncate }} \\ \: \\

              D = \sigma^2 = {{ variance | truncate }} \\ \: \\
              D_{uniform} = \frac{1}{12}(b - a)^2 = \frac{1}{12}(M + l - (M - l))^2 = \frac{1}{3}l^2 \\ \: \\
              \frac{1}{3}l^2 = {{ variance | truncate }} \qquad
              l = \sqrt{ {{ variance | truncate }} * 3 } = \sqrt{ {{ variance * 3 | truncate }} } = {{ radius | truncate
              }}
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
      </div>
      <b-card
        v-if="coefficients && values.length > 0"
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
        smallStep: 1,

        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      }
    },

    mounted() {
      this.name = '';
      this.generateValues();
    },

    computed: {
      step() {
        return this.radius / 25;
      },

      bigStep() {
        return this.step * 5;
      },

      midBigStep() {
        return this.radius / 10;
      },

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
          Seed: {label: "Е", formula: `(${A} * ${B}) + ${C}`, result: (A * B) + C},
        }
      },

      coefficientsValues() {
        return Object.fromEntries(
          Object.entries(this.coefficients || {})
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

      densityHistogram() {
        return step => this.values
          .groupBy(x => roundBy(x, step))
          .map(([k, xs]) => [Number(k), xs.length / this.values.length / step]);
      },

      countHistogram() {
        return step => this.values
          .groupBy(x => roundBy(x, step))
          .map(([k, xs]) => [Number(k), xs.length]);
      },

      densityChart() {
        const step = this.step;

        return {
          labels: this.densityHistogram(step).map(([k]) => k.toFixed(0)),
          datasets: [
            {
              label: 'Actual density',
              backgroundColor: 'rgba(0,220,24,0.3)',
              data: this.densityHistogram(step)
                .map(([, xs]) => xs)
                .map(x => x.toFixed(10))

            },
            {
              label: 'Expected density',
              backgroundColor: 'rgba(92,95,90,0.3)',
              data: this.densityHistogram(step)
                .map(() => 1 / (2 * this.radius))
                .map(x => x.toFixed(10))
            }]
        }
      },

      distributionChart() {
        const step = this.radius / 100;

        return {
          labels: this.densityHistogram(step).map(([k]) => k.toFixed(0)),
          datasets: [{
            label: 'Actual distribution',
            backgroundColor: 'rgba(0,220,24,0.3)',
            data: this.calcDistribution(this.densityHistogram(step).map(([, density]) => density))
              .map(x => x * step)
              .map(x => x.toFixed(4))
          }, {
            label: 'Expected distribution',
            backgroundColor: 'rgba(92,95,90,0.3)',
            data: this.densityHistogram(step)
              .map((_, i, arr) => i / arr.length)
              .map(x => x.toFixed(4))
          }]
        }
      },

      countChart() {
        const step = this.midBigStep;
        const histogram = this.countHistogram(step);

        return {
          labels: histogram.map(([k]) => k.toFixed(0)),
          datasets: [{
            label: 'Actual count',
            backgroundColor: 'rgba(0,220,24,0.3)',
            data: histogram.map(([, xs]) => xs)
          }, {
            label: 'Expected count',
            backgroundColor: 'rgba(92,95,90,0.3)',
            data: histogram
              .map(([k]) => k)
              .map(() => this.values.length / (2 * this.radius / step))
              .map(x => Math.ceil(x))
          }]
        }
      },

      actualExpectedValue() {
        return this.densityHistogram(this.smallStep)
          .map(([k, p]) => k * p)
          .reduce((acc, x) => acc + x, 0);
      },

      actualSquaredExpectedValue() {
        return this.densityHistogram(this.smallStep)
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

        if (!this.coefficients) {
          return;
        }

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
