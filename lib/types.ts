// Shared view-model types. Shaped to match the Prisma models that arrive in
// Phase 3, so the pages stay unchanged when the data source changes.

export type Member = {
  id: string; // Clerk userId
  name: string;
  email: string;
  imageUrl?: string | null;
};

export type ExpenseSplit = {
  userId: string;
  amountCents: number;
};

export type Expense = {
  id: string;
  description: string;
  /** Always USD cents — converted once at entry. */
  amountCents: number;
  /** The amount as entered, in `originalCurrency` (equals amountCents for USD). */
  originalAmountCents: number;
  originalCurrency: string;
  paidById: string;
  createdAt: Date;
  splits: ExpenseSplit[];
};

export type Settlement = {
  id: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  createdAt: Date;
};

export type GroupSummary = {
  id: string;
  name: string;
  members: Member[];
  totalCents: number;
  /** Positive: the group owes you. Negative: you owe the group. */
  yourBalanceCents: number;
};

export type GroupDetail = GroupSummary & {
  expenses: Expense[];
  settlements: Settlement[];
  simplifiedDebts: SimplifiedDebt[];
};

export type SimplifiedDebt = {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
};
