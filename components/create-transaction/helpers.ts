export function sanitizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
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
