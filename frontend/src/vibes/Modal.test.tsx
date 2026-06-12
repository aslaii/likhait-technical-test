import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders its title and content when open", () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Add Expense">
        <p>Expense form content</p>
      </Modal>,
    );

    expect(screen.getByRole("heading", { name: "Add Expense" })).toBeInTheDocument();
    expect(screen.getByText("Expense form content")).toBeInTheDocument();
  });
});
