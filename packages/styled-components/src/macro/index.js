// @flow

import { createMacro, MacroError } from 'babel-plugin-macros';
import babelPlugin from 'babel-plugin-styled-components';
import { addDefault, addNamed } from '@babel/helper-module-imports';

function styledComponentsMacro({ references, state, babel: { types: t }, config = {} }) {
  const allowedImports = [
    'default',
    'createGlobalStyle',
    'css',
    'isStyledComponent',
    'keyframes',
    'ServerStyleSheet',
    'StyleSheetConsumer',
    'StyleSheetContext',
    'StyleSheetManager',
    'ThemeConsumer',
    'ThemeContext',
    'ThemeProvider',
    'withTheme'
  ];

  const program = state.file.path;

  // FIRST STEP : replace `styled-components/macro` by `styled-components
  // references looks like this
  // { default: [path, path], css: [path], ... }
  let customImportName;
  Object.keys(references).forEach(refName => {
    if (!allowedImports.includes(refName)) {
      throw new MacroError(
        `Invalid import: ${refName}. You can only import ${allowedImports.join(
          ', '
        )} from 'styled-components/macro'.`
      );
    }

    // generate new identifier
    let id;
    if (refName === 'default') {
      id = addDefault(program, 'styled-components', { nameHint: 'styled' });
      customImportName = id;
    } else {
      id = addNamed(program, refName, 'styled-components', { nameHint: refName });
    }

    // update references with the new identifiers
    references[refName].forEach(referencePath => {
      // eslint-disable-next-line no-param-reassign
      referencePath.node.name = id.name;
    });
  });

  // SECOND STEP : apply babel-plugin-styled-components to the file
  const stateWithOpts = { ...state, opts: config, customImportName };
  program.traverse(babelPlugin({ types: t }).visitor, stateWithOpts);
}

export default createMacro(styledComponentsMacro, {
  configName: 'styledComponents'
});
