import "core-js/stable";
import "regenerator-runtime/runtime";
import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";

const plugins = [
  postcss({
    extensions: [".css"]
  }),
  resolve({
    mainFields: ["browser", "module", "main"]
  }),
  babel({
    babelrc: false,
    exclude: ["node_modules/**"],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      ["@babel/plugin-transform-react-jsx", { pragma: "h" }]
    ],
    presets: [
      "@babel/preset-flow",
      [
        "@babel/preset-env",
        {
          targets: {
            browsers: "last 4 versions and >=0.2% in CA and not ie <= 11"
          },
          useBuiltIns: "usage",
          corejs: 3
        }
      ]
    ]
  }),
  commonjs(),
  terser()
];

export default [
  {
    input: "course_flow/static/course_flow/js/scripts.js",
    output: {
      file: "course_flow/static/course_flow/js/scripts.min.js",
      name: "root",
      format: "iife",
      sourceMap: "inline"
    },
    plugins: plugins
  },
  {
    input: "course_flow/static/course_flow/js/scripts-wf.js",
    output: {
      file: "course_flow/static/course_flow/js/scripts-wf.min.js",
      name: "workflow",
      format: "iife",
      sourceMap: "inline"
    },
    plugins: plugins
  }
];
