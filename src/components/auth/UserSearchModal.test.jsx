import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import UserSearchModal from "./UserSearchModal";

vi.mock("../../lib/firebase", () => ({ fbAuth: { currentUser: null }, fbDb: {} }));
vi.mock("./QRScanner", () => ({ default: () => null }));

describe("UserSearchModal", () => {
  test("closes when its backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<UserSearchModal onLink={vi.fn()} onClose={onClose} t={(key) => key} />);

    fireEvent.click(screen.getByTestId("user-search-backdrop"));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
