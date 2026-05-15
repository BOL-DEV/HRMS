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

function buildReceiptPrintableDocument(html: string) {
  const trimmedHtml = html.trim();
  const hasHtmlTag = /<html[\s>]/i.test(trimmedHtml);
  const headMatch = hasHtmlTag ? trimmedHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i) : null;
  const bodyMatch = hasHtmlTag ? trimmedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i) : null;
  const headContent = headMatch?.[1] ?? "";
  const bodyContent = bodyMatch?.[1] ?? trimmedHtml;
  const logoUrl =
    typeof window === "undefined"
      ? "/swiftRev.png"
      : new URL("/swiftRev.png", window.location.origin).toString();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt</title>
    ${headContent}
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #ffffff;
        color: #0f172a;
      }

      .swiftrev-receipt-stack {
        display: grid;
        gap: 24px;
      }

      .swiftrev-receipt-copy {
        position: relative;
        overflow: hidden;
        border: 1px dashed rgba(15, 23, 42, 0.18);
        border-radius: 20px;
        padding: 20px;
        background: #ffffff;
        page-break-after: always;
      }

      .swiftrev-receipt-copy:last-child {
        page-break-after: auto;
      }

      .swiftrev-receipt-label {
        margin-bottom: 16px;
        font: 700 11px/1.2 Arial, sans-serif;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: rgba(15, 23, 42, 0.72);
      }

      .swiftrev-receipt-watermark {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0.08;
      }

      .swiftrev-receipt-watermark img {
        width: min(55%, 320px);
        height: auto;
        object-fit: contain;
      }

      .swiftrev-receipt-watermark span {
        position: absolute;
        margin-top: 180px;
        font: 700 42px/1 Arial, sans-serif;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #0f172a;
      }

      .swiftrev-receipt-content {
        position: relative;
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <div class="swiftrev-receipt-stack">
      <section class="swiftrev-receipt-copy">
        <div class="swiftrev-receipt-watermark">
          <img src="${logoUrl}" alt="SwiftRev watermark" />
          <span>SwiftRev</span>
        </div>
        <div class="swiftrev-receipt-content">
          <div class="swiftrev-receipt-label">Customer Copy</div>
          ${bodyContent}
        </div>
      </section>
      <section class="swiftrev-receipt-copy">
        <div class="swiftrev-receipt-watermark">
          <img src="${logoUrl}" alt="SwiftRev watermark" />
          <span>SwiftRev</span>
        </div>
        <div class="swiftrev-receipt-content">
          <div class="swiftrev-receipt-label">Audit Copy</div>
          ${bodyContent}
        </div>
      </section>
    </div>
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

export function openReceiptPrintWindowFromHtml(html: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    return false;
  }

  const printableDocument = buildReceiptPrintableDocument(html);

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

export function downloadBlobFile(blob: Blob, filename: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function openPrintWindowFromBlob(blob: Blob) {
  if (typeof window === "undefined") {
    return false;
  }

  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank", "width=900,height=700");

  if (!printWindow) {
    window.URL.revokeObjectURL(url);
    return false;
  }

  const cleanup = () => window.URL.revokeObjectURL(url);
  printWindow.addEventListener("load", () => {
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  });
  printWindow.addEventListener("beforeunload", cleanup, { once: true });

  return true;
}
