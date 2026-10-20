/* eslint-disable @typescript-eslint/no-unused-vars -- userId is unused until Phase 3 scopes queries by membership */
// Read helpers for pages. Phase 2 serves mock data; Phase 3 swaps the bodies
// for Prisma queries without touching any caller.

import { mockGroupDetails, mockGroups } from "./mock-data";
import type { GroupDetail, GroupSummary } from "./types";

export async function getGroups(_userId: string): Promise<GroupSummary[]> {
  return mockGroups;
}

export async function getGroupDetail(
  _userId: string,
  groupId: string,
): Promise<GroupDetail | null> {
  return mockGroupDetails[groupId] ?? null;
}
