/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { useCallback, useEffect, useState } from "react";

import i18n from "@/app/locales/i18n";
import {
  getAuthorizationCatalog,
  mockAuthorizationCatalog,
  resetAuthorizationCatalogCache,
  type AuthorizationCatalog,
  usesMockAuthorizationCatalog,
} from "@/modules/system-admin/services/authorization-catalog.service";

export type CatalogOperationOption = {
  key: string;
  label: string;
  requires: string[];
};

export function useAuthorizationCatalog() {
  const [catalog, setCatalog] = useState<AuthorizationCatalog | undefined>(() =>
    usesMockAuthorizationCatalog ? mockAuthorizationCatalog() : undefined,
  );
  const [error, setError] = useState<unknown>();
  const [requestRevision, setRequestRevision] = useState(0);

  useEffect(() => {
    if (catalog) {
      return;
    }
    let active = true;
    void getAuthorizationCatalog().then(
      (nextCatalog) => {
        if (active) {
          setCatalog(nextCatalog);
        }
      },
      (nextError: unknown) => {
        if (active) {
          setError(nextError);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [catalog, requestRevision]);

  const retryAuthorizationCatalog = useCallback(() => {
    resetAuthorizationCatalogCache();
    setError(undefined);
    setRequestRevision((revision) => revision + 1);
  }, []);

  const operationsForType = useCallback((type: string): CatalogOperationOption[] => {
    const resourceType = catalog?.resourceTypes.find((item) => item.id === type);
    return (resourceType?.operations ?? []).map((operation) => ({
      key: operation.id,
      label: i18n.exists(`systemAdmin.resourceCatalog.operations.${operation.id}`)
        ? i18n.t(`systemAdmin.resourceCatalog.operations.${operation.id}`)
        : operation.name,
      requires: operation.requires,
    }));
  }, [catalog]);

  const resourceTypeOptions = useCallback((types?: readonly string[]) => {
    const allowed = types ? new Set(types) : undefined;
    return (catalog?.resourceTypes ?? [])
      .filter((resourceType) => !allowed || allowed.has(resourceType.id))
      .map((resourceType) => ({
        label: i18n.exists(`systemAdmin.resourceCatalog.resources.${resourceType.id}`)
          ? i18n.t(`systemAdmin.resourceCatalog.resources.${resourceType.id}`)
          : resourceType.name,
        value: resourceType.id,
      }));
  }, [catalog]);

  return {
    catalog,
    catalogError: error,
    // Consumers use this as a "catalog is not ready" guard. Keep authoring
    // controls disabled after an error until the user explicitly retries.
    catalogLoading: !catalog,
    operationsForType,
    resourceTypeOptions,
    retryAuthorizationCatalog,
  };
}
