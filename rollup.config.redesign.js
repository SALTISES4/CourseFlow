import 'core-js'
import 'regenerator-runtime'
import autoprefixer from 'autoprefixer'
import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import postcss from 'rollup-plugin-postcss'

const bundleRoot = 'course_flow/static/course_flow/js/react/dist/'
const bundleEntry = 'course_flow/static/course_flow/js/react/src/entry/'

const plugins = {
  // bug in postCSS polugin does not allow paths outside of the bundleRoot
  postcss: postcss({
    extensions: ['.css'],
    extract: 'course_flow.css',
    plugins: [autoprefixer]
  }),
  nodeResolve: nodeResolve({
    mainFields: ['browser', 'module', 'main']
  }),
  babel: babel({
    babelrc: false,
    exclude: ['node_modules/**'],
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-react-jsx',
      [
        'babel-plugin-module-resolver',
        {
          alias:{
            '@cfModule':'./course_flow/static/course_flow/js/react/src',
            '@cfComponents':'./course_flow/static/course_flow/js/react/src/Components/components',
            '@cfViews':'./course_flow/static/course_flow/js/react/src/Components/Views',
            '@cfCommon':'./course_flow/static/course_flow/js/react/src/Components/CommonComponents',
            '@cfFindState':'./course_flow/static/course_flow/js/react/src/redux/FindState.js',
            '@cfReducers':'./course_flow/static/course_flow/js/react/src/redux/Reducers.js',
            '@cfUtility':'./course_flow/static/course_flow/js/react/src/UtilityFunctions.js',
            '@cfConstants':'./course_flow/static/course_flow/js/react/src/Constants.js',
          }
        }
      ]
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
    include: 'node_modules/**'
  }),
  terser: terser()
}

export default [
  {
    input: `${bundleEntry}scripts-redesign.js`,
    output: {
      file: `${bundleRoot}scripts-redesign.min.js`,
      name: 'redesign_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: [
      plugins.postcss,
      plugins.nodeResolve,
      plugins.babel,
      plugins.commonjs,
      plugins.terser
    ]
  }
]
