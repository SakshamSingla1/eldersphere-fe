import { describe, it, expect, vi, afterEach } from "vitest";
import { buildCsv, downloadCsv, exportRowsAsCsv, type CsvColumn } from "./csv";

interface Row {
  name: string;
  notes: string;
  amount: number | null;
}

const columns: CsvColumn<Row>[] = [
  { header: "Name", accessor: (r) => r.name },
  { header: "Notes", accessor: (r) => r.notes },
  { header: "Amount", accessor: (r) => r.amount },
];

describe("buildCsv", () => {
  it("renders a header row followed by one row per record, comma-joined", () => {
    const rows: Row[] = [
      { name: "Asha Patel", notes: "ok", amount: 100 },
      { name: "Ravi Shah", notes: "fine", amount: 250.5 },
    ];

    expect(buildCsv(rows, columns)).toBe(
      "Name,Notes,Amount\nAsha Patel,ok,100\nRavi Shah,fine,250.5"
    );
  });

  it("quotes and escapes a cell containing a comma, quote, or newline", () => {
    const rows: Row[] = [{ name: 'Jordan "JJ" Lee', notes: "Room 4, wing B\nCall first", amount: 1 }];

    const csv = buildCsv(rows, columns);
    const lines = csv.split("\n");
    // The embedded newline is inside a quoted cell, so it must not create an extra row —
    // exactly a header + one data row split on top-level newlines is impossible to assert
    // by naive split, so check the raw content directly instead.
    expect(csv).toContain('"Jordan ""JJ"" Lee"');
    expect(csv).toContain('"Room 4, wing B\nCall first"');
    expect(lines[0]).toBe("Name,Notes,Amount");
  });

  it("renders null/null cells as an empty string, not the literal word", () => {
    const rows: Row[] = [{ name: "No Amount", notes: "", amount: null }];
    expect(buildCsv(rows, columns)).toBe("Name,Notes,Amount\nNo Amount,,");
  });

  it("produces just the header line for an empty row set", () => {
    expect(buildCsv([], columns)).toBe("Name,Notes,Amount");
  });
});

describe("downloadCsv / exportRowsAsCsv", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("creates an object URL, triggers a click on a temporary <a>, then revokes the URL", () => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as any;
    URL.revokeObjectURL = revokeObjectURL as any;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    downloadCsv("report.csv", "Name,Amount\nA,1");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    // The anchor that was appended/clicked should have carried the right filename.
    const appendedNode = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(appendedNode.download).toBe("report.csv");
  });

  it("exportRowsAsCsv builds the CSV from rows/columns before downloading it", async () => {
    let capturedBlob: Blob | undefined;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    }) as any;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportRowsAsCsv("rows.csv", [{ name: "A", notes: "", amount: 5 }], columns);

    expect(capturedBlob).toBeDefined();
    expect(capturedBlob?.type).toBe("text/csv;charset=utf-8;");
    await expect(capturedBlob?.text()).resolves.toBe("Name,Notes,Amount\nA,,5");
  });
});
