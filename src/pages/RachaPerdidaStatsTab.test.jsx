import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import RachaPerdidaStatsTab from "./RachaPerdidaStatsTab";

const t = (key) => key;

const matches = [
  { id: "1", date: "2026-05-10T10:00:00.000Z", players: [{ name: "Ana" }], penalty: "Lava los platos" },
  { id: "2", date: "2026-05-11T10:00:00.000Z", players: [{ name: "Ana" }], penalty: "Paga la ronda" },
  { id: "3", date: "2026-05-12T10:00:00.000Z", players: [{ name: "Beto" }] },
];

describe("RachaPerdidaStatsTab", () => {
  test("shows empty state when no matches", () => {
    render(<RachaPerdidaStatsTab matches={[]} t={t} />);
    expect(screen.getByText("noRecordsYet")).toBeInTheDocument();
  });

  test("counts total registros", () => {
    render(<RachaPerdidaStatsTab matches={matches} t={t} />);
    expect(screen.getByText("loserRegistros").previousSibling).toHaveTextContent("3");
  });

  test("ranks players by loss count, highest first", () => {
    render(<RachaPerdidaStatsTab matches={matches} t={t} />);
    const names = screen.getAllByText(/Ana|Beto/).map((el) => el.textContent);
    expect(names[0]).toBe("Ana");
  });

  test("max losses reflects top ranked player", () => {
    render(<RachaPerdidaStatsTab matches={matches} t={t} />);
    expect(screen.getByText("loserMaxLosses").previousSibling).toHaveTextContent("2");
  });

  test("renders penalty text in recent list", () => {
    render(<RachaPerdidaStatsTab matches={matches} t={t} />);
    expect(screen.getAllByText("Lava los platos").length).toBeGreaterThan(0);
  });

  test("shows open history button only when handler provided", () => {
    const onOpenHistory = vi.fn();
    const { rerender } = render(<RachaPerdidaStatsTab matches={matches} t={t} onOpenHistory={onOpenHistory} />);
    fireEvent.click(screen.getByTestId("detail-history-open"));
    expect(onOpenHistory).toHaveBeenCalled();

    rerender(<RachaPerdidaStatsTab matches={matches} t={t} onOpenHistory={null} />);
    expect(screen.queryByTestId("detail-history-open")).not.toBeInTheDocument();
  });

  test("uses placeholder when preview match has no player name", () => {
    render(<RachaPerdidaStatsTab matches={[{ id: "x", date: "2026-05-13T00:00:00.000Z", players: [] }]} t={t} />);
    expect(screen.getByText("noNamePlaceholder")).toBeInTheDocument();
  });
});
