<template>
  <b-container
    fluid
    class="main"
  >
    <b-row
      class="px-5"
      align-h="center"
    >
      <b-col cols="auto">
        <b-card>
          <b-form-group
            :state="nameState"
            invalid-feedback="Введённая строка не является ФИО"
          >
            <b-input-group prepend="Ваше ФИО">
              <b-form-input
                aria-describedby="input-live-help input-live-feedback"
                autofocus
                id="input-live"
                trim
                v-model="name"
                :state="nameState"
              ></b-form-input>
            </b-input-group>
          </b-form-group>

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
                max="1000"
                step="50"
              />
            </b-form-group>
          </b-card>

          <template v-if="coefficients">
            <div class="mt-4 d-flex flex-row">
              <div class="mr-4 text-monospace text-left text-nowrap fit-content d-flex flex-row">
                <b-card class="mr-4">
                  <katex>
                    Ф = {{ fullName.surname.length || 0 }} \\
                    И = {{ fullName.name.length }} \\
                    О = {{ fullName.fatherName.length }} \\
                  </katex>
                </b-card>
                <b-card>
                  <katex>
                    {{ fullCoefficientsFormula }}
                  </katex>
                </b-card>
              </div>
              <b-card class="w-100">
                <katex>
                  M = {{ coefficientsValues.Expected }} \\
                  \sigma = {{ standardDerivation }} \\
                  D = {{ variance }} \\
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
                {{ coefficientsValues.VariationCoefficient }} * {{ coefficientsValues.Expected }} =
                {{ standardDerivation }} \\ \: \\

                D = \sigma^2 = {{ variance }} \\ \: \\
                D = \frac{1}{12}(b - a)^2 = \frac{1}{12}(M + l - (M - l))^2 = \frac{1}{3}l^2 \\ \: \\
                \frac{1}{3}l^2 = {{ variance }} \qquad
                l = \sqrt{ {{ variance }} * 3 } = \sqrt{ {{ variance * 3 }} } = {{ radius | truncateNumber }}
              </katex>
            </b-card>

            <b-button
              block
              variant="outline-primary"
              class="mt-4"
              v-on:click="generateValues()"
            >
              Сгенерировать значения
            </b-button>
          </template>
        </b-card>
      </b-col>

      <b-col cols="4">
        <b-card class="text-left">
          <div>
            <template v-for="[k, xs] in histogram">
              {{ k }} = {{ xs }} <br>
            </template>
          </div>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>
<script>
  import {debounce, roundBy, truncateNumber} from '../utils';
  import Katex from "../components/Katex";
  import {MersenneTwister19937, real} from "random-js";

  export default {
    components: {Katex},
    data() {
      return {
        name: '',
        valuesCount: 500,
        values: [],
        formulasShown: true,
        debounce: debounce(x => this.name = x, 0)
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
          .groupBy(x => roundBy(x, 50))
          .map(([k, xs]) => [k, xs.length]);
      }
    },

    methods: {
      generateValues() {
        const mt = MersenneTwister19937.seed(this.coefficients.Seed);
        const random = () => real(this.leftEdge, this.rightEdge, true)(mt);

        this.values = [...Array(Number(this.valuesCount)).keys()]
          .map(random);
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
</style>
