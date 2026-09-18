/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnitManagementListPage } from "./UnitManagementListPage";

const runtimeConfig = vi.hoisted(() => ({ currentUser: { permissions: [] as string[] } }));

vi.mock("@/framework/context/use-runtime-config", () => ({ useRuntimeConfig: () => runtimeConfig }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/modules/execution-factory/components/create-menu/CreateMenu", () => ({
  CreateMenu: ({ activeTab, toolboxView }: { activeTab: string; toolboxView?: string }) => (
    <output data-testid="create-menu" data-tab={activeTab} data-toolbox-view={toolboxView} />
  ),
}));
vi.mock("@/modules/execution-factory/scenes/UnitManagementListScene", () => ({
  UnitManagementListScene: () => <output data-testid="list-scene" />,
}));

describe("UnitManagementListPage create-only access", () => {
  beforeEach(() => {
    runtimeConfig.currentUser.permissions = [];
  });

  it.each([
    ["Function", "execution-factory:function:create", "toolbox", "function"],
    ["Toolbox", "execution-factory:toolbox:create", "toolbox", "openapi"],
    ["MCP", "execution-factory:mcp:create", "mcp", undefined],
    ["Skill", "execution-factory:skill:create", "skill", undefined],
  ])("renders a neutral creation entry for a %s-only role", (_name, permission, tab, toolboxView) => {
    runtimeConfig.currentUser.permissions = [permission];
    render(<UnitManagementListPage />);

    const menu = screen.getByTestId("create-menu");
    expect(menu.dataset.tab).toBe(tab);
    expect(menu.dataset.toolboxView || undefined).toBe(toolboxView);
    expect(screen.getByText("executionFactory.createOnlyDescription")).toBeTruthy();
    expect(screen.queryByTestId("list-scene")).toBeNull();
  });
});
