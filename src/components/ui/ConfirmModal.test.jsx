import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmModal from "./ConfirmModal";

describe("ConfirmModal", () => {
  test("renders title and message", () => {
    render(<ConfirmModal title="Delete?" msg="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  test("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmModal title="T" msg="M" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });

  test("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal title="T" msg="M" onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("renders secondary action when provided", () => {
    const onSecondary = vi.fn();
    render(
      <ConfirmModal
        title="T" msg="M"
        onConfirm={() => {}} onCancel={() => {}}
        secondaryLabel="Archive" onSecondaryAction={onSecondary}
      />,
    );
    expect(screen.getByText("Archive")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Archive"));
    expect(onSecondary).toHaveBeenCalled();
  });

  test("renders danger tone classes", () => {
    render(
      <ConfirmModal
        title="T" msg="M"
        onConfirm={() => {}} onCancel={() => {}}
        confirmTone="danger" secondaryLabel="S" onSecondaryAction={() => {}} secondaryTone="danger"
      />,
    );
    expect(screen.getByText("Eliminar")).toHaveClass("is-danger");
  });

  test("calls onOverlayClick when overlay is clicked", () => {
    const onOverlay = vi.fn();
    const { container } = render(
      <ConfirmModal title="T" msg="M" onConfirm={() => {}} onCancel={() => {}} onOverlayClick={onOverlay} />,
    );
    const overlay = container.querySelector(".modal-overlay");
    fireEvent.click(overlay);
    expect(onOverlay).toHaveBeenCalled();
  });
});
