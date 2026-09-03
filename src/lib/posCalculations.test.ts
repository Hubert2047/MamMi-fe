import { describe, expect, it } from "vitest";
import {
  calculateOrderPriceBreakdown,
  calculateOrderTotal,
  findFreshSelectedItem,
  getUnavailableAddonIds,
  syncOrderItemsWithCatalog,
} from "./posCalculations";

const item = (priceExtra: number) => ({
  _id: "item-1",
  name: "Item",
  names: { vi: "Item", en: "Item", "zh-TW": "Item" },
  description: { vi: "", en: "", "zh-TW": "" },
  categoryName: "Category",
  price: { base: 10 },
  addons: [{ _id: "addon-1", name: "Addon", priceExtra }],
  variants: [],
  optionGroups: [],
  noteOptions: [],
  permanentlyActive: true,
  temporarilyUnavailable: false,
});

describe("POS selected item synchronization", () => {
  it("returns the fresh item so addon prices update after a catalog refetch", () => {
    const fresh = item(25);
    expect(
      findFreshSelectedItem("item-1", [fresh])?.addons[0]?.priceExtra,
    ).toBe(25);
  });

  it("clears the selection when the item no longer exists", () => {
    expect(findFreshSelectedItem("item-1", [])).toBeNull();
  });

  it("detects an addon that became temporarily unavailable while selected", () => {
    const catalogItem = {
      ...item(10),
      addons: [
        {
          _id: "addon-1",
          name: "Addon",
          priceExtra: 10,
          temporarilyUnavailable: true,
        },
        {
          _id: "addon-2",
          name: "Other",
          priceExtra: 5,
          temporarilyUnavailable: true,
        },
      ],
    };
    expect(getUnavailableAddonIds(catalogItem, ["addon-1"])).toEqual([
      "addon-1",
    ]);
  });

  it("does not block selected addons that are still available", () => {
    expect(getUnavailableAddonIds(item(10), ["addon-1"])).toEqual([]);
  });

  it("updates the total-price data for an addon already active in the draft order", () => {
    const draft = {
      ...item(10),
      id: "item-1",
      itemId: "item-1",
      quantity: 1,
      basePrice: 10,
      variant: "",
      note: "",
      addons: [{ id: "addon-1", name: "Addon", amount: 1, priceExtra: 10 }],
    };
    const synced = syncOrderItemsWithCatalog([draft], [item(25)])[0];
    expect(synced?.addons[0]?.priceExtra).toBe(25);
    expect(
      calculateOrderTotal({
        items: synced ? [synced] : [],
        appliedPromotions: [],
      }),
    ).toBe(35);
  });

  it("does not change addon data that is no longer present in the catalog", () => {
    const draft = {
      ...item(10),
      id: "item-1",
      itemId: "item-1",
      quantity: 1,
      basePrice: 10,
      variant: "",
      note: "",
      addons: [
        { id: "removed-addon", name: "Removed", amount: 1, priceExtra: 10 },
      ],
    };
    const synced = syncOrderItemsWithCatalog([draft], [item(25)])[0];
    expect(synced?.addons[0]?.priceExtra).toBe(10);
  });

  it("updates only matching order lines when several products are in the draft", () => {
    const first = {
      ...item(10),
      id: "item-1",
      itemId: "item-1",
      quantity: 1,
      basePrice: 10,
      variant: "",
      note: "",
      addons: [{ id: "addon-1", name: "Addon", amount: 1, priceExtra: 10 }],
    };
    const second = {
      ...item(10),
      _id: "item-2",
      id: "item-2",
      itemId: "item-2",
      quantity: 1,
      basePrice: 20,
      variant: "",
      note: "",
      addons: [{ id: "addon-1", name: "Addon", amount: 1, priceExtra: 5 }],
    };
    const synced = syncOrderItemsWithCatalog([first, second], [item(25)]);
    expect(synced[0]?.addons[0]?.priceExtra).toBe(25);
    expect(synced[1]?.addons[0]?.priceExtra).toBe(5);
  });

  it("keeps product, addon, and discount values visible in the checkout breakdown", () => {
    const order = {
      items: [
        {
          ...item(10),
          id: "item-1",
          itemId: "item-1",
          quantity: 2,
          basePrice: 20,
          variant: "",
          note: "",
          addons: [{ id: "addon-1", name: "Addon", amount: 1, priceExtra: 10 }],
        },
      ],
      appliedPromotions: [
        {
          promotionId: "ten",
          promotionVersion: 1,
          name: "Ten percent",
          mode: "manual" as const,
          discountAmount: 6,
          allocations: [],
        },
      ],
    };
    expect(calculateOrderPriceBreakdown(order)).toEqual({
      productSubtotal: 40,
      addonSubtotal: 20,
      subtotal: 60,
      discountAmount: 6,
      total: 54,
    });
  });
});
