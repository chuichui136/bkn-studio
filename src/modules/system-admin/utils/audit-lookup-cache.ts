/**
 * Copyright (c) 2026 OpenBKN
 * SPDX-License-Identifier: LicenseRef-OpenBKN
 * Licensed under the OpenBKN License, a modified Apache 2.0 with Additional
 * Conditions. See LICENSE for the full text.
 */

import {
  getUser,
  listDepartments,
  listRoles,
} from "@/modules/system-admin/services/admin.service";
import { isRequestNotFound } from "@/framework/request/error-message";
import type { AdminDepartment, AdminRole, AdminUser } from "@/modules/system-admin/types/admin";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  loadedAt: number;
};

let departmentsCache: CacheEntry<AdminDepartment[]> | null = null;
let rolesCache: CacheEntry<AdminRole[]> | null = null;
const userCache = new Map<string, CacheEntry<AdminUser>>();
const deletedUserCache = new Map<string, number>();

export type UserLookupDetails = {
  deleted: string[];
  unavailable: string[];
};

/** An audit actor is not always a user; for example, the license service uses system:license. */
export function isUserLookupId(id: string) {
  return Boolean(id.trim()) && !id.trim().startsWith("system:");
}

function isFresh<T>(entry: CacheEntry<T> | null | undefined) {
  return Boolean(entry && Date.now() - entry.loadedAt < CACHE_TTL_MS);
}

export function primeUserLookupCache(users: AdminUser[]) {
  const now = Date.now();
  for (const user of users) {
    userCache.set(user.id, { data: user, loadedAt: now });
    deletedUserCache.delete(user.id);
  }
}

export async function getCachedDepartments(
  options?: { skipErrorToast?: boolean },
): Promise<AdminDepartment[]> {
  if (isFresh(departmentsCache)) {
    return departmentsCache!.data;
  }
  const data = await listDepartments(options);
  departmentsCache = { data, loadedAt: Date.now() };
  return data;
}

export async function getCachedRoles(): Promise<AdminRole[]> {
  if (isFresh(rolesCache)) {
    return rolesCache!.data;
  }
  const data = await listRoles();
  rolesCache = { data, loadedAt: Date.now() };
  return data;
}

export async function getCachedUser(id: string): Promise<AdminUser | null> {
  if (!isUserLookupId(id)) {
    return null;
  }
  const cached = userCache.get(id);
  if (isFresh(cached)) {
    return cached!.data;
  }
  if (isDeletedUserSync(id)) {
    return null;
  }
  try {
    const user = await getUser(id, { skipErrorToast: true });
    userCache.set(id, { data: user, loadedAt: Date.now() });
    deletedUserCache.delete(id);
    return user;
  } catch (error) {
    if (isRequestNotFound(error)) {
      deletedUserCache.set(id, Date.now());
    }
    return null;
  }
}

export async function hydrateUserLookup(ids: string[]): Promise<string[]> {
  const result = await hydrateUserLookupDetails(ids);
  return [...result.deleted, ...result.unavailable];
}

export async function hydrateUserLookupDetails(ids: string[]): Promise<UserLookupDetails> {
  const missing = [...new Set(ids)].filter(
    (id) => isUserLookupId(id) && !isFresh(userCache.get(id)) && !isDeletedUserSync(id),
  );
  if (!missing.length) {
    return { deleted: [], unavailable: [] };
  }
  const results = await Promise.all(missing.map(async (id) => {
    try {
      const user = await getUser(id, { skipErrorToast: true });
      userCache.set(id, { data: user, loadedAt: Date.now() });
      deletedUserCache.delete(id);
      return "resolved" as const;
    } catch (error) {
      if (isRequestNotFound(error)) {
        deletedUserCache.set(id, Date.now());
        return "deleted" as const;
      }
      return "unavailable" as const;
    }
  }));
  return {
    deleted: missing.filter((_id, index) => results[index] === "deleted"),
    unavailable: missing.filter((_id, index) => results[index] === "unavailable"),
  };
}

export function getCachedUserSync(id: string): AdminUser | undefined {
  const cached = userCache.get(id);
  return isFresh(cached) ? cached!.data : undefined;
}

export function isDeletedUserSync(id: string): boolean {
  const loadedAt = deletedUserCache.get(id);
  if (loadedAt === undefined) {
    return false;
  }
  if (Date.now() - loadedAt < CACHE_TTL_MS) {
    return true;
  }
  deletedUserCache.delete(id);
  return false;
}

export function listCachedUsers(): AdminUser[] {
  const users: AdminUser[] = [];
  for (const entry of userCache.values()) {
    if (isFresh(entry)) {
      users.push(entry.data);
    }
  }
  return users;
}

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatAuditTime(value: string, locale: string) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  let formatter = timeFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    timeFormatterCache.set(locale, formatter);
  }
  return formatter.format(date).replace(/\//g, "-");
}
