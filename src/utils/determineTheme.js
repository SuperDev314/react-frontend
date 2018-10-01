// @flow
import { EMPTY_OBJECT } from './empties';

type Props = {
  theme?: any,
};

export default (props: Props, fallbackTheme: any, defaultProps: any = EMPTY_OBJECT) => {
  // Props should take precedence over ThemeProvider, which should take precedence over
  // defaultProps, but React automatically puts defaultProps on props.

  /* eslint-disable react/prop-types, flowtype-errors/show-errors */
  const isDefaultTheme = defaultProps ? props.theme === defaultProps.theme : false;
  const theme = props.theme && !isDefaultTheme ? props.theme : fallbackTheme || defaultProps.theme;
  /* eslint-enable */

  return theme;
};
