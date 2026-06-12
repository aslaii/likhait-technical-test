/**
 * API service for communicating with the backend
 */

import type { Category, Expense, ExpenseFormData } from "../types";

const API_BASE_URL = "http://localhost:3000/api";

interface ErrorResponse {
  readonly errors: readonly string[];
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "errors" in value &&
    Array.isArray(value.errors) &&
    value.errors.every((error) => typeof error === "string")
  );
}

function isCategory(value: unknown): value is Category {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    typeof value.name === "string"
  );
}

function isCategoryList(value: unknown): value is Category[] {
  return Array.isArray(value) && value.every(isCategory);
}

async function parseJson(response: Response, fallbackMessage: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(fallbackMessage);
    }

    throw error;
  }
}

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const responseText = await response.text();

  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const payload: unknown = JSON.parse(responseText);
    if (!isErrorResponse(payload)) {
      return fallbackMessage;
    }

    const message = payload.errors.join(", ").trim();
    return message || fallbackMessage;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fallbackMessage;
    }

    throw error;
  }
}

/**
 * Fetch all expenses
 */
export async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch expenses for a specific year and month
 */
export async function getExpenses(
  year: number,
  month: number,
): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/expenses?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const payload = await parseJson(response, "Failed to fetch categories");
  if (!isCategoryList(payload)) {
    throw new Error("Failed to fetch categories");
  }

  return payload;
}

export async function createCategory(name: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category: { name } }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create category"));
  }

  const payload = await parseJson(response, "Failed to create category");
  if (!isCategory(payload)) {
    throw new Error("Failed to create category");
  }

  return payload;
}

/**
 * Create a new expense
 */
export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  // Convert category name to category_id
  const categories = await fetchCategories();
  const category = categories.find((c) => c.name === data.category);

  const expenseData = {
    description: data.description,
    amount: data.amount,
    category_id: category?.id,
    date: data.date,
  };

  const response = await fetch(`${API_BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expense: expenseData }),
  });

  if (!response.ok) {
    throw new Error("Failed to create expense");
  }

  return response.json();
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: number,
  data: Partial<ExpenseFormData>,
): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expense: data }),
  });

  if (!response.ok) {
    throw new Error("Failed to update expense");
  }

  return response.json();
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
}
