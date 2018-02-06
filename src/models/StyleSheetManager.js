// @flow
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import StyleSheet, { CONTEXT_KEY } from './StyleSheet'
import ServerStyleSheet from './ServerStyleSheet'
import { tagConstructorWithTarget } from './BrowserStyleSheet'

class StyleSheetManager extends Component {
  sheetInstance: StyleSheet
  props: {
    sheet?: StyleSheet | null,
    target?: HTMLElement | null,
  }

  getChildContext() {
    return { [CONTEXT_KEY]: this.sheetInstance }
  }

  componentWillMount() {
    if (this.props.sheet) {
      this.sheetInstance = this.props.sheet
    } else if (this.props.target) {
      this.sheetInstance = new StyleSheet(
        tagConstructorWithTarget(this.props.target)
      )
    } else {
      throw new Error('StyleSheetManager expects either a sheet or target prop')
    }
  }

  render() {
    /* eslint-disable react/prop-types */
    // Flow v0.43.1 will report an error accessing the `children` property,
    // but v0.47.0 will not. It is necessary to use a type cast instead of
    // a "fixme" comment to satisfy both Flow versions.
    return React.Children.only((this.props: any).children)
  }
}

StyleSheetManager.childContextTypes = {
  [CONTEXT_KEY]: PropTypes.oneOfType([
    PropTypes.instanceOf(StyleSheet),
    PropTypes.instanceOf(ServerStyleSheet),
  ]).isRequired,
}

StyleSheetManager.propTypes = {
  sheet: PropTypes.oneOfType([
    PropTypes.instanceOf(StyleSheet),
    PropTypes.instanceOf(ServerStyleSheet),
  ]),
  target: PropTypes.shape({
    appendChild: PropTypes.func.isRequired,
  }),
}

export default StyleSheetManager
