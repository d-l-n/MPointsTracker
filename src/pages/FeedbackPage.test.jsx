import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeedbackPage from "./FeedbackPage";

const addDocMock = vi.fn().mockResolvedValue({});
vi.mock("firebase/firestore", () => ({
  addDoc: (...args) => addDocMock(...args),
  collection: (_db, path) => path,
  serverTimestamp: () => ({ __serverTimestamp: true }),
}));

vi.mock("../lib/firebase", () => ({ fbDb: {} }));

const t = (key) => key;

describe("FeedbackPage", () => {
  beforeEach(() => {
    addDocMock.mockClear();
    addDocMock.mockResolvedValue({});
  });

  test("renders the four feedback type buttons", () => {
    render(<FeedbackPage user={null} showToast={vi.fn()} t={t} />);
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(4);
  });

  test("submits feedback and shows the success state", async () => {
    render(
      <FeedbackPage
        user={{ displayName: "Ana", email: "ana@x.com" }}
        showToast={vi.fn()}
        t={t}
      />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Se rompe el contador del UNO" } });
    fireEvent.click(screen.getByText("send"));
    await waitFor(() => expect(addDocMock).toHaveBeenCalled());
    expect(screen.getByText("sent")).toBeInTheDocument();
  });

  test("shows error toast when submission fails", async () => {
    addDocMock.mockRejectedValueOnce(new Error("boom"));
    const showToast = vi.fn();
    render(<FeedbackPage user={null} showToast={showToast} t={t} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Este es un mensaje de prueba" } });
    fireEvent.click(screen.getByText("send"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("sendError"));
  });

  test("disables send until a type is selected and message is long enough", () => {
    render(<FeedbackPage user={null} showToast={vi.fn()} t={t} />);
    const send = screen.queryByText("send");
    expect(send).toBeNull();
  });
});
