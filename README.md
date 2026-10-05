# rapid-grid-react

React component for [`rapid-grid`](https://www.npmjs.com/package/rapid-grid). The grid engine remains in `rapid-grid`; this package manages its React lifecycle.

## Install

```sh
npm install rapid-grid-react react
```

`rapid-grid` is installed as a dependency. Import the React package's stylesheet for the default grid appearance.

## Use

```tsx
import { useRef } from 'react';
import { RapidGrid, DataType, type RapidGridCore } from 'rapid-grid-react';
import 'rapid-grid-react/style.css';

const items = [
  { id: 1, name: 'Notebook', price: 12.5 },
  { id: 2, name: 'Pen', price: 2.5 }
];
const columns = [
  { binding: 'id', width: 80, dataType: DataType.Number },
  { binding: 'name', width: 180 },
  { binding: 'price', width: 120, dataType: DataType.Number, format: 'c2' }
];

function Products() {
  const gridRef = useRef<RapidGridCore>(null);

  return (
    <RapidGrid
      ref={gridRef}
      items={items}
      columns={columns}
      style={{ height: 500 }}
      onSelectionChanged={(_grid, event) => console.log(event.ranges)}
    />
  );
}
```

The component gives its host a 400 px height by default; set `style.height` to fit your layout. The ref receives the underlying `rapid-grid` instance after mount and becomes `null` on unmount. `onGridReady` also receives it after the event handlers are attached.

`items` changes update the existing grid. Changes to `columns` or construction options recreate it because the core grid sets those options in its constructor. Keep array props stable with React state or `useMemo` when you want to retain grid state across renders. Event callback changes do not recreate the grid. Grid editing mutates the supplied item objects, as in the core package.

All core options and grid events are available as props. The package also exports core enums, `CellRange`, and types; the class itself is exported as `RapidGridCore`.

## Development

```sh
npm install
npm test
```
