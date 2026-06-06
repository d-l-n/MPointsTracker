import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SaveGroupButton from "./SaveGroupButton";

describe("SaveGroupButton", () => {
  const t = (key) => key;

  test("returns null when fewer than 2 named players", () => {
    const { container } = render(<SaveGroupButton players={[{ id: "1", name: "" }]} onSave={() => {}} t={t} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders button to save group when closed", () => {
    render(
      <SaveGroupButton
        players={[{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }]}
        onSave={() => {}}
        t={t}
      />,
    );
    expect(screen.getByText("saveGroupAs")).toBeInTheDocument();
  });

  test("opens save form on click", () => {
    render(
      <SaveGroupButton
        players={[{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }]}
        onSave={() => {}}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("saveGroupAs"));
    expect(screen.getByText("saveGroupSaveBtn")).toBeInTheDocument();
  });

  test("saves group and shows saved state", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(
      <SaveGroupButton
        players={[{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }]}
        linkedPlayers={[{ playerId: "1", uid: "u1", name: "Alice" }]}
        onSave={onSave}
        t={t}
      />,
    );
    fireEvent.click(screen.getByText("saveGroupAs"));
    fireEvent.change(screen.getByPlaceholderText("saveGroupNamePlaceholder"), { target: { value: "My Group" } });
    fireEvent.click(screen.getByText("saveGroupSaveBtn"));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText("saveGroupSaved")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
