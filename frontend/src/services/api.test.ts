import { afterEach, describe, expect, it, vi } from "vitest";

import { createCategory, fetchCategories } from "./api";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

describe("category API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns categories when the response body has category objects", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([{ id: 1, name: "Food" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCategories()).resolves.toEqual([{ id: 1, name: "Food" }]);
  });

  it("rejects malformed category lists when fetching categories", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([{ id: "bad", name: "Food" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCategories()).rejects.toThrow("Failed to fetch categories");
  });

  it("posts a category name and returns the created category", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ id: 2, name: "Pets" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory("Pets")).resolves.toEqual({ id: 2, name: "Pets" });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.body).toBe(JSON.stringify({ category: { name: "Pets" } }));
  });

  it("rejects malformed created category payloads", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ id: 2, name: null }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory("Pets")).rejects.toThrow("Failed to create category");
  });

  it("uses backend validation messages when category creation fails", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        { errors: ["Name has already been taken"] },
        { status: 422 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory("Food")).rejects.toThrow(
      "Name has already been taken",
    );
  });

  it("uses a fallback message for malformed category error payloads", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: "duplicate" }, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory("Food")).rejects.toThrow(
      "Failed to create category",
    );
  });

  it("uses a fallback message for empty category error arrays", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ errors: [] }, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createCategory("Food")).rejects.toThrow(
      "Failed to create category",
    );
  });
});
