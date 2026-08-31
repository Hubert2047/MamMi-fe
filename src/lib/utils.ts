import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PaymentMethod } from "@/constants";
import type { BaseOrder, OrderItem } from "@/api/order";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStatusString(status: string) {
  switch (status) {
    case "pending":
      return "Chờ thanh toán";
    case "paid":
      return "Đã thanh toán";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

export function getOrderTypeString(type: string) {
  switch (type) {
    case "dine_in":
      return "Tại quán";
    case "takeaway":
      return "Mang đi";
    case "uber":
      return "Uber";
    case "foodpanda":
      return "Foodpanda";
    default:
      return type;
  }
}

export function getPaymentMethodString(method: string) {
  switch (method) {
    case "cash":
      return "Tiền mặt";
    case "uber":
      return "Uber";
    case "linepay":
      return "Linepay";
    case "bank":
      return "Ngân hàng";
    case "foodpanda":
      return "Foodpanda";
    default:
      return method;
  }
}

export function getPriceByType(
  type: "dine_in" | "takeaway" | "uber" | "foodpanda",
  price: { [key: string]: number | undefined },
): number {
  switch (type) {
    case "dine_in":
    case "takeaway":
      return price.base ?? 0;
    case "uber":
      return price.uber ?? 0;
    case "foodpanda":
      return price.foodpanda ?? 0;
    default:
      return 0;
  }
}
export function getPaymentMethodByType(
  type: "dine_in" | "takeaway" | "uber" | "foodpanda",
): PaymentMethod {
  switch (type) {
    case "dine_in":
    case "takeaway":
      return "cash";
    case "uber":
      return "uber";
    case "foodpanda":
      return "foodpanda";
    default:
      return "cash";
  }
}
export function generateUUID() {
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  } else {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}
const printQueue: { content: string; mode: "customer" | "kitchen" }[] = [];
let isPrinting = false;

export function printReceipt(
  content: string,
  mode: "customer" | "kitchen" = "customer",
) {
  printQueue.push({ content, mode });
  processQueue();
}

export function processQueue() {
  if (isPrinting || printQueue.length === 0) return;
  isPrinting = true;
  const { content, mode } = printQueue.shift()!;
  const isKitchen = mode === "kitchen";

  const css = `
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
            height: fit-content;
            overflow: hidden;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${isKitchen ? "15px" : "13px"};
            font-weight: bold;
            line-height: 1.4;
            padding: 2mm;
        }
        .header {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
        }
        .header.kitchen { font-size: 17px; }
        .divider {
            border: none;
            border-top: 2px dashed #000;
            margin: 4px 0;
            width: 100%;
        }
        .items {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .items tr { vertical-align: top; }
        .items td { padding: 2px 0; word-break: break-word; }
        .idx   { width: 18px; }
        .price { width: 52px; text-align: right; white-space: nowrap; }
        .name  { width: auto; }
        .qty   { width: 36px; text-align: right; white-space: nowrap; }
        .kitchen-item .name { font-size: 18px; }
        .kitchen-item .qty  { font-size: 18px; }
        .detail {
            display: block;
            font-size: ${isKitchen ? "14px" : "13px"};
            font-weight: normal;
            margin-top: 3px;
        }
        .detail.note-options { margin-top: 0; padding-top: 10px; }
        .detail.sub { padding-left: 8px; }
        .addon-price { float: right; font-weight: bold; }
        .footer { text-align: center; padding: 4px 0; }
    `;

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });

  iframe.srcdoc = `
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${css}</style>
        </head>
        <body>${content}</body>
        </html>
    `;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    const fw = iframe.contentWindow;
    const fd = iframe.contentDocument;
    if (!fw || !fd) {
      document.body.removeChild(iframe);
      isPrinting = false;
      processQueue();
      return;
    }

    // Đợi fonts/layout render xong rồi mới đo
    setTimeout(() => {
      const actualHeight = fd.body.scrollHeight;

      // Override @page với chiều cao thực của content
      const pageStyle = fd.createElement("style");
      pageStyle.textContent = `
                @page {
                    size: 80mm ${actualHeight}px;
                    margin: 0;
                }
            `;
      fd.head.appendChild(pageStyle);

      fw.focus();
      fw.print();

      fw.onafterprint = () => {
        document.body.removeChild(iframe);
        isPrinting = false;
        processQueue();
      };
    }, 150);
  };
}
// ─── Receipt cho khách (có giá) ───────────────────────────────
export function generateReceiptHTML(order: BaseOrder): string {
  const itemRows = order.items
    .map((item, index) => {
      const price =
        item.quantity *
        (item.basePrice +
          (item.addonDisplayMode === "merged"
            ? item.addons.reduce(
                (sum, addon) => sum + addon.priceExtra * addon.amount,
                0,
              )
            : 0));
      return `
            <tr>
                <td class="idx">${index + 1}.</td>
                <td class="name">${item.printName || item.name}${buildItemDetailsHTML(item, true)}</td>
                <td class="qty">x${item.quantity}</td>
                <td class="price">${price.toLocaleString()}</td>
            </tr>`;
    })
    .join("");

  return `
        <div class="header">${buildHeaderHTML(order)}</div>
        <hr class="divider"></div>
        <table class="items">${itemRows}</table>
        <hr class="divider"></div>
        <div class="footer">共 ${order.items.length} 項</div>
    `;
}

// ─── Receipt cho bếp (không giá, 1 món, to hơn) ───────────────
export function generateKitchenReceiptHTML(
  order: BaseOrder,
  item: OrderItem,
  index: number,
): string {
  return `
        <div class="header kitchen">${buildHeaderHTML(order)}</div>
        <div class="divider"></div>
        <table class="items kitchen-item">
            <tr>
                <td class="name">${item.printName || item.name}${buildItemDetailsHTML(item, false)}</td>
                <td class="qty">x${item.quantity}</td>
            </tr>
        </table>
        <div class="divider"></div>
        <div class="footer">共 ${index + 1} / ${order.items.length} 項</div>
    `;
}

// ─── Shared helpers ────────────────────────────────────────────
function buildHeaderHTML(order: BaseOrder): string {
  const time = new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const typeLabel =
    (
      {
        takeaway: "外帶",
        dine_in: "內用",
        uber: "Uber",
        foodpanda: "FoodPanda",
      } as Record<string, string>
    )[order.type] ?? "";
  return `
        <span>#${String(order.number).padStart(3, "0")}</span>
        <span>${typeLabel}</span>
        <span>${time}</span>
    `;
}

function buildItemDetailsHTML(item: OrderItem, showPrice: boolean): string {
  const parts: string[] = [];

  if (item.printVariant || item.variant) {
    parts.push(` (${item.printVariant || item.variant})`);
  }
  const noteOptions = item.printNoteOptions || item.noteOptions;
  if (noteOptions.length > 0) {
    parts.push(
      `<div class="detail note-options">不加: ${noteOptions.join(", ")}</div>`,
    );
  }
  const addons = item.printAddons || item.addons;
  if (item.addonDisplayMode !== "merged" && addons.length > 0) {
    parts.push(
      `<div class="detail">加點: ${addons
        .map((addon) => {
          const priceStr = showPrice
            ? `<span class="addon-price">${(addon.priceExtra * addon.amount).toLocaleString()}</span>`
            : "";
          return `${addon.printName || addon.name}${addon.amount > 1 ? ` x${addon.amount}` : ""}${priceStr}`;
        })
        .join(", ")}</div>`,
    );
  }
  if (item.note) {
    parts.push(`<div class="detail">備註: ${item.note}</div>`);
  }

  return parts.join("");
}
