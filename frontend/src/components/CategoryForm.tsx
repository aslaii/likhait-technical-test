import React, { useState } from "react";
import { COLORS } from "../constants/colors";
import { Button, TextField } from "../vibes";

interface CategoryFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel?: () => void;
}

export function CategoryForm({ onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  };

  const errorStyle: React.CSSProperties = {
    color: COLORS.danger,
    fontSize: "0.875rem",
    margin: 0,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      await onSubmit(trimmedName);
      setName("");
      onCancel?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <TextField
        label="Category name"
        type="text"
        placeholder="Enter category name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (error) {
            setError(undefined);
          }
        }}
        fullWidth
        required
      />
      {error && <p style={errorStyle}>{error}</p>}
      <div style={buttonGroupStyle}>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? "Adding..." : "Add Category"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
