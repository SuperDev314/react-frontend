import pluginTester from 'babel-plugin-tester';
import plugin from 'babel-plugin-macros';

const styledExampleCode = `
import styled from '../../macro'

styled.div\`
  background: \${p => (p.error ? 'red' : 'green')};
\`
`;

const cssExampleCode = `
import { css } from '../../macro'

css\`
  color: \${props => (props.whiteColor ? 'white' : 'black')};
\`
`;

const keyframesExampleCode = `
import { keyframes } from '../../macro'

keyframes\`
  0% { opacity: 0; }
  100% { opacity: 1; }
\`
`;

const createGlobalStyleExampleCode = `
import { createGlobalStyle } from '../../macro'

createGlobalStyle\`
  background: red;
\`
`;

const ThemeProviderExampleCode = `
import { ThemeProvider } from '../../macro'

React.createComponent(
  ThemeProvider, 
  { theme: { color: 'red' }}, 
  'hello'
)
`;

const extendsExampleCode = `
import React from 'react'
import styled from '../../macro'

const Hello = () => React.createComponent(div, null, 'hello')

styled(Hello)\`
  background: red;
\`
`;

const requireExampleCode = `
const myStyled = require('../../macro')

myStyled.div\`
  background: red;
\`
`;

const invalidExampleCode = `
import { UnknownImport } from '../../macro'
`;

pluginTester({
  title: 'macro',
  plugin,
  snapshot: true,
  babelOptions: { filename: __filename },
  tests: {
    'should work with styled': styledExampleCode,
    'should work with { css }': cssExampleCode,
    'should work with { keyframes }': keyframesExampleCode,
    'should work with { createGlobalStyle }': createGlobalStyleExampleCode,
    'should work with { ThemeProvider }': ThemeProviderExampleCode,
    'should work when extending a component': extendsExampleCode,
    'should work with require() to import styled-components': requireExampleCode,
    'should throw error when importing { UnknownImport }': {
      code: invalidExampleCode,
      error: true,
      snapshot: false,
    },
  },
});
