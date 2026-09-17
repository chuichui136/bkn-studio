/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

export function formatAuditDetailJson(detail?: string, columnMaskingLabel?: string) {
  if (!detail?.trim()) {
    return "";
  }
  try {
    const parsed: unknown = JSON.parse(detail);
    return JSON.stringify(
      columnMaskingLabel ? localizePropertyGrantLevels(parsed, columnMaskingLabel) : parsed,
      null,
      2,
    );
  } catch {
    return detail;
  }
}

function localizePropertyGrantLevels(value: unknown, columnMaskingLabel: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => localizePropertyGrantLevels(item, columnMaskingLabel));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      key === "level" && nestedValue === "masked"
        ? columnMaskingLabel
        : localizePropertyGrantLevels(nestedValue, columnMaskingLabel),
    ]),
  );
}
