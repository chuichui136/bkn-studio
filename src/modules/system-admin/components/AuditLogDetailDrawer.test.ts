/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { describe, expect, it } from "vitest";

import { formatAuditDetailJson } from "./AuditLogDetailDrawer";

describe("formatAuditDetailJson", () => {
  it("renders property-grant masked levels with the localized Column Masking label", () => {
    expect(
      formatAuditDetailJson(
        JSON.stringify({ changes: [{ level: "masked", property_name: "mobile" }] }),
        "列掩码",
      ),
    ).toContain('"level": "列掩码"');
  });

  it("preserves the stable wire value when no presentation label is supplied", () => {
    expect(formatAuditDetailJson('{"level":"masked"}')).toContain('"level": "masked"');
  });
});
