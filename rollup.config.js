import 'core-js';
import 'regenerator-runtime';
import autoprefixer from 'autoprefixer';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import react from 'react';
import reactDom from 'react-dom';
import path from 'path'

const bundleRoot = 'course_flow/static/course_flow/js/react/dist/'

const plugins = [

  // bug in postCSS polugin does not allow paths outside of the bundleRoot
  postcss({
    extensions: ['.css'],
    extract: 'course_flow.css',
    modules: true,
    plugins: [ autoprefixer ],
  }),
  nodeResolve({
    mainFields: ['browser', 'module', 'main']
  }),
  babel({
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
  commonjs({
    include: 'node_modules/**',
    namedExports:{
      'node_modules/react-is/index.js': ['isValidElementType', 'isContextConsumer'],
      'react': Object.keys(react),
      'react-dom': Object.keys(reactDom),
    }
  }),
  terser()
];

export default [
  {
    input: 'course_flow/static/course_flow/js/other/src/csrf-setup.js',
    external: ['jquery'],
    output: {
      file: 'course_flow/static/course_flow/js/other/dist/csrf-setup.min.js',
      name: 'root',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: plugins
  },
  {
    input: 'course_flow/static/course_flow/js/react/src/entry/scripts-wf-redux.js',
    output: {
      file: `${bundleRoot}scripts-wf-redux.min.js`,
      name: 'renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: plugins
  },
  {
    input: 'course_flow/static/course_flow/js/react/src/entry/scripts-live.js',
    output: {
      file: `${bundleRoot}scripts-live.min.js`,
      name: 'live_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: plugins
  },
  {
    input: 'course_flow/static/course_flow/js/react/src/entry/scripts-library.js',
    output: {
      file: `${bundleRoot}scripts-library.min.js`,
      name: 'library_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: plugins
  },
];
