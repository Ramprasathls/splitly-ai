// Mock data for Phase 2 (UI foundation). Replaced by real Prisma queries in
// Phase 3 — the shapes in lib/types.ts stay identical.

import type { GroupDetail, GroupSummary, Member } from "./types";

export const MOCK_CURRENT_USER_ID = "user_mock_you";

const you: Member = {
  id: MOCK_CURRENT_USER_ID,
  name: "Alex Rivera",
  email: "alex@example.com",
};
const ben: Member = {
  id: "user_mock_ben",
  name: "Ben Carter",
  email: "ben@example.com",
};
const chris: Member = {
  id: "user_mock_chris",
  name: "Chris Lee",
  email: "chris@example.com",
};
const dana: Member = {
  id: "user_mock_dana",
  name: "Dana Ortiz",
  email: "dana@example.com",
};

// Goa: you paid 34,000 of 42,000 total; each share is 10,500 → net +23,500.
// Dana settled 10,500 with you, so the live balance is +13,000.
export const mockGroups: GroupSummary[] = [
  {
    id: "grp_goa",
    name: "Goa Trip 🏖️",
    members: [you, ben, chris, dana],
    totalCents: 42_000,
    yourBalanceCents: 13_000,
  },
  {
    id: "grp_apt",
    name: "Apartment 🏠",
    members: [you, ben],
    totalCents: 180_000,
    yourBalanceCents: -45_000,
  },
  {
    id: "grp_dinner",
    name: "Sunday dinners",
    members: [you, chris],
    totalCents: 6_800,
    yourBalanceCents: 0,
  },
];

export const mockGroupDetails: Record<string, GroupDetail> = {
  grp_goa: {
    ...mockGroups[0],
    expenses: [
      {
        id: "exp_1",
        description: "Beach shack dinner",
        amountCents: 12_000,
        originalAmountCents: 12_000,
        originalCurrency: "USD",
        paidById: you.id,
        createdAt: new Date("2026-07-18T20:00:00Z"),
        splits: [you, ben, chris, dana].map((m) => ({
          userId: m.id,
          amountCents: 3_000,
        })),
      },
      {
        id: "exp_2",
        description: "Scooter rentals",
        amountCents: 8_000,
        originalAmountCents: 6_950,
        originalCurrency: "EUR",
        paidById: ben.id,
        createdAt: new Date("2026-07-19T09:30:00Z"),
        splits: [you, ben, chris, dana].map((m) => ({
          userId: m.id,
          amountCents: 2_000,
        })),
      },
      {
        id: "exp_3",
        description: "Airbnb",
        amountCents: 22_000,
        originalAmountCents: 22_000,
        originalCurrency: "USD",
        paidById: you.id,
        createdAt: new Date("2026-07-17T14:00:00Z"),
        splits: [you, ben, chris, dana].map((m) => ({
          userId: m.id,
          amountCents: 5_500,
        })),
      },
    ],
    settlements: [
      {
        id: "set_1",
        fromUserId: dana.id,
        toUserId: you.id,
        amountCents: 10_500,
        createdAt: new Date("2026-07-20T10:00:00Z"),
      },
    ],
    simplifiedDebts: [
      { fromUserId: chris.id, toUserId: you.id, amountCents: 10_500 },
      { fromUserId: ben.id, toUserId: you.id, amountCents: 2_500 },
    ],
  },
  grp_apt: {
    ...mockGroups[1],
    expenses: [
      {
        id: "exp_4",
        description: "July rent",
        amountCents: 180_000,
        originalAmountCents: 180_000,
        originalCurrency: "USD",
        paidById: ben.id,
        createdAt: new Date("2026-07-01T08:00:00Z"),
        splits: [you, ben].map((m) => ({ userId: m.id, amountCents: 90_000 })),
      },
    ],
    settlements: [],
    simplifiedDebts: [
      { fromUserId: you.id, toUserId: ben.id, amountCents: 45_000 },
    ],
  },
  grp_dinner: {
    ...mockGroups[2],
    expenses: [
      {
        id: "exp_5",
        description: "Pasta night",
        amountCents: 6_800,
        originalAmountCents: 6_800,
        originalCurrency: "USD",
        paidById: chris.id,
        createdAt: new Date("2026-07-12T19:00:00Z"),
        splits: [you, chris].map((m) => ({ userId: m.id, amountCents: 3_400 })),
      },
    ],
    settlements: [
      {
        id: "set_2",
        fromUserId: you.id,
        toUserId: chris.id,
        amountCents: 3_400,
        createdAt: new Date("2026-07-13T09:00:00Z"),
      },
    ],
    simplifiedDebts: [],
  },
};
