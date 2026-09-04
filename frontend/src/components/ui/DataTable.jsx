import { useMemo, useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, ChevronUp, Rows3 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

/**
 * Shared data table.
 * - Desktop: sortable table with sticky header, zebra striping, and hover states.
 * - Mobile (< md): rows collapse into cards; columns listed in
 *   `hideColumnsOnMobile` are omitted from the card layout.
 *   Provide `meta: { label }` on column defs for mobile labels.
 * - Empty data renders the shared EmptyState (customizable via `emptyState`).
 * - Optional result count footer showing total records.
 */
export const DataTable = ({
  data = [],
  columns = [],
  className = '',
  selectable = false,
  onSelectionChange = () => {},
  hideColumnsOnMobile = [],
  emptyState,
  showFooter = true,
}) => {
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  // Inject checkbox column if selectable
  const finalColumns = useMemo(() => {
    if (!selectable) return columns;
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="size-4 cursor-pointer rounded border-input accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="size-4 cursor-pointer rounded border-input accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  // Notify parent of selected original data rows
  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
    onSelectionChange(selectedRows);
  }, [rowSelection, table, onSelectionChange]);

  const columnLabel = (column) =>
    column.columnDef.meta?.label ??
    String(column.id).replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());

  const renderEmptyState = (inTable) => (
    <EmptyState
      title={emptyState?.title ?? 'No results found'}
      description={
        emptyState?.description ?? 'There is nothing to show here yet.'
      }
      icon={emptyState?.icon}
      action={emptyState?.action}
      className={inTable ? 'rounded-none border-0 bg-transparent shadow-none' : undefined}
    />
  );

  const rows = table.getRowModel().rows;
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-auto rounded-xl border border-border/60 shadow-card md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Data table</caption>
          <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted/60 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground xl:px-5"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          aria-label={`Sort by ${columnLabel(header.column)}`}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          <span className="text-muted-foreground/70">
                            {{
                              asc: <ChevronUp size={14} aria-hidden="true" />,
                              desc: <ChevronDown size={14} aria-hidden="true" />,
                            }[sorted] ?? <ArrowUpDown size={13} aria-hidden="true" />}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50 bg-card">
            {rows.length > 0 ? (
              rows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-primary/5',
                    // Zebra striping — subtle on odd rows
                    rowIdx % 2 === 1 && !row.getIsSelected() && 'bg-muted/20',
                    // Selected row accent
                    row.getIsSelected() && 'bg-primary/8 border-l-2 border-l-primary hover:bg-primary/10'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-3.5 text-foreground xl:px-5"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={finalColumns.length} className="p-0">
                  {renderEmptyState(true)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: result count + selection info */}
      {showFooter && rows.length > 0 && (
        <div className="hidden md:flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Rows3 size={13} aria-hidden="true" />
            <span className="font-medium tabular-nums">{rows.length}</span> record{rows.length !== 1 ? 's' : ''}
          </span>
          {selectable && selectedCount > 0 && (
            <span className="font-medium text-primary">
              {selectedCount} selected
            </span>
          )}
        </div>
      )}

      {/* Mobile card fallback */}
      <div className="space-y-3 md:hidden">
        {rows.length > 0 ? (
          rows.map((row) => {
            const cells = row.getVisibleCells().filter(
              (cell) =>
                cell.column.id !== 'select' &&
                !hideColumnsOnMobile.includes(cell.column.id)
            );
            const selectCell = row
              .getVisibleCells()
              .find((cell) => cell.column.id === 'select');
            return (
              <div
                key={row.id}
                className={cn(
                  'rounded-xl border border-border/60 bg-card p-4 shadow-card transition-all',
                  row.getIsSelected() && 'border-primary/50 bg-primary/5 shadow-md'
                )}
              >
                <div className="divide-y divide-border/50">
                  {cells.map((cell, index) => (
                    <div
                      key={cell.id}
                      className={cn(
                        'flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0',
                        index > 0 && 'mt-0'
                      )}
                    >
                      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {columnLabel(cell.column)}
                      </span>
                      <span className="min-w-0 break-words text-right text-sm text-foreground">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {selectCell && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    {flexRender(
                      selectCell.column.columnDef.cell,
                      selectCell.getContext()
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          renderEmptyState(false)
        )}
      </div>
    </div>
  );
};
