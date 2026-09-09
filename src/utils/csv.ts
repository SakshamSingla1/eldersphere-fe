// Minimal client-side CSV export — no backend endpoint and no CSV library needed for the
// couple of "export what I already fetched" buttons in the app (admin analytics
// leaderboard/timeseries, etc). Rows are already plain objects from a REST response.
export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

const escapeCsvCell = (value: string | number | null | undefined): string => {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(c.accessor(row))).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRowsAsCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  downloadCsv(filename, buildCsv(rows, columns));
}
