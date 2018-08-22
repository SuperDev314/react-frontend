// @flow
import React from 'react'
import TestRenderer from 'react-test-renderer'

import _injectGlobal from '../injectGlobal'
import stringifyRules from '../../utils/stringifyRules'
import css from '../css'
import { expectCSSMatches, resetStyled } from '../../test/utils'

const injectGlobal = _injectGlobal(stringifyRules, css)

const styled = resetStyled()
const rule1 = 'width:100%;'
const rule2 = 'padding:10px;'
const rule3 = 'color:blue;'

describe('injectGlobal', () => {
  beforeEach(() => {
    resetStyled()
  })

  it(`should inject rules into the head`, () => {
    injectGlobal`
      html {
        ${rule1}
      }
    `
    expectCSSMatches(`
      html {
        ${rule1}
      }
    `)
  })

  it(`should non-destructively inject styles when called repeatedly`, () => {
    injectGlobal`
      html {
        ${rule1}
      }
    `

    injectGlobal`
      a {
        ${rule2}
      }
    `
    expectCSSMatches(`
      html {
        ${rule1}
      }
      a {
        ${rule2}
      }
    `)
  })

  it(`should non-destructively inject styles when called after a component`, () => {
    const Comp = styled.div`
      ${rule3};
    `
    TestRenderer.create(<Comp />)

    injectGlobal`
      html {
        ${rule1}
      }
    `

    expectCSSMatches(`
      .sc-a {}
      .b {
        ${rule3}
      }
      html {
        ${rule1}
      }
    `)
  })

  it('should extract @import rules into separate style tags', () => {
    injectGlobal`html { padding: 1px; }`
    const Comp = styled.div`
      color: green;
    `
    TestRenderer.create(<Comp />)
    injectGlobal`html { color: blue; } @import url('bla');`

    const style = Array.from(document.querySelectorAll('style'))
      .map(tag => tag.outerHTML)
      .join('\n')

    expect(style).toMatchSnapshot()
  })
})
