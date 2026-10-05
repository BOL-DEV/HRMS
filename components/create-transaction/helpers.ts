export function sanitizePhoneNumber(value: string) {
  const hasPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  const base = hasPlus ? "+" + digits : digits;
  return base.slice(0, 14);
}

export function sanitizeAmountInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = normalized.split(".");

  if (fractionParts.length === 0) {
    return normalized;
  }

  return `${whole}.${fractionParts.join("")}`;
}

export function sanitizeQuantityInput(value: string) {
  return value.replace(/[^\d]/g, "");
}
