import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import RulesPage from "./RulesPage";
import { getGameName } from "../data/games";

const t = (key) => key;

describe("RulesPage", () => {
  test("renders group headings", () => {
    render(<RulesPage t={t} />);
    expect(screen.getByText("ruleGroupUno")).toBeInTheDocument();
    expect(screen.getByText("ruleGroupCards")).toBeInTheDocument();
    expect(screen.getByText("ruleGroupCasino")).toBeInTheDocument();
  });

  test("renders a rule card per known game with collapsed body", () => {
    render(<RulesPage t={t} />);
    const unoBtn = screen.getByRole("button", { name: getGameName("uno", t) });
    expect(unoBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking a card header expands it", () => {
    render(<RulesPage t={t} />);
    const unoBtn = screen.getByRole("button", { name: getGameName("uno", t) });
    fireEvent.click(unoBtn);
    expect(unoBtn).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(unoBtn);
    expect(unoBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("search filters cards by game name", () => {
    render(<RulesPage t={t} search="truco" />);
    expect(screen.getByRole("button", { name: getGameName("truco", t) })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: getGameName("poker", t) })).not.toBeInTheDocument();
  });

  test("search with no match hides all groups", () => {
    const { container } = render(<RulesPage t={t} search="zzzznotagamezzz" />);
    expect(container.querySelectorAll(".rule-game-card")).toHaveLength(0);
  });

  test("empty search shows all groups", () => {
    render(<RulesPage t={t} search="" />);
    expect(screen.getByText("ruleGroupTokens")).toBeInTheDocument();
    expect(screen.getByText("ruleGroupRandom")).toBeInTheDocument();
  });

  test("expanded card shows section content", () => {
    render(<RulesPage t={t} />);
    const unoBtn = screen.getByRole("button", { name: getGameName("uno", t) });
    fireEvent.click(unoBtn);
    const card = unoBtn.closest(".rule-game-card");
    expect(within(card).getByText("", { selector: ".rule-body" })).toBeTruthy();
  });
});
