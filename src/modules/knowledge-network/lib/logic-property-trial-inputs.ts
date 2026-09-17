/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import type {
  ObjectTypeLogicParameter,
  ObjectTypeLogicProperty,
} from "@/modules/knowledge-network/types/knowledge-network";

const JSON_PARAM_TYPES = new Set(["array", "object"]);
const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

export type LogicPropertyTrialInputParameter = {
  fieldName: string;
  logicPropertyDisplayName: string;
  logicPropertyName: string;
  parameter: ObjectTypeLogicParameter;
};

export function getLogicPropertyTrialInputParameters(
  logicProperties: ObjectTypeLogicProperty[],
): LogicPropertyTrialInputParameter[] {
  return logicProperties.flatMap((logicProperty) =>
    (logicProperty.parameters ?? [])
      .filter(
        (parameter) =>
          parameter.valueFrom === "input" && parameter.name.trim().length > 0,
      )
      .map((parameter) => ({
        fieldName: `${logicProperty.name}:${parameter.name}`,
        logicPropertyDisplayName: logicProperty.displayName || logicProperty.name,
        logicPropertyName: logicProperty.name,
        parameter,
      })),
  );
}

export function parseLogicPropertyTrialInputValue(type: string | undefined, value: unknown) {
  if (!JSON_PARAM_TYPES.has(type?.toLowerCase() ?? "") || typeof value !== "string") {
    return value;
  }

  return JSON.parse(value) as unknown;
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => UNSAFE_PATH_SEGMENTS.has(segment))) {
    throw new Error(`Invalid logic property input path: ${path}`);
  }

  let current = target;
  for (const [index, segment] of segments.entries()) {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }

    const existing = current[segment];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
}

export function buildLogicPropertyTrialDynamicParams(
  parameters: LogicPropertyTrialInputParameter[],
  values: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};

  for (const input of parameters) {
    const target = (result[input.logicPropertyName] ??= {});
    setNestedValue(
      target,
      input.parameter.name.trim(),
      parseLogicPropertyTrialInputValue(input.parameter.type, values[input.fieldName]),
    );
  }

  return result;
}
