// @flow
import hashStr from 'glamor/lib/hash'
import stylis from 'stylis'

import type { RuleSet, NameGenerator } from '../types'
import flatten from '../utils/flatten'
import styleSheet from './StyleSheet'

/*
 ComponentStyle is all the CSS-specific stuff, not
 the React-specific stuff.
 */
export default (nameGenerator: NameGenerator) => {
  const inserted = {}

  class ComponentStyle {
    rules: RuleSet
    componentId: string
    insertedRule: Object

    constructor(rules: RuleSet, componentId: string) {
      this.rules = rules
      this.componentId = componentId
      if (!styleSheet.injected) styleSheet.inject()
      this.insertedRule = styleSheet.insert(`.${componentId} {}`)
    }

    static generateName(str: string) {
      return nameGenerator(hashStr(str))
    }

    /*
     * Flattens a rule set into valid CSS
     * Hashes it, wraps the whole chunk in a ._hashName {}
     * Parses that with PostCSS then runs PostCSS-Nested on it
     * Returns the hash to be injected on render()
     * */
    generateAndInjectStyles(executionContext: Object) {
      const flatCSS = flatten(this.rules, executionContext).join('')
        .replace(/^\s*\/\/.*$/gm, '') // replace JS comments
      const hash = hashStr(this.componentId + flatCSS)
      if (!inserted[hash]) {
        const selector = nameGenerator(hash)
        inserted[hash] = selector
        const css = stylis(`.${selector}`, flatCSS, false, false)
        this.insertedRule.appendRule(css)
      }
      return inserted[hash]
    }
  }

  return ComponentStyle
}
