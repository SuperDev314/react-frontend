// @flow
import React from 'react';
import TestRenderer from 'react-test-renderer';

import * as nonce from '../utils/nonce';
import { resetStyled, expectCSSMatches } from './utils';
import StyleSheet from '../models/StyleSheet';

jest.mock('../utils/nonce');
jest.spyOn(nonce, 'default').mockImplementation(() => 'foo');

let styled;

describe('with styles', () => {
  /**
   * Make sure the setup is the same for every test
   */
  beforeEach(() => {
    // $FlowFixMe
    document.head.innerHTML = '';
    styled = resetStyled();
  });

  it('should append a style', () => {
    const rule = 'color: blue;';
    const Comp = styled.div`
      ${rule};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { color:blue; }');
  });

  it('should append multiple styles', () => {
    const rule1 = 'color: blue;';
    const rule2 = 'background: red;';
    const Comp = styled.div`
      ${rule1} ${rule2};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { color:blue; background:red; }');
  });

  it('amperstand should refer to the static class when making a self-referential combo selector', () => {
    const Comp = styled.div`
      background: red;
      color: ${p => p.color};

      &&& {
        border: 1px solid red;
      }

      &[disabled] {
        color: red;

        & + & {
          margin-bottom: 4px;
        }

        & > & {
          margin-top: 4px;
        }
      }

      & + & {
        margin-left: 4px;
      }

      & + & ~ & {
        background: black;
      }

      & ~ & {
        margin-right: 4px;
      }

      & > & {
        margin-top: 4px;
      }

      .foo & {
        color: silver;
      }

      .foo > & {
        color: green;
      }
    `;
    TestRenderer.create(
      <React.Fragment>
        <Comp color="white" />
        <Comp color="red" />
      </React.Fragment>
    );
    expectCSSMatches(`
      .b{ background:red; color:white; }
      .b.b.b{ border:1px solid red; }
      .b[disabled]{ color:red; }
      .b[disabled] + .sc-a[disabled]{ margin-bottom:4px; }
      .b[disabled] > .sc-a[disabled]{ margin-top:4px; }
      .b + .sc-a{ margin-left:4px; }
      .b + .sc-a ~ .sc-a{ background:black; }
      .b ~ .sc-a{ margin-right:4px; }
      .b > .sc-a{ margin-top:4px; }
      .foo .b{ color:silver; }
      .foo > .b{ color:green; }
      .c{ background:red; color:red; }
      .c.c.c{ border:1px solid red; }
      .c[disabled]{ color:red; }
      .c[disabled] + .sc-a[disabled]{ margin-bottom:4px; }
      .c[disabled] > .sc-a[disabled]{ margin-top:4px; }
      .c + .sc-a{ margin-left:4px; }
      .c + .sc-a ~ .sc-a{ background:black; }
      .c ~ .sc-a{ margin-right:4px; }
      .c > .sc-a{ margin-top:4px; }
      .foo .c{ color:silver; }
      .foo > .c{ color:green; }
    `);
  });

  it('should handle inline style objects', () => {
    const rule1 = {
      backgroundColor: 'blue',
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { background-color:blue; }');
  });

  it('should handle inline style objects with media queries', () => {
    const rule1 = {
      backgroundColor: 'blue',
      '@media screen and (min-width: 250px)': {
        backgroundColor: 'red',
      },
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches(
      '.b { background-color:blue; } @media screen and (min-width:250px) { .b { background-color:red; } }'
    );
  });

  it('should handle inline style objects with pseudo selectors', () => {
    const rule1 = {
      backgroundColor: 'blue',
      '&:hover': {
        color: 'green',
      },
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { background-color:blue; } .b:hover { color:green; }');
  });

  it('should handle inline style objects with pseudo selectors', () => {
    const rule1 = {
      backgroundColor: 'blue',
      '&:hover': {
        color: 'green',
      },
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { background-color:blue; } .b:hover { color:green; }');
  });

  it('should handle inline style objects with nesting', () => {
    const rule1 = {
      backgroundColor: 'blue',
      '> h1': {
        color: 'white',
      },
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { background-color:blue; } .b > h1 { color:white; }');
  });

  it('should handle inline style objects with contextual selectors', () => {
    const rule1 = {
      backgroundColor: 'blue',
      'html.something &': {
        color: 'white',
      },
    };
    const Comp = styled.div`
      ${rule1};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches('.b { background-color:blue; } html.something .b { color:white; }');
  });

  it('should inject styles of multiple components', () => {
    const firstRule = 'background: blue;';
    const secondRule = 'background: red;';
    const FirstComp = styled.div`
      ${firstRule};
    `;
    const SecondComp = styled.div`
      ${secondRule};
    `;

    TestRenderer.create(<FirstComp />);
    TestRenderer.create(<SecondComp />);

    expectCSSMatches('.c { background:blue; } .d { background:red; }');
  });

  it('should inject styles of multiple components based on creation, not rendering order', () => {
    const firstRule = 'content: "first rule";';
    const secondRule = 'content: "second rule";';
    const FirstComp = styled.div`
      ${firstRule};
    `;
    const SecondComp = styled.div`
      ${secondRule};
    `;

    // Switch rendering order, shouldn't change injection order
    TestRenderer.create(<SecondComp />);
    TestRenderer.create(<FirstComp />);

    // Classes _do_ get generated in the order of rendering but that's ok
    expectCSSMatches(`
        .d { content:"first rule"; }
        .c { content:"second rule"; }
      `);
  });

  it('should strip a JS-style (invalid) comment in the styles', () => {
    const comment = '// This is an invalid comment';
    const rule = 'color: blue;';
    // prettier-ignore
    const Comp = styled.div`
      ${comment}
      ${rule}
    `
    TestRenderer.create(<Comp />);
    expectCSSMatches(`
        .b {
          color:blue;
        }
      `);
  });

  it('should respect removed rules', () => {
    const Heading = styled.h1`
      color: red;
    `;
    const Text = styled.span`
      color: green;
    `;

    TestRenderer.create(
      <Heading>
        <Text />
      </Heading>
    );
    StyleSheet.master.remove(Text.styledComponentId);

    expectCSSMatches(`
        .c {
          color:red;
        }
      `);
  });

  it('should add a webpack nonce to the style tags if one is available in the global scope', () => {
    const rule = 'color: blue;';
    const Comp = styled.div`
      ${rule};
    `;
    TestRenderer.create(<Comp />);
    expectCSSMatches(`
        .b {
          color:blue;
        }
      `);

    Array.from(document.querySelectorAll('style')).forEach(el => {
      expect(el.getAttribute('nonce')).toBe('foo');
    });
  });

  it('should handle deferredInject and inject correctly', () => {
    const cloneA = StyleSheet.master.clone();
    const cloneB = StyleSheet.master.clone();
    const rules = ['.testA {}'];

    StyleSheet.master.deferredInject('test', rules);

    expect(StyleSheet.master.deferred.test).toBe(rules);
    expect(cloneA.deferred.test).toBe(rules);
    expect(cloneB.deferred.test).toBe(rules);

    StyleSheet.master.inject('test', ['.testB {}']);

    const inspectTag = sheet => {
      const tag = sheet.getTagForId('test');
      return tag.css();
    };

    const masterCss = inspectTag(StyleSheet.master);

    expect(masterCss).toEqual(inspectTag(cloneA));
    expect(masterCss).toEqual(inspectTag(cloneB));
  });
});
