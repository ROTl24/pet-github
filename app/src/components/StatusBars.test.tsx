import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBars } from "./StatusBars";

describe("StatusBars", () => {
  it("renders mood and energy values", () => {
    render(<StatusBars mood={42} energy={77} />);

    expect(screen.getByLabelText("Mood 42 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Energy 77 of 100")).toBeInTheDocument();
  });
});
