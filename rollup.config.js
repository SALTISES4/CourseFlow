import "core-js/stable";
import "regenerator-runtime/runtime";
import autoprefixer from 'autoprefixer';
import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
import react from 'react';
import reactDom from 'react-dom';

const plugins = [
  postcss({
    extensions: [".css"],
      extract:true,
      plugins:[
          autoprefixer,
      ]
  }),
  resolve({
    mainFields: ["browser", "module", "main"]
  }),
  babel({
    babelrc: false,
    exclude: ["node_modules/**"],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      ["@babel/plugin-transform-react-jsx"]
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
  commonjs({
    include: 'node_modules/**',
    namedExports:{
      'node_modules/react-is/index.js':['isValidElementType','isContextConsumer'],
      'react': Object.keys(react),
      'react-dom':Object.keys(reactDom),
    }
  }),
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
    input: "course_flow/static/course_flow/js/scripts-wf-redux.js",
    output: {
      file: "course_flow/static/course_flow/js/scripts-wf-redux.min.js",
      name: "renderers",
      format: "iife",
      sourceMap: "inline"
    },
    plugins: plugins
  },
];
