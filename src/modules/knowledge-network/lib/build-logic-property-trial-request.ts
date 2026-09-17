/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import type { ObjectTypeLogicProperty } from "@/modules/knowledge-network/types/knowledge-network";

export function buildLogicPropertyTrialBody(input: {
  dynamicParams?: Record<string, Record<string, unknown>>;
  instanceIdentities: Array<Record<string, string | number>>;
  logicProperties: ObjectTypeLogicProperty[];
}) {
  return {
    _instance_identities: input.instanceIdentities,
    ...(input.dynamicParams && Object.keys(input.dynamicParams).length > 0
      ? { dynamic_params: input.dynamicParams }
      : {}),
    properties: input.logicProperties.map((property) => property.name),
  };
}
