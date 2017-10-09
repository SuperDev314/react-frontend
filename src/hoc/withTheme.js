// @flow
/* globals ReactClass */

import React from 'react'
import PropTypes from 'prop-types'
import hoistStatics from 'hoist-non-react-statics'
import { CHANNEL, CHANNEL_NEXT, CONTEXT_CHANNEL_SHAPE } from '../models/ThemeProvider'
import _isStyledComponent from '../utils/isStyledComponent'
import determineTheme from '../utils/determineTheme'

const wrapWithTheme = (Component: ReactClass<any>) => {
  const componentName = (
    Component.displayName ||
    Component.name ||
    'Component'
  )

  const isStyledComponent = _isStyledComponent(Component)

  class WithTheme extends React.Component {
    static displayName = `WithTheme(${componentName})`

    // NOTE: This is so that isStyledComponent passes for the innerRef unwrapping
    static styledComponentId = 'withTheme'

    static contextTypes = {
      [CHANNEL]: PropTypes.func,
      [CHANNEL_NEXT]: CONTEXT_CHANNEL_SHAPE,
    };

    state: { theme?: ?Object } = {};
    unsubscribeId: number = -1

    componentWillMount() {
      const { defaultProps } = this.constructor
      const styledContext = this.context[CHANNEL_NEXT]
      const defaultTheme = determineTheme(this.props, undefined, defaultProps)
      if (!styledContext && !defaultTheme) {
        // eslint-disable-next-line no-console
        console.warn('[withTheme] You are not using a ThemeProvider nor passing a theme prop or a theme in defaultProps')
      } else if (!styledContext && defaultProps) {
        this.setState({ theme: defaultTheme })
      } else {
        const { subscribe } = styledContext
        this.unsubscribeId = subscribe(nextTheme => {
          const theme = determineTheme(this.props, nextTheme, defaultProps)
          this.setState({ theme })
        })
      }
    }

    componentWillUnmount() {
      if (this.unsubscribeId !== -1) {
        this.context[CHANNEL_NEXT].unsubscribe(this.unsubscribeId)
      }
    }

    render() {
      // eslint-disable-next-line react/prop-types
      const { innerRef } = this.props
      const { theme } = this.state

      return (
        <Component
          theme={theme}
          {...this.props}
          innerRef={isStyledComponent ? innerRef : undefined}
          ref={isStyledComponent ? undefined : innerRef}
        />
      )
    }
  }

  return hoistStatics(WithTheme, Component)
}

export default wrapWithTheme
