/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());

vi.mock("@/modules/system-admin/services/admin.service", () => ({
  getUser,
  listDepartments: vi.fn(),
  listRoles: vi.fn(),
}));

import {
  getCachedUser,
  hydrateUserLookup,
  hydrateUserLookupDetails,
  isDeletedUserSync,
  isUserLookupId,
} from "@/modules/system-admin/utils/audit-lookup-cache";

describe("audit user lookup", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("does not resolve synthetic system actors as users", async () => {
    expect(isUserLookupId("system:license")).toBe(false);
    expect(await getCachedUser("system:license")).toBeNull();

    await hydrateUserLookup(["system:license", "u-1"]);

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledWith("u-1", { skipErrorToast: true });
  });

  it("distinguishes deleted users from temporary lookup failures", async () => {
    getUser.mockImplementation((id: string) => {
      if (id === "u-deleted") {
        return Promise.reject(Object.assign(new Error("user not found"), {
          isAxiosError: true,
          response: { status: 404 },
        }));
      }
      return Promise.reject(Object.assign(new Error("directory unavailable"), {
        isAxiosError: true,
        response: { status: 503 },
      }));
    });

    await expect(hydrateUserLookupDetails(["u-deleted", "u-unavailable"]))
      .resolves.toEqual({
        deleted: ["u-deleted"],
        unavailable: ["u-unavailable"],
      });
    expect(isDeletedUserSync("u-deleted")).toBe(true);
    expect(isDeletedUserSync("u-unavailable")).toBe(false);
  });
});
