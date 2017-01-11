// @flow
import css from './css'
import type { Interpolation, Target } from '../types'

const constructWithOptions = (componentConstructor: Function,
                              tag: Target,
                              options: Object = {}) => {
  /* This is callable directly as a template function */
  const templateFunction =
    (strings: Array<string>, ...interpolations: Array<Interpolation>) =>
      componentConstructor(tag, options, css(strings, ...interpolations))

  /* If config methods are called, wrap up a new template function and merge options */
  templateFunction.withConfig = config =>
    constructWithOptions(componentConstructor, tag, { ...options, ...config })
  templateFunction.attrs = attrs =>
    constructWithOptions(componentConstructor, tag, { ...options, attrs })

  return templateFunction
}

export default constructWithOptions
