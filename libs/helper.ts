export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatChartLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
  }).format(date);
}

function buildPrintableDocument(html: string) {
  const trimmedHtml = html.trim();

  if (trimmedHtml.toLowerCase().includes("<html")) {
    return trimmedHtml;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #ffffff;
      }
    </style>
  </head>
  <body>
    ${trimmedHtml}
  </body>
</html>`;
}

export function openPrintWindowFromHtml(html: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    return false;
  }

  const printableDocument = buildPrintableDocument(html);

  printWindow.document.open();
  printWindow.document.write(printableDocument);
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 250);
  } else {
    printWindow.addEventListener("load", () => window.setTimeout(triggerPrint, 250), {
      once: true,
    });
  }

  return true;
}
