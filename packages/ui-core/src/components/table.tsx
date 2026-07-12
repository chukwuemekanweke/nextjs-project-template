import type { ReactNode } from "react";

/**
 * TailAdmin-inspired data table primitives adapted for this workspace.
 * Copyright (c) TailAdmin. Retained under the MIT License.
 */

export type TableColumn<Row> = {
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
};

export function DataTable<Row>({
  columns,
  rows,
  keyField,
  emptyMessage = "No records available.",
}: Readonly<{
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  keyField: (row: Row) => string;
  emptyMessage?: string;
}>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  className={[
                    "px-5 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400",
                    column.className ?? "",
                  ].join(" ")}
                  key={column.header}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={keyField(row)}>
                  {columns.map((column) => (
                    <td
                      className={[
                        "px-5 py-4 text-sm text-gray-700 dark:text-gray-400",
                        column.className ?? "",
                      ].join(" ")}
                      key={column.header}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
