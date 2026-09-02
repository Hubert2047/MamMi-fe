import { describe, expect, it } from "vitest";
import {
  formatTaipeiDateTimeInput,
  parseTaipeiDateTimeInput,
} from "./promotionDate";

describe("promotion Taiwan datetime", () => {
  it("converts a selected Taiwan time to UTC for the API", () => {
    expect(parseTaipeiDateTimeInput("2026-09-09T09:00")).toBe(
      "2026-09-09T01:00:00.000Z",
    );
  });

  it("displays a stored UTC time as the same Taiwan time", () => {
    expect(formatTaipeiDateTimeInput("2026-09-09T01:00:00.000Z")).toBe(
      "2026-09-09T09:00",
    );
  });

  it("round-trips promotion datetime without changing the selected hour", () => {
    const selected = "2026-09-09T09:15";
    expect(formatTaipeiDateTimeInput(parseTaipeiDateTimeInput(selected))).toBe(
      selected,
    );
  });
});
