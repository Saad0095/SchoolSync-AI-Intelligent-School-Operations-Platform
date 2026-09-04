export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;

  const header = Object.keys(data[0]);
  const csvContent = [
    header.join(","),
    ...data.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName] || ""))
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
