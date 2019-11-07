/* eslint-disable flowtype/require-valid-file-annotation, no-console, import/extensions */
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import flow from 'rollup-plugin-flow';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps';
import pkg from './package.json';

// rollup-plugin-ignore stopped working, so we'll just remove the import lines 😐
const propTypeIgnore = { "import PropTypes from 'prop-types';": "'';" };
const streamIgnore = { "import stream from 'stream';": "'';" };

const cjs = {
  exports: 'named',
  format: 'cjs',
  sourcemap: true,
};

const esm = {
  format: 'esm',
  sourcemap: true,
};

const getCJS = override => ({ ...cjs, ...override });
const getESM = override => ({ ...esm, ...override });

const commonPlugins = [
  flow({
    // needed for sourcemaps to be properly generated
    pretty: true,
  }),
  sourceMaps(),
  json(),
  nodeResolve(),
  babel({
    configFile: require.resolve('../../babel.config.js'),
    exclude: ['node_modules/**', '../../node_modules/**'],
    plugins: ['@babel/plugin-external-helpers']
  }),
  commonjs({
    ignoreGlobal: true,
    namedExports: {
      'react-is': ['isElement', 'isValidElementType', 'ForwardRef'],
    },
  }),
  replace({
    __VERSION__: JSON.stringify(pkg.version),
  }),
];

const prodPlugins = [
  replace({
    ...propTypeIgnore,
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  terser({
    sourcemap: true,
  }),
];

const configBase = {
  input: './src/index.js',

  // \0 is rollup convention for generated in memory modules
  external: id => !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/'),
  plugins: commonPlugins,
};

const globals = { react: 'React', 'react-dom': 'ReactDOM' };

const standaloneBaseConfig = {
  ...configBase,
  input: './src/index-standalone.js',
  output: {
    file: 'dist/styled-components.js',
    format: 'umd',
    globals,
    name: 'styled',
    sourcemap: true,
  },
  external: Object.keys(globals),
  plugins: configBase.plugins.concat(
    replace({
      ...streamIgnore,
      __SERVER__: JSON.stringify(false),
    })
  ),
};

const standaloneConfig = {
  ...standaloneBaseConfig,
  plugins: standaloneBaseConfig.plugins.concat(
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
    })
  ),
};

const standaloneProdConfig = {
  ...standaloneBaseConfig,
  output: {
    ...standaloneBaseConfig.output,
    file: 'dist/styled-components.min.js',
  },
  plugins: standaloneBaseConfig.plugins.concat(prodPlugins),
};

const serverConfig = {
  ...configBase,
  output: [
    getESM({ file: 'dist/styled-components.esm.js' }),
    getCJS({ file: 'dist/styled-components.cjs.js' }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      __SERVER__: JSON.stringify(true),
    })
  ),
};

const browserConfig = {
  ...configBase,
  output: [
    getESM({ file: 'dist/styled-components.browser.esm.js' }),
    getCJS({ file: 'dist/styled-components.browser.cjs.js' }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      ...streamIgnore,
      __SERVER__: JSON.stringify(false),
    })
  ),
};

const nativeConfig = {
  ...configBase,
  input: './src/native/index.js',
  output: [
    getCJS({
      file: 'native/dist/styled-components.native.cjs.js',
    }),
    getESM({
      file: 'native/dist/styled-components.native.esm.js',
    }),
  ],
};

const primitivesConfig = {
  ...configBase,
  input: './src/primitives/index.js',
  output: [
    getESM({ file: 'primitives/dist/styled-components-primitives.esm.js' }),
    getCJS({
      file: 'primitives/dist/styled-components-primitives.cjs.js',
    }),
  ],
  plugins: configBase.plugins.concat(
    replace({
      __SERVER__: JSON.stringify(true),
    })
  ),
};

const macroConfig = Object.assign({}, configBase, {
  input: './src/macro/index.js',
  output: [
    getESM({ file: 'dist/styled-components-macro.esm.js' }),
    getCJS({ file: 'dist/styled-components-macro.cjs.js' }),
  ],
});

export default [
  standaloneConfig,
  standaloneProdConfig,
  serverConfig,
  browserConfig,
  nativeConfig,
  primitivesConfig,
  macroConfig,
];
