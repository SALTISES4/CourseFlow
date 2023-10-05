import 'core-js';
import 'regenerator-runtime';
import autoprefixer from 'autoprefixer';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import multiEntry from '@rollup/plugin-multi-entry';
import postcss from 'rollup-plugin-postcss';
import react from 'react';
import reactDom from 'react-dom';

const templateBundleSrc = 'course_flow/static/course_flow/js/other/src/'
const templateBundleDist = 'course_flow/static/course_flow/js/other/dist/'
const bundleRoot = 'course_flow/static/course_flow/js/react/dist/'
const bundleEntry = 'course_flow/static/course_flow/js/react/src/entry/'

const plugins = {
  // bug in postCSS polugin does not allow paths outside of the bundleRoot
  postcss: postcss({
    extensions: ['.css'],
    extract: 'course_flow.css',
    plugins: [ autoprefixer ],
  }),
  nodeResolve: nodeResolve({
    mainFields: ['browser', 'module', 'main']
  }),
  babel: babel({
    babelrc: false,
    exclude: ['node_modules/**'],
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-react-jsx'
    ],
    presets: [
      '@babel/preset-flow',
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: 'last 4 versions and >=0.2% in CA and not ie <= 11'
          },
          useBuiltIns: 'usage',
          corejs: 3
        }
      ]
    ]
  }),
  commonjs: commonjs({
    include: 'node_modules/**',
    // THe namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.
    // namedExports:{
    //   'node_modules/react-is/index.js': ['isValidElementType', 'isContextConsumer'],
    //   'react': Object.keys(react),
    //   'react-dom': Object.keys(reactDom),
    // }
  }),
  terser: terser()
};

const bundlePlugins = [
  plugins.postcss,
  plugins.nodeResolve,
  plugins.babel,
  plugins.commonjs,
  plugins.terser
];

export default [
  {
    input: {
      include: [`${templateBundleSrc}**/*.js`],
      exclude: [`${templateBundleSrc}csrf-setup.js`]
    },
    external: ['jquery'],
    output: {
      dir: templateBundleDist,
      preserveModules: true,
      entryFileNames: '[name].min.js',
    },
    plugins: [
      multiEntry({ preserveModules: true }),
      plugins.terser
    ]
  },
  {
    input: `${templateBundleSrc}csrf-setup.js`,
    external: ['jquery'],
    output: {
      file: `${templateBundleDist}csrf-setup.min.js`,
      name: 'root',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: bundlePlugins
  },
  {
    input: `${bundleEntry}scripts-wf-redux.js`,
    output: {
      file: `${bundleRoot}scripts-wf-redux.min.js`,
      name: 'renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: bundlePlugins
  },
  {
    input: `${bundleEntry}scripts-live.js`,
    output: {
      file: `${bundleRoot}scripts-live.min.js`,
      name: 'live_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: bundlePlugins
  },
  {
    input: `${bundleEntry}scripts-library.js`,
    output: {
      file: `${bundleRoot}scripts-library.min.js`,
      name: 'library_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: bundlePlugins
  },
];
