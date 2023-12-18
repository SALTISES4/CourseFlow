import 'core-js'
import 'regenerator-runtime'
import autoprefixer from 'autoprefixer'
import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import multiEntry from '@rollup/plugin-multi-entry'
import postcss from 'rollup-plugin-postcss'

const templateBundleSrc = 'course_flow/static/course_flow/js/other/src/'
const templateBundleDist = 'course_flow/static/course_flow/js/other/dist/'
const bundleRoot = 'course_flow/static/course_flow/js/react/dist/'
const reactSrcRoot = 'course_flow/static/course_flow/js/react/src/'

const plugins = {
  // bug in postCSS polugin does not allow paths outside of the bundleRoot
  postcss: postcss({
    extensions: ['.css'],
    extract: 'course_flow.css',
    plugins: [autoprefixer]
  }),
  nodeResolve: nodeResolve({
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
          alias: {
            '@cfSCSS': './course_flow/static/course_flow/scss',
            '@cfModule': './course_flow/static/course_flow/js/react/src',
            '@cfPages':
              './course_flow/static/course_flow/js/react/src/Components/Pages',
            '@cfComponents':
              './course_flow/static/course_flow/js/react/src/Components/components',
            '@cfViews':
              './course_flow/static/course_flow/js/react/src/Components/Views',
            '@cfLibrary':
              './course_flow/static/course_flow/js/react/src/Components/components/MenuComponents/menus',
            '@cfCommonComponents':
              './course_flow/static/course_flow/js/react/src/Components/components/CommonComponents',
            '@cfParentComponents':
              './course_flow/static/course_flow/js/react/src/Components/components/CommonComponents/Extended',
            '@cfUIComponents':
              './course_flow/static/course_flow/js/react/src/Components/components/CommonComponents/UIComponents',
            '@cfFindState':
              './course_flow/static/course_flow/js/react/src/redux/FindState.js',
            '@cfReducers':
              './course_flow/static/course_flow/js/react/src/redux/Reducers.js',
            '@cfRedux': './course_flow/static/course_flow/js/react/src/redux',
            '@cfUtility':
              './course_flow/static/course_flow/js/react/src/UtilityFunctions.js',
            '@cfConstants':
              './course_flow/static/course_flow/js/react/src/Constants.js',
            '@XMLHTTP': './course_flow/static/course_flow/js/react/src/XMLHTTP'
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

const bundlePlugins = [
  plugins.postcss,
  plugins.nodeResolve,
  plugins.babel,
  plugins.commonjs
  // plugins.terser
]

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
      entryFileNames: '[name].min.js'
    },
    plugins: [multiEntry({ preserveModules: true }), plugins.terser]
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
    input: `${reactSrcRoot}app-redesign.js`,
    output: {
      file: `${bundleRoot}react-app-redesign.min.js`,
      name: 'redesign_renderers',
      format: 'iife',
      sourceMap: 'inline'
    },
    plugins: bundlePlugins
  }
]
