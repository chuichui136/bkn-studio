/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataConnectListPage } from "./DataConnectListPage";

const runtimeConfig = vi.hoisted(() => ({ currentUser: { permissions: [] as string[] } }));
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@/framework/context/use-runtime-config", () => ({ useRuntimeConfig: () => runtimeConfig }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("@/modules/data-connect/scenes/DataConnectListScene", () => ({
  DataConnectListScene: () => <output data-testid="data-connect-list" />,
}));

describe("DataConnectListPage permissions", () => {
  beforeEach(() => {
    runtimeConfig.currentUser.permissions = [];
  });

  it("does not reveal an empty-list state or create action without data-connect permissions", () => {
    render(<DataConnectListPage />);

    expect(screen.getByText("common.noPermission")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "common.create" })).toBeNull();
    expect(screen.queryByTestId("data-connect-list")).toBeNull();
  });

  it("shows only the creation entry for a create-only role", () => {
    runtimeConfig.currentUser.permissions = ["catalog:create"];
    render(<DataConnectListPage />);

    expect(screen.getByText("dataConnect.createOnlyDescription")).toBeTruthy();
    expect(screen.getByRole("button", { name: "common.create" })).toBeTruthy();
    expect(screen.queryByTestId("data-connect-list")).toBeNull();
  });

  it("mounts the list for type or object-level view access", () => {
    runtimeConfig.currentUser.permissions = ["catalog:view_detail"];
    render(<DataConnectListPage />);

    expect(screen.getByTestId("data-connect-list")).toBeTruthy();
  });
});
