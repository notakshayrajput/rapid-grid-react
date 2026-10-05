const test = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { JSDOM } = require('jsdom');
const { RapidGrid, CellRange } = require('../dist/cjs/index.js');

test('React wrapper mounts, updates data and callbacks, rebuilds columns, and cleans up', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true
  });
  const previous = Object.fromEntries(['window', 'document', 'HTMLElement', 'Element',
    'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
    'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, global[key]]));
  Object.assign(global, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true
  });
  const root = createRoot(document.getElementById('app'));
  const ref = React.createRef();
  const firstItems = [{ name: 'First' }];
  const nextItems = [{ name: 'Next' }, { name: 'Last' }];
  const columns = [{ binding: 'name' }];
  let readyCount = 0;
  let firstCallback = 0;
  let nextCallback = 0;

  try {
    await act(async () => root.render(React.createElement(RapidGrid, {
      ref, items: firstItems, columns, onGridReady: () => readyCount++,
      onSelectionChanged: () => firstCallback++
    })));
    const firstGrid = ref.current;
    assert.ok(firstGrid);
    assert.equal(readyCount, 1);
    assert.equal(firstGrid.collectionView.items, firstItems);
    assert.equal(document.querySelectorAll('.ig-root').length, 1);

    await act(async () => root.render(React.createElement(RapidGrid, {
      ref, items: nextItems, columns, onGridReady: () => readyCount++,
      onSelectionChanged: () => nextCallback++
    })));
    assert.equal(ref.current, firstGrid);
    assert.equal(readyCount, 1);
    assert.equal(firstGrid.collectionView.items, nextItems);
    assert.equal(firstGrid.rows.length, 2);
    await act(async () => { firstGrid.select(new CellRange(0, 0)); });
    assert.equal(firstCallback, 0);
    assert.equal(nextCallback, 1);

    await act(async () => root.render(React.createElement(RapidGrid, {
      ref, items: nextItems, columns: [{ binding: 'name', width: 220 }]
    })));
    assert.notEqual(ref.current, firstGrid);
    assert.equal(ref.current.columns.get(0).width, 220);
    assert.equal(document.querySelectorAll('.ig-root').length, 1);
    await act(async () => root.unmount());
    assert.equal(ref.current, null);
    assert.equal(document.querySelectorAll('.ig-root').length, 0);
  } finally {
    dom.window.close();
    Object.assign(global, previous);
  }
});
