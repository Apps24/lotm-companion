// Render the real components; substitute only browser state and Next's Link.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
let chapter = 1;
const oldTsx = require.extensions['.tsx'];
require.extensions['.tsx'] = (mod, filename) => {
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => {
    if (name === 'react' && filename === path.join(root, 'app/klein/page.tsx')) {
      return { ...React, useState: () => [chapter, () => {}], useEffect: () => {} };
    }
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    return originalRequire(name.startsWith('@/') ? path.join(root, name.slice(2)) : name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText, filename);
};
try {
  const Page = require('../app/klein/page.tsx').default;
  const Identity = require('../app/klein/IdentitySection.tsx').default;
  const render = (at, Component = Page) => {
    chapter = at;
    return renderToStaticMarkup(React.createElement(Component, { spoilerChapter: at }));
  };
  const start = render(1);
  for (const text of ['Gehrman Sparrow', 'The Fool', 'Celestial Worthy']) assert.ok(!start.includes(text), `Chapter 1 leaks ${text}`);
  for (const [name, reveal] of [['The Fool', 7], ['Sherlock Moriarty', 215], ['Gehrman Sparrow', 483], ['Dwayne Dantès', 732], ['Merlin Hermes', 1290]]) {
    assert.ok(!render(reveal - 1, Identity).includes(name), `Identity leaks ${name} before ${reveal}`);
    assert.ok(render(reveal, Identity).includes(name), `Identity missing ${name} at ${reveal}`);
  }
  assert.ok(render(6, Identity).includes('The mysterious host persona begins'));
  assert.ok(render(1276, Identity).includes('Wandering-magician phase begins'));
  assert.ok(!render(168).includes('Sherlock Moriarty'));
  assert.ok(!render(168).includes('Lanevus scene'));
  assert.ok(!render(1268).includes('Merlin Hermes'));
  assert.ok(render(1430).includes('Lanevus scene'), 'Full-book acting evidence must remain available');
  console.log('Klein rendered spoiler boundaries passed.');
} finally {
  if (oldTsx) require.extensions['.tsx'] = oldTsx;
  else delete require.extensions['.tsx'];
}
