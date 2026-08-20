import { describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BlobatarPicker from "./BlobatarPicker";
import { getBlobatarUri } from "../../lib/blobatar";

const t = (k: string) => k;

describe("BlobatarPicker", () => {
  test("renders 8 hue swatches and 10 shape cells", () => {
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={() => {}} onCancel={() => {}} t={t} />);
    expect(screen.getAllByRole("button", { name: /color/i })).toHaveLength(8);
    expect(screen.getAllByRole("button", { name: /shape/i })).toHaveLength(10);
  });

  test("clicking shape then confirm calls onChange with a data URI", () => {
    const onChange = vi.fn();
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={onChange} onCancel={() => {}} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: /shape round/i }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const uri = onChange.mock.calls[0][0] as string;
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });

  test("confirm button is disabled when no changes made", () => {
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={() => {}} onCancel={() => {}} t={t} />);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  test("confirm button enables after selecting a shape", () => {
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={() => {}} onCancel={() => {}} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: /shape round/i }));
    expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
  });

  test("cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={() => {}} onCancel={onCancel} t={t} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("selecting a hue changes the shape cell sources", () => {
    render(<BlobatarPicker seed="alice@test.com" value={null} onChange={() => {}} onCancel={() => {}} t={t} />);
    const firstSrc = screen.getByRole("button", { name: /shape round/i }).querySelector("img")!.getAttribute("src");
    fireEvent.click(screen.getByRole("button", { name: /color 2/i }));
    const secondSrc = screen.getByRole("button", { name: /shape round/i }).querySelector("img")!.getAttribute("src");
    expect(secondSrc).not.toBe(firstSrc);
  });

  test("marks the current value cell as selected", () => {
    const current = getBlobatarUri("alice@test.com", { hue: 12, traits: { shape: 0.11 } });
    render(<BlobatarPicker seed="alice@test.com" value={current} onChange={() => {}} onCancel={() => {}} t={t} />);
    expect(screen.getByRole("button", { name: /shape round/i })).toHaveAttribute("aria-pressed", "true");
  });
});
