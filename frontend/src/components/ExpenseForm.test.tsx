import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCategories } from "../services/api";
import type { Category } from "../types";
import { ExpenseForm } from "./ExpenseForm";

vi.mock("../services/api", () => ({
  fetchCategories: vi.fn(),
}));

function deferredCategories() {
  let resolve: (categories: Category[]) => void = () => {};
  const promise = new Promise<Category[]>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("ExpenseForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches categories on mount", async () => {
    vi.mocked(fetchCategories).mockResolvedValue([{ id: 1, name: "Food" }]);

    render(<ExpenseForm onSubmit={vi.fn()} />);

    await waitFor(() => {
      expect(fetchCategories).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state while categories are loading", () => {
    vi.mocked(fetchCategories).mockReturnValue(deferredCategories().promise);

    render(<ExpenseForm onSubmit={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading categories...");
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("populates the category select with fetched categories", async () => {
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 1, name: "Food" },
      { id: 2, name: "Transportation" },
    ]);

    render(<ExpenseForm onSubmit={vi.fn()} />);

    const categorySelect = screen.getByRole("combobox");
    await waitFor(() => {
      expect(categorySelect).not.toBeDisabled();
    });

    expect(
      within(categorySelect).getByRole("option", { name: "Food" }),
    ).toBeInTheDocument();
    expect(
      within(categorySelect).getByRole("option", { name: "Transportation" }),
    ).toBeInTheDocument();
  });
});
