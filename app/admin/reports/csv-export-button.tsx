"use client";

export function CsvExportButton({
  filename,
  rows,
}: {
  filename: string;
  rows: [string, string | number][];
}) {
  function handleExport() {
    const csv = ["Metric,Value", ...rows.map(([k, v]) => `"${k}",${v}`)].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
    >
      Export CSV
    </button>
  );
}
