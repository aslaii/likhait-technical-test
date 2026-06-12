import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCategory,
  createExpense,
  deleteExpense,
  fetchCategories,
  getExpenses,
  updateExpense,
} from "../services/api";
import HistoryPage from "./HistoryPage";

vi.mock("../services/api", () => ({
  createCategory: vi.fn(),
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  fetchCategories: vi.fn(),
  getExpenses: vi.fn(),
  updateExpense: vi.fn(),
}));

describe("HistoryPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Category and Add Expense actions", async () => {
    vi.mocked(getExpenses).mockResolvedValue([]);
    vi.mocked(createCategory).mockResolvedValue({ id: 1, name: "Pets" });
    vi.mocked(createExpense).mockResolvedValue({
      id: 1,
      amount: 25,
      description: "Lunch",
      category: "Food",
      date: "2026-06-12",
      created_at: "2026-06-12T00:00:00.000Z",
      updated_at: "2026-06-12T00:00:00.000Z",
    });
    vi.mocked(deleteExpense).mockResolvedValue(undefined);
    vi.mocked(fetchCategories).mockResolvedValue([{ id: 1, name: "Food" }]);
    vi.mocked(updateExpense).mockResolvedValue({
      id: 1,
      amount: 25,
      description: "Lunch",
      category: "Food",
      date: "2026-06-12",
      created_at: "2026-06-12T00:00:00.000Z",
      updated_at: "2026-06-12T00:00:00.000Z",
    });

    render(<HistoryPage />);

    expect(
      await screen.findByRole("button", { name: "Add Category" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Expense" })).toBeInTheDocument();
  });
});
