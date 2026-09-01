import { describe, expect, it } from "vitest";
import { realtimeClientTypeForPath, realtimeEventsForClient } from "./realtime";

describe("frontend realtime subscriptions", () => {
  it("selects a client type from the active application area", () => {
    expect(realtimeClientTypeForPath("/pos")).toBe("pos");
    expect(realtimeClientTypeForPath("/admin/store-pricing")).toBe("admin");
    expect(realtimeClientTypeForPath("/order/abc")).toBe("customer");
  });

  it("does not subscribe customer web clients to orders or closing", () => {
    const events = realtimeEventsForClient("customer");
    expect(events.some((event) => event.startsWith("order."))).toBe(false);
    expect(events.some((event) => event.startsWith("closing."))).toBe(false);
    expect(events).toContain("catalog.store-item.availability.updated");
  });

  it("subscribes POS to orders but not closing", () => {
    const events = realtimeEventsForClient("pos");
    expect(events).toContain("order.created");
    expect(events).toContain("revenue.created");
    expect(events).toContain("revenue.updated");
    expect(events).toContain("revenue.deleted");
    expect(events).toContain("expense.created");
    expect(events).toContain("expense.updated");
    expect(events).toContain("expense.deleted");
    expect(events).not.toContain("closing.created");
  });

  it("subscribes admin to all store management channels", () => {
    const events = realtimeEventsForClient("admin");
    expect(events).toContain("catalog.store-item.price.updated");
    expect(events).toContain("order.payment.updated");
    expect(events).toContain("closing.voided");
    expect(events).toContain("revenue.created");
    expect(events).toContain("revenue.updated");
    expect(events).toContain("revenue.deleted");
    expect(events).toContain("expense.created");
    expect(events).toContain("expense.updated");
    expect(events).toContain("expense.deleted");
  });
});
