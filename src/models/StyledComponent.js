// @flow

import { createElement } from 'react'

import type { Theme } from './ThemeProvider'
import createWarnTooManyClasses from '../utils/createWarnTooManyClasses'

import validAttr from '../utils/validAttr'
import isTag from '../utils/isTag'
import type { RuleSet, Target } from '../types'

import AbstractStyledComponent from './AbstractStyledComponent'
import { CHANNEL } from './ThemeProvider'

export default (ComponentStyle: Function, constructWithOptions: Function) => {
  /* We depend on components having unique IDs */
  const identifiers = {}
  const generateId = (_displayName: string) => {
    const displayName = _displayName
      .replace(/[[\].#*$><+~=|^:(),"'`]/g, '-') // Replace all possible CSS selectors
      .replace(/--+/g, '-') // Replace multiple -- with single -
    const nr = (identifiers[displayName] || 0) + 1
    identifiers[displayName] = nr
    const hash = ComponentStyle.generateName(displayName + nr)
    return `${displayName}-${hash}`
  }

  class BaseStyledComponent extends AbstractStyledComponent {
    static target: Target
    static styledComponentId: string
    static attrs: Object
    static componentStyle: Object
    static warnTooManyClasses: Function

    attrs = {}
    state = {
      theme: null,
      generatedClassName: '',
    }

    buildExecutionContext(theme: any, props: any) {
      const { attrs } = this.constructor
      const context = { ...props, theme }
      if (attrs === undefined) {
        return context
      }

      this.attrs = Object.keys(attrs).reduce((acc, key) => {
        const attr = attrs[key]
        // eslint-disable-next-line no-param-reassign
        acc[key] = typeof attr === 'function' ? attr(context) : attr
        return acc
      }, {})

      return { ...context, ...this.attrs }
    }

    generateAndInjectStyles(theme: any, props: any) {
      const { componentStyle } = this.constructor
      const executionContext = this.buildExecutionContext(theme, props)
      const className = componentStyle.generateAndInjectStyles(executionContext)

      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        const { warnTooManyClasses } = this.constructor
        warnTooManyClasses(className)
      }

      return className
    }

    componentWillMount() {
      // If there is a theme in the context, subscribe to the event emitter. This
      // is necessary due to pure components blocking context updates, this circumvents
      // that by updating when an event is emitted
      if (this.context[CHANNEL]) {
        const subscribe = this.context[CHANNEL]
        this.unsubscribe = subscribe(nextTheme => {
          // This will be called once immediately

          // Props should take precedence over ThemeProvider, which should take precedence over
          // defaultProps, but React automatically puts defaultProps on props.
          const { defaultProps } = this.constructor
          const isDefaultTheme = defaultProps && this.props.theme === defaultProps.theme
          const theme = this.props.theme && !isDefaultTheme ? this.props.theme : nextTheme
          const generatedClassName = this.generateAndInjectStyles(theme, this.props)
          this.setState({ theme, generatedClassName })
        })
      } else {
        const theme = this.props.theme || {}
        const generatedClassName = this.generateAndInjectStyles(
          theme,
          this.props,
        )
        this.setState({ theme, generatedClassName })
      }
    }

    componentWillReceiveProps(nextProps: { theme?: Theme, [key: string]: any }) {
      this.setState((oldState) => {
        // Props should take precedence over ThemeProvider, which should take precedence over
        // defaultProps, but React automatically puts defaultProps on props.
        const { defaultProps } = this.constructor
        const isDefaultTheme = defaultProps && nextProps.theme === defaultProps.theme
        const theme = nextProps.theme && !isDefaultTheme ? nextProps.theme : oldState.theme
        const generatedClassName = this.generateAndInjectStyles(theme, nextProps)

        return { theme, generatedClassName }
      })
    }

    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe()
      }
    }

    render() {
      const { children, innerRef } = this.props
      const { generatedClassName } = this.state
      const { styledComponentId, target } = this.constructor

      const isTargetTag = isTag(target)

      const className = [
        this.props.className,
        styledComponentId,
        this.attrs.className,
        generatedClassName,
      ].filter(Boolean).join(' ')

      const propsForElement = Object
        .keys(this.props)
        .reduce((acc, propName) => {
          // Don't pass through non HTML tags through to HTML elements
          if (!isTargetTag || validAttr(propName)) {
            // eslint-disable-next-line no-param-reassign
            acc[propName] = this.props[propName]
          }

          return acc
        }, {
          ...this.attrs,
          className,
          ref: innerRef,
          innerRef: undefined,
        })

      return createElement(target, propsForElement, children)
    }
  }

  const createStyledComponent = (
    target: Target,
    options: Object,
    rules: RuleSet,
  ) => {
    const {
      displayName = isTag(target) ? `styled.${target}` : `Styled(${target.displayName})`,
      componentId = generateId(options.displayName || 'sc'),
      ParentComponent = BaseStyledComponent,
      rules: extendingRules,
      attrs,
    } = options

    const warnTooManyClasses = createWarnTooManyClasses(displayName)
    const componentStyle = new ComponentStyle(
      extendingRules === undefined ? rules : extendingRules.concat(rules),
      componentId,
    )

    class StyledComponent extends ParentComponent {
      static displayName = displayName
      static styledComponentId = componentId
      static attrs = attrs
      static componentStyle = componentStyle
      static warnTooManyClasses = warnTooManyClasses
      static target = target

      static extendWith(tag) {
        const { displayName: _, componentId: __, ...optionsToCopy } = options
        const newOptions = { ...optionsToCopy, rules, ParentComponent: StyledComponent }
        return constructWithOptions(createStyledComponent, tag, newOptions)
      }

      static get extend() {
        return StyledComponent.extendWith(target)
      }
    }

    return StyledComponent
  }

  return createStyledComponent
}
