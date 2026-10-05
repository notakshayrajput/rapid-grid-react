import * as React from 'react';
import { RapidGrid as CoreRapidGrid } from 'rapid-grid';
import type { GridOptions } from 'rapid-grid';

export { RapidGrid as RapidGridCore, CellRange, DataType, AllowMerging, AllowDragging, SelectionMode } from 'rapid-grid';
export type { GridOptions, ColumnOptions, DataItem, FormatItemEventArgs, CellEditEventArgs,
  CellRangeEventArgs, DragEventArgs } from 'rapid-grid';

type Handler<T extends keyof CoreRapidGrid> = CoreRapidGrid[T] extends (handler: infer H) => () => void ? H : never;

export interface GridEventProps {
  onGridReady?: (grid: CoreRapidGrid) => void;
  onFormatItem?: Handler<'onFormatItem'>;
  onCellRecycling?: Handler<'onCellRecycling'>;
  onBeginningEdit?: Handler<'onBeginningEdit'>;
  onCellEditEnding?: Handler<'onCellEditEnding'>;
  onCellEditEnded?: Handler<'onCellEditEnded'>;
  onSelectionChanging?: Handler<'onSelectionChanging'>;
  onSelectionChanged?: Handler<'onSelectionChanged'>;
  onDraggedRow?: Handler<'onDraggedRow'>;
  onDraggedColumn?: Handler<'onDraggedColumn'>;
}

export type RapidGridProps = GridOptions & GridEventProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof GridOptions | keyof GridEventProps | 'children'>;

function assignRef(ref: React.ForwardedRef<CoreRapidGrid>, value: CoreRapidGrid | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** A React host for the framework-independent grid. The ref receives its core instance. */
export const RapidGrid = React.forwardRef<CoreRapidGrid, RapidGridProps>(function RapidGrid(props, ref) {
  const {
    items, columns, rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight,
    overscanRows, overscanColumns, fastScrollThreshold, allowMerging, allowDragging,
    selectionMode, autoSizeRows, locale,
    onGridReady, onFormatItem, onCellRecycling, onBeginningEdit, onCellEditEnding,
    onCellEditEnded, onSelectionChanging, onSelectionChanged, onDraggedRow, onDraggedColumn,
    style, ...hostProps
  } = props;

  const hostRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<CoreRapidGrid | null>(null);
  const forwardedRef = React.useRef(ref);
  forwardedRef.current = ref;
  const latestItems = React.useRef(items);
  latestItems.current = items;
  const callbacks = React.useRef<GridEventProps>({});
  callbacks.current = { onGridReady, onFormatItem, onCellRecycling, onBeginningEdit,
    onCellEditEnding, onCellEditEnded, onSelectionChanging, onSelectionChanged,
    onDraggedRow, onDraggedColumn };

  // The core creates its columns only in the constructor. Rebuild when inferred fields change.
  const inferredColumns = columns ? null : Object.keys(items?.[0] ?? {}).join('\u0000');

  React.useEffect(() => {
    const grid = new CoreRapidGrid(hostRef.current!, {
      items: latestItems.current, columns, rowHeight, columnWidth, rowHeaderWidth,
      columnHeaderHeight, overscanRows, overscanColumns, fastScrollThreshold,
      allowMerging, allowDragging, selectionMode, autoSizeRows, locale
    });
    gridRef.current = grid;
    const unsubscribe = [
      grid.onFormatItem((instance, args) => callbacks.current.onFormatItem?.(instance, args)),
      grid.onCellRecycling((instance, args) => callbacks.current.onCellRecycling?.(instance, args)),
      grid.onBeginningEdit((instance, args) => callbacks.current.onBeginningEdit?.(instance, args)),
      grid.onCellEditEnding((instance, args) => callbacks.current.onCellEditEnding?.(instance, args)),
      grid.onCellEditEnded((instance, args) => callbacks.current.onCellEditEnded?.(instance, args)),
      grid.onSelectionChanging((instance, args) => callbacks.current.onSelectionChanging?.(instance, args)),
      grid.onSelectionChanged((instance, args) => callbacks.current.onSelectionChanged?.(instance, args)),
      grid.onDraggedRow((instance, args) => callbacks.current.onDraggedRow?.(instance, args)),
      grid.onDraggedColumn((instance, args) => callbacks.current.onDraggedColumn?.(instance, args))
    ];
    // The core renders in its constructor, before the event handlers can be attached.
    grid.refresh(true);
    assignRef(forwardedRef.current, grid);
    callbacks.current.onGridReady?.(grid);
    return () => {
      unsubscribe.forEach(remove => remove());
      assignRef(forwardedRef.current, null);
      gridRef.current = null;
      grid.destroy();
    };
  }, [columns, inferredColumns, rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight,
    overscanRows, overscanColumns, fastScrollThreshold, allowMerging, allowDragging,
    selectionMode, autoSizeRows, locale]);

  React.useEffect(() => {
    const grid = gridRef.current;
    if (grid && items && grid.collectionView.items !== items) grid.collectionView.setItems(items);
    else if (grid && !items && grid.collectionView.length) grid.collectionView.setItems([]);
  }, [items]);

  React.useEffect(() => {
    assignRef(ref, gridRef.current);
    return () => assignRef(ref, null);
  }, [ref]);

  return <div {...hostProps} ref={hostRef} style={{ width: '100%', height: 400, ...style }} />;
});
