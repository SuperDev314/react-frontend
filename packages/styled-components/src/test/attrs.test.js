// @flow
import React, { Component } from 'react';
import TestRenderer from 'react-test-renderer';
import ThemeProvider from '../models/ThemeProvider';

import { resetStyled, expectCSSMatches } from './utils';

let styled;

describe('attrs', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn');
    styled = resetStyled();
  });

  it('work fine with an empty object', () => {
    const Comp = styled.div.attrs({})``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('pass a simple attr', () => {
    const Comp = styled.button.attrs({
      type: 'button',
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('pass a React component', () => {
    // $FlowFixMe
    class ReactComponent extends Component {
      render() {
        return <p>React Component</p>;
      }
    }

    const Button = ({ component: ChildComponent }) => (
      <button>
        <ChildComponent />
      </button>
    );

    const Comp = styled(Button).attrs({
      component: ReactComponent,
    })``;

    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('call an attr function', () => {
    console.warn.mockImplementation(() => {});
    const Comp = styled.button.attrs({
      as: () => 'div',
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();

    // deprecation message for fn as attrs object key
    expect(console.warn).toHaveBeenCalled();
  });

  it('pass a fn to attrs', () => {
    const Comp = styled.button.attrs(props => ({
      as: props.renderAs,
    }))``;
    expect(TestRenderer.create(<Comp renderAs="div" />).toJSON()).toMatchSnapshot();
  });

  it('function form allows access to theme', () => {
    const Comp = styled.button.attrs(props => ({
      'data-color': props.theme.color,
    }))``;

    expect(
      TestRenderer.create(
        <ThemeProvider theme={{ color: 'red' }}>
          <Comp />
        </ThemeProvider>
      ).toJSON()
    ).toMatchInlineSnapshot(`
<button
  className="sc-a b"
  data-color="red"
/>
`);
  });

  it('defaultProps are merged into what function attrs receives', () => {
    const Comp = styled.button.attrs(props => ({
      'data-color': props.theme.color,
    }))``;

    Comp.defaultProps = {
      theme: {
        color: 'red',
      },
    };

    expect(TestRenderer.create(<Comp />).toJSON()).toMatchInlineSnapshot(`
<button
  className="sc-a b"
  data-color="red"
/>
`);
  });

  it('pass props to the attr function', () => {
    const Comp = styled.button.attrs({
      type: props => (props.submit ? 'submit' : 'button'),
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
    expect(TestRenderer.create(<Comp submit />).toJSON()).toMatchSnapshot();
  });

  it('should replace attrs with props', () => {
    const Comp = styled.button.attrs({
      type: props => (props.submit ? 'submit' : 'button'),
      tabIndex: 0,
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
    expect(TestRenderer.create(<Comp type="reset" />).toJSON()).toMatchSnapshot();
    expect(TestRenderer.create(<Comp type="reset" tabIndex="-1" />).toJSON()).toMatchSnapshot();
  });

  it('should merge className', () => {
    const Comp = styled.div.attrs({
      className: 'meow nya',
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('should merge className even if its a function', () => {
    const Comp = styled.div.attrs({
      className: props => `meow ${props.purr ? 'purr' : 'nya'}`,
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
    expect(TestRenderer.create(<Comp purr />).toJSON()).toMatchSnapshot();
  });

  it('should work with data and aria attributes', () => {
    const Comp = styled.div.attrs({
      'data-foo': 'bar',
      'aria-label': 'A simple FooBar',
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('merge attrs', () => {
    const Comp = styled.button
      .attrs({
        type: 'button',
        tabIndex: 0,
      })
      .attrs({
        type: 'submit',
      })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('merge fn attrs', () => {
    const Comp = styled.button
      .attrs(() => ({
        type: 'button',
        tabIndex: 0,
      }))
      .attrs(() => ({
        type: 'submit',
      }))``;

    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('merge attrs when inheriting SC', () => {
    const Parent = styled.button.attrs({
      type: 'button',
      tabIndex: 0,
    })``;
    const Child = styled(Parent).attrs({
      type: 'submit',
    })``;
    expect(TestRenderer.create(<Child />).toJSON()).toMatchSnapshot();
  });

  it('pass attrs to style block', () => {
    /* Would be a React Router Link in real life */
    const Comp = styled.a.attrs({
      href: '#',
      'data-active-class-name': '--is-active',
    })`
      color: blue;
      &.${props => props['data-active-class-name']} {
        color: red;
      }
    `;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
    expectCSSMatches('.b { color:blue; } .b.--is-active { color:red; }');
  });

  it('should pass through children as a normal prop', () => {
    const Comp = styled.div.attrs({
      children: 'Probably a bad idea',
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('should pass through complex children as well', () => {
    const Comp = styled.div.attrs({
      children: <span>Probably a bad idea</span>,
    })``;
    expect(TestRenderer.create(<Comp />).toJSON()).toMatchSnapshot();
  });

  it('should override children of course', () => {
    const Comp = styled.div.attrs({
      children: <span>Amazing</span>,
    })``;
    expect(TestRenderer.create(<Comp>Something else</Comp>).toJSON()).toMatchSnapshot();
  });

  it('should shallow merge "style" prop + attr instead of overwriting', () => {
    const Paragraph = styled.p.attrs({
      style: props => ({
        ...props.style,
        fontSize: `${props.fontScale}em`,
      }),
    })``;

    class Text extends React.Component {
      state = {
        // Assume that will be changed automatically
        // according to the dimensions of the container
        fontScale: 4,
      };

      render() {
        return (
          <Paragraph
            className={this.props.className}
            style={this.props.style}
            fontScale={this.state.fontScale}
          >
            {this.props.children}
          </Paragraph>
        );
      }
    }

    const BlueText = styled(Text).attrs({
      style: () => ({
        color: 'blue',
      }),
    })``;

    expect(TestRenderer.create(<BlueText>Hello</BlueText>).toJSON()).toMatchSnapshot();
  });

  it('does not pass non html tags to HTML element', () => {
    const Comp = styled.div`
      color: ${props => props.textColor};
    `;

    const StyledComp = styled(Comp).attrs({
      textColor: 'red',
    })``;
    expect(TestRenderer.create(<StyledComp />).toJSON()).toMatchSnapshot();
  });

  describe('warnings', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('warns upon use of a Stateless Functional Component as a prop', () => {
      const Inner = () => <div />;
      const Comp = styled.div.attrs({ component: Inner })``;

      TestRenderer.create(<Comp />);

      expect(console.warn.mock.calls[1][0]).toMatchInlineSnapshot(`
"It looks like you've used a non styled-component as the value for the \\"component\\" prop in an object-form attrs constructor of \\"styled.div\\".
You should use the new function-form attrs constructor which avoids this issue: attrs(props => ({ yourStuff }))
To continue using the deprecated object syntax, you'll need to wrap your component prop in a function to make it available inside the styled component (you'll still get the deprecation warning though.)
For example, { component: () => InnerComponent } instead of { component: InnerComponent }"
`);
    });

    it('warns for using fns as attrs object keys', () => {
      const Comp = styled.div.attrs({ 'data-text-color': props => props.textColor })``;

      TestRenderer.create(<Comp textColor="blue" />);

      expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Functions as object-form attrs({}) keys are now deprecated and will be removed in a future version of styled-components. Switch to the new attrs(props => ({})) syntax instead for easier and more powerful composition. The attrs key in question is \\"data-text-color\\" on component \\"styled.div\\"."`
      );
    });
  });
});
