/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { describe, expect, it } from "vitest";

import {
  buildLogicPropertyTrialDynamicParams,
  getLogicPropertyTrialInputParameters,
} from "@/modules/knowledge-network/lib/logic-property-trial-inputs";
import type { ObjectTypeLogicProperty } from "@/modules/knowledge-network/types/knowledge-network";

const grossMarginProperty: ObjectTypeLogicProperty = {
  displayName: "Gross margin",
  name: "lp_sku_gross_margin",
  parameters: [
    { id: "price", name: "price", type: "number", valueFrom: "input" },
    { id: "cost", name: "cost_price", type: "number", valueFrom: "input" },
    { id: "currency", name: "currency", type: "string", valueFrom: "const", value: "CNY" },
  ],
  type: "tool",
};

describe("logic property trial inputs", () => {
  it("collects only parameters mapped from input", () => {
    const parameters = getLogicPropertyTrialInputParameters([grossMarginProperty]);

    expect(parameters.map((parameter) => parameter.parameter.name)).toEqual([
      "price",
      "cost_price",
    ]);
  });

  it("builds the dynamic_params shape consumed by the trial endpoint", () => {
    const parameters = getLogicPropertyTrialInputParameters([grossMarginProperty]);
    const values = Object.fromEntries(
      parameters.map((parameter, index) => [parameter.fieldName, index === 0 ? 100 : 60]),
    );

    expect(buildLogicPropertyTrialDynamicParams(parameters, values)).toEqual({
      lp_sku_gross_margin: { cost_price: 60, price: 100 },
    });
  });

  it("keeps object values as JSON objects and writes dotted names as nested values", () => {
    const parameters = getLogicPropertyTrialInputParameters([
      {
        displayName: "Tool",
        name: "tool_value",
        parameters: [
          { id: "filter", name: "filter", type: "object", valueFrom: "input" },
          { id: "limit", name: "options.limit", type: "integer", valueFrom: "input" },
        ],
        type: "tool",
      },
    ]);

    expect(
      buildLogicPropertyTrialDynamicParams(parameters, {
        [parameters[0].fieldName]: '{"status":"active"}',
        [parameters[1].fieldName]: 10,
      }),
    ).toEqual({
      tool_value: { filter: { status: "active" }, options: { limit: 10 } },
    });
  });
});
