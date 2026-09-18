/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { ApiOutlined } from "@ant-design/icons";
import { Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useRuntimeConfig } from "@/framework/context/use-runtime-config";
import { AppButton } from "@/framework/ui/common/AppButton";
import { EmptyStatePanel } from "@/framework/ui/common/EmptyStatePanel";
import { DataConnectListScene } from "@/modules/data-connect/scenes/DataConnectListScene";

const DATA_CONNECT_VIEW_PERMISSIONS = ["catalog:view_detail", "resource:view_detail"];
const DATA_CONNECT_CREATE_PERMISSION = "catalog:create";

export function DataConnectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const runtimeConfig = useRuntimeConfig();
  const permissions = runtimeConfig.currentUser.permissions;
  // A resource-level view grant lets the backend expose the containing catalog as a
  // summary-only row. Let that caller mount the list; row operations remain backend-derived.
  const canView = DATA_CONNECT_VIEW_PERMISSIONS.some((permission) => permissions.includes(permission));
  const canCreate = permissions.includes(DATA_CONNECT_CREATE_PERMISSION);

  if (!canView && !canCreate) {
    return <Empty description={t("common.noPermission")} style={{ marginTop: 96 }} />;
  }

  // Creating a connection does not confer permission to list existing connections. Do not mount
  // the list scene for a create-only role because it would make an unauthorized list request.
  if (!canView) {
    return (
      <EmptyStatePanel
        action={
          <AppButton onClick={() => void navigate("/data-connect/new")} type="primary">
            {t("common.create")}
          </AppButton>
        }
        description={t("dataConnect.createOnlyDescription")}
        icon={<ApiOutlined />}
        title={t("dataConnect.createTitle")}
      />
    );
  }

  return <DataConnectListScene />;
}
