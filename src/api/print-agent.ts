import api from "./axios";

export type PrintAgentProfile = "kitchen-label-tspl" | "receipt-escpos";
export type Printer = {
  _id: string;
  agentId: string;
  name: string;
  windowsPrinterName: string;
  profile: PrintAgentProfile;
  active: boolean;
  printerDpi: number;
  labelWidthMm: number;
  labelHeightMm?: number;
  labelGapMm?: number;
  cutEnabled: boolean;
  cutFeedHex?: string;
  cutCommandHex?: string;
};

export type PrintAgent = {
  _id: string;
  name: string;
  agentId: string;
  tokenPrefix: string;
  active: boolean;
  printers: Printer[];
  lastSeenAt?: string;
};

export type PrintRouting = {
  kitchenPrinterId?: string;
  receiptPrinterId?: string;
  fapiaoPrinterId?: string;
};
export type PrintAgentInput = Pick<PrintAgent, "name">;

export async function getPrintAgents(): Promise<{
  agents: PrintAgent[];
  routing: PrintRouting;
}> {
  return (await api.get("print-agents")).data.data;
}

export async function createPrintAgent(
  data: PrintAgentInput,
): Promise<PrintAgent & { token: string }> {
  return (await api.post("print-agents", data)).data.data;
}

export async function updatePrintAgent({
  id,
  data,
}: {
  id: string;
  data: Partial<PrintAgentInput> & { active?: boolean };
}): Promise<PrintAgent> {
  return (await api.patch(`print-agents/${id}`, data)).data.data;
}

export async function createPrinter({
  agentId,
  data,
}: {
  agentId: string;
  data: Omit<Printer, "_id" | "agentId" | "active">;
}): Promise<Printer> {
  return (await api.post(`print-agents/${agentId}/printers`, data)).data.data;
}

export async function updatePrinter({
  agentId,
  printerId,
  data,
}: {
  agentId: string;
  printerId: string;
  data: Partial<Printer>;
}): Promise<Printer> {
  return (
    await api.patch(`print-agents/${agentId}/printers/${printerId}`, data)
  ).data.data;
}

export async function testPrinter({
  agentId,
  printerId,
  printableText,
  fontSize,
  bold,
  copies,
}: {
  agentId: string;
  printerId: string;
  printableText?: string;
  fontSize?: number;
  bold?: boolean;
  copies?: number;
}): Promise<void> {
  await api.post(`print-agents/${agentId}/printers/${printerId}/test`, { printableText, fontSize, bold, copies });
}

export async function updatePrintRouting(
  data: PrintRouting,
): Promise<PrintRouting> {
  return (await api.put("print-agents/routing", data)).data.data;
}

export async function rotatePrintAgentToken(
  id: string,
): Promise<PrintAgent & { token: string }> {
  return (await api.post(`print-agents/${id}/rotate-token`)).data.data;
}
