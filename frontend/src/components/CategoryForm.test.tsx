import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CategoryForm } from "./CategoryForm";

function deferredPromise() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("CategoryForm", () => {
  it("renders the category name field and actions", () => {
    render(<CategoryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByPlaceholderText("Enter category name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Category" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onSubmit with the trimmed category name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Enter category name"), "  Pets  ");
    await user.click(screen.getByRole("button", { name: "Add Category" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Pets");
    });
  });

  it("displays an error when submit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("Name has already been taken"));

    render(<CategoryForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Enter category name"), "Food");
    await user.click(screen.getByRole("button", { name: "Add Category" }));

    expect(await screen.findByText("Name has already been taken")).toBeInTheDocument();
  });

  it("disables the submit action while submitting", async () => {
    const user = userEvent.setup();
    const pendingSubmit = deferredPromise();
    const onSubmit = vi.fn<() => Promise<void>>().mockReturnValue(pendingSubmit.promise);

    render(<CategoryForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Enter category name"), "Pets");
    await user.click(screen.getByRole("button", { name: "Add Category" }));

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();

    pendingSubmit.resolve();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Category" })).not.toBeDisabled();
    });
  });
});
