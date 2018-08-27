// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

import { expectCSSMatches, getCSS, resetStyled, resetCreateGlobalStyle, stripComments, stripWhitespace } from '../../test/utils'
import ThemeProvider from '../../models/ThemeProvider'
import ServerStyleSheet from '../../models/ServerStyleSheet'
import StyleSheetManager from '../../models/StyleSheetManager'

const createGlobalStyle = resetCreateGlobalStyle()
const styled = resetStyled();

let context;

beforeEach(() => {
  context = setup()
})

afterEach(() => {
  context.cleanup()
})

describe(`createGlobalStyle`, () => {
  it(`returns a function`, () => {
    const Component = createGlobalStyle``
    expect(typeof Component).toBe('function')
  });

  it(`injects global <style> when rendered`, () => {
    const { render } = context
    const Component = createGlobalStyle`[data-test-inject]{color:red;} `
    render(<Component />)
    expectCSSMatches(`[data-test-inject]{color:red;} `)
  });

  it(`injects global <style> when rendered to string`, () => {
    const sheet = new ServerStyleSheet();
    const Component = createGlobalStyle`[data-test-inject]{color:red;} `
    const html = context.renderToString(sheet.collectStyles(<Component />))

    const container = document.createElement('div');
    container.innerHTML = sheet.getStyleTags();
    const style = container.querySelector('style');

    expect(html).toBe('');
    expect(stripWhitespace(stripComments(style.textContent))).toBe('[data-test-inject]{ color:red; } ');
  });

  it(`supports interpolation`, () => {
    const { cleanup, render } = setup()
    const Component = createGlobalStyle`div {color:${props => props.color};} `
    render(
      <Component color="orange" />
    )
    expectCSSMatches(`div{color:orange;} `)
    cleanup()
  })

  it(`supports theming`, () => {
    const { cleanup, render } = setup()
    const Component = createGlobalStyle`div {color:${props => props.theme.color};} `
    render(
      <ThemeProvider theme={{ color: 'black' }}>
        <Component />
      </ThemeProvider>
    )
    expectCSSMatches(`div{color:black;} `)
    cleanup()
  })

  it(`updates theme correctly`, () => {
    const { cleanup, render } = setup()
    const Component = createGlobalStyle`div {color:${props => props.theme.color};} `
    let update;
    class App extends React.Component {
      state = { color: 'grey' }

      constructor() {
        super()
        update = (payload) => {
          this.setState(payload)
        }
      }

      render() {
        return (
          <ThemeProvider theme={{ color: this.state.color }}>
            <Component />
          </ThemeProvider>
        );
      }
    }
    render(<App />)
    expectCSSMatches(`div{color:grey;} `)

    update({ color: 'red' })
    expectCSSMatches(`div{color:red;} `)

    cleanup()
  })

  it(`renders to StyleSheetManager.target`, () => {
    const { container, render } = context
    const Component = createGlobalStyle`[data-test-target]{color:red;} `
    render(
      <StyleSheetManager target={container}>
        <Component />
      </StyleSheetManager>
    )

    const style = container.firstChild;
    expect(style.tagName).toBe('STYLE')
    expect(style.textContent).toContain(`[data-test-target]{color:red;}`)
  });

  it(`adds new global rules non-destructively`, () => {
    const { container, render } = context
    const Color = createGlobalStyle`[data-test-add]{color:red;} `
    const Background = createGlobalStyle`[data-test-add]{background:yellow;} `

    render(
      <React.Fragment>
        <Color />
        <Background />
      </React.Fragment>
    )

    setTimeout(() => {
      expectCSSMatches(`
        [data-test-add]{color:red;}
        [data-test-add]{background:yellow;}
      `)
    })
  })

  it(`stringifies multiple rules correctly`, () => {
    const { cleanup, render } = setup()
    const Component = createGlobalStyle`
      div {
        color: ${props => props.fg};
        background: ${props => props.bg};
      }
    `
    render(
      <Component fg="red" bg="green" />
    )
    expectCSSMatches(`div{color:red;background:green;} `)
    cleanup()
  })

  it(`injects multiple <GlobalStyle> components correctly`, () => {
    const { cleanup, render } = setup()

    const A = createGlobalStyle`body { background: palevioletred; }`;
    const B = createGlobalStyle`body { color: white; }`;

    render(
      <React.Fragment>
        <A />
        <B />
      </React.Fragment>
    )
    expectCSSMatches(`body{background:palevioletred;} body{color:white;}`)
    cleanup()
  })

  it(`removes styling injected styling when unmounted`, () => {
    const { cleanup, container, render } = setup()
    const Component = createGlobalStyle`[data-test-remove]{color:grey;} `

    class Comp extends React.Component {
      state = {
        styled: true
      }

      componentDidMount() {
        this.setState({ styled: false })
      }

      render() {
        return this.state.styled ? <Component /> : null
      }
    }

    render(<Comp />)
    expect(getCSS(document)).not.toContain(`[data-test-remove]{color:grey;}`)
    cleanup()
  })

  it(`removes styling injected for multiple <GlobalStyle> components correctly`, () => {
    const { container, render } = context

    const A = createGlobalStyle`body { background: palevioletred; }`;
    const B = createGlobalStyle`body { color: white; }`;

    class Comp extends React.Component {
      state = {
        a: true,
        b: true
      }

      onClick() {
        if (this.state.a === true && this.state.b === true) {
          this.setState({
            a: true,
            b: false
          })
        } else if (this.state.a === true && this.state.b === false) {
          this.setState({
            a: false,
            b: false
          })
        } else {
          this.setState({
            a: true,
            b: true
          })
        }
      }

      render() {
        return (
          <div data-test-el onClick={() => this.onClick()}>
            {this.state.a ? <A /> : null}
            {this.state.b ? <B /> : null}
          </div>
        )
      }
    }

    render(<Comp />)
    const el = document.querySelector('[data-test-el]')
    expectCSSMatches(`body{background:palevioletred;} body{color:white;}`)

    {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      const css = getCSS(document)
      expect(css).not.toContain('body{color:white;}')
      expect(css).toContain('body{background:palevioletred;}')
    }

    {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      const css = getCSS(document)
      expect(css).not.toContain('body{color:white;}')
      expect(css).not.toContain('body{background:palevioletred;}')
    }
  })

  it(`should throw error when children are passed as props`, () => {
    const { cleanup, render } = setup()
    const Component = createGlobalStyle`
      div {
        color: ${props => props.fg};
        background: ${props => props.bg};
      }
    `
    expect(() => render(
      <Component fg="red" bg="green">
        <div />
      </Component>
    )).toThrowErrorMatchingSnapshot()

    cleanup()
  })
})

function setup() {
  const container = document.createElement('div')
  document.body.appendChild(container)

  return {
    container,
    render(comp) {
      ReactDOM.render(comp, container)
    },
    renderToString(comp) {
      return ReactDOMServer.renderToString(comp)
    },
    cleanup() {
      resetStyled()
      resetCreateGlobalStyle()
      document.body.removeChild(container)
    }
  }
}
