// @flow
import React, { createContext, Component, type Element } from 'react'
import memoize from 'memoize-one'
import StyledError from '../utils/error'

export type Theme = { [key: string]: mixed }
type Props = {
  children?: Element<any>,
  theme: Theme | ((outerTheme: Theme) => void),
}

const isFunction = test => typeof test === 'function'

const ThemeContext = createContext()

export const ThemeConsumer = ThemeContext.Consumer

/**
 * Provide a theme to an entire react component tree via context
 */
export default class ThemeProvider extends Component<Props> {
  getContext: (
    theme: Theme | ((outerTheme: Theme) => void),
    outerTheme?: Theme
  ) => Theme

  constructor(props: Props) {
    super(props)
    this.getContext = memoize(this.getContext.bind(this))
  }

  // Get the theme from the props, supporting both (outerTheme) => {} as well as object notation
  getTheme(theme: (outerTheme: ?Theme) => void, outerTheme: ?Theme) {
    if (isFunction(theme)) {
      const mergedTheme = theme(outerTheme)

      if (
        process.env.NODE_ENV !== 'production' &&
        (mergedTheme === null ||
          Array.isArray(mergedTheme) ||
          typeof mergedTheme !== 'object')
      ) {
        throw new StyledError(7)
      }

      return mergedTheme
    }

    if (theme === null || Array.isArray(theme) || typeof theme !== 'object') {
      throw new StyledError(8)
    }

    return { ...outerTheme, ...(theme: Theme) }
  }

  getContext(theme: (outerTheme: ?Theme) => void, outerTheme?: Theme) {
    return this.getTheme(theme, outerTheme)
  }

  render() {
    const { children, theme } = this.props

    if (!children) {
      return null
    }

    return (
      <ThemeContext.Consumer>
        {(outerTheme?: Theme) => {
          const context = this.getContext(theme, outerTheme)

          return (
            <ThemeContext.Provider value={context}>
              {React.Children.only(children)}
            </ThemeContext.Provider>
          )
        }}
      </ThemeContext.Consumer>
    )
  }
}
