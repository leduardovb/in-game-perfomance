import { describe, expect, it } from "vitest";
import { addDays, isIsoDate, toIsoDateInTimeZone } from "./date";

describe("toIsoDateInTimeZone", () => {
  it("uses the calendar day of the given time zone, not UTC", () => {
    // 01:30 UTC on Nov 26 is still 22:30 on Nov 25 in Belém (UTC-3).
    const now = new Date("2026-11-26T01:30:00Z");
    expect(toIsoDateInTimeZone(now, "America/Belem")).toBe("2026-11-25");
    expect(toIsoDateInTimeZone(now, "UTC")).toBe("2026-11-26");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("isIsoDate", () => {
  it("accepts real days and rejects malformed or impossible ones", () => {
    expect(isIsoDate("2026-11-25")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("25/11/2026")).toBe(false);
  });
});
