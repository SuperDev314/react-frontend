import createStyledComponent from '../models/StyledComponent';
import { WebTarget } from '../types';
import domElements from '../utils/domElements';
import constructWithOptions from './constructWithOptions';

const styled = (tag: WebTarget) =>
  constructWithOptions<typeof createStyledComponent>(createStyledComponent, tag);

type BaseStyled = typeof styled;

const enhancedStyled = styled as BaseStyled &
  {
    [key in typeof domElements[number]]: ReturnType<BaseStyled>;
  };

// Shorthands for all valid HTML Elements
domElements.forEach(domElement => {
  enhancedStyled[domElement] = styled(domElement);
});

export default enhancedStyled;
