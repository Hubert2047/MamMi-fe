"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createPrintAgent,
  createPrinter,
  getPrintAgents,
  rotatePrintAgentToken,
  testPrinter,
  updatePrintAgent,
  updatePrinter,
  updatePrintRouting,
  type PrintAgent,
  type PrintAgentInput,
  type PrintRouting,
  type Printer,
} from "@/api/print-agent";
import { useI18n } from "@/lib/i18n";

const agentInitial: PrintAgentInput = { name: "" };
const defaultTestPrintText = "列印測試\n印表機連線正常";
type PrinterForm = {
  name: string;
  windowsPrinterName: string;
  profile: Printer["profile"];
  printerDpi: number;
  labelWidthMm: number;
  labelHeightMm: number;
  labelGapMm: number;
  cutEnabled: boolean;
  cutFeedHex: string;
  cutCommandHex: string;
};
const printerInitial: PrinterForm = {
  name: "",
  windowsPrinterName: "",
  profile: "kitchen-label-tspl",
  printerDpi: 203,
  labelWidthMm: 58,
  labelHeightMm: 40,
  labelGapMm: 2,
  cutEnabled: false,
  cutFeedHex: "",
  cutCommandHex: "",
};

export default function PrintAgentSettings() {
  const { t: translate } = useI18n();
  const t = (key: string) =>
    key === "printAgentNoPrinters" ? "" : translate(key);
  const client = useQueryClient();
  const [agentForm, setAgentForm] = useState(agentInitial);
  const [printerForms, setPrinterForms] = useState<
    Record<string, typeof printerInitial>
  >({});
  const [tokenData, setTokenData] = useState<{
    agent: PrintAgent;
    token: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [routeDraft, setRouteDraft] = useState<PrintRouting>({});
  const [printerEdit, setPrinterEdit] = useState<{
    agentId: string;
    printerId: string;
    data: PrinterForm;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    message: string;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"routing" | "agents">("agents");
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [isCreatePrinterOpen, setIsCreatePrinterOpen] = useState(false);
  const [testDraft, setTestDraft] = useState<{
    agentId: string;
    printerId: string;
    text: string;
    fontSize: number;
    bold: boolean;
    copies: number;
  } | null>(null);
  const [createPrinterAgentId, setCreatePrinterAgentId] = useState("");
  const [createPrinterForm, setCreatePrinterForm] =
    useState<PrinterForm>(printerInitial);
  const settingsRef = useRef<HTMLDivElement>(null);
  const query = useQuery({
    queryKey: ["print-agents"],
    queryFn: getPrintAgents,
  });
  const agents = query.data?.agents ?? [];
  const allPrinters = agents.flatMap((agent) => agent.printers);
  const invalidate = () =>
    void client.invalidateQueries({ queryKey: ["print-agents"] });

  useEffect(() => {
    if (query.data?.routing) setRouteDraft(query.data.routing);
  }, [query.data?.routing]);
  useEffect(() => {
    const root = settingsRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-slot="card"]').forEach((card) => {
      const text = card.textContent || "";
      if (text.includes(t("printAgentRoutingTitle"))) {
        card.style.display = activeTab === "routing" ? "" : "none";
        const title = card.querySelector<HTMLElement>(
          '[data-slot="card-title"]',
        );
        const description = card.querySelector<HTMLElement>(
          '[data-slot="card-description"]',
        );
        if (title) title.style.display = "none";
        if (description) description.style.display = "none";
        card
          .querySelectorAll<HTMLElement>('[data-slot="select-trigger"]')
          .forEach((trigger) => {
            trigger.style.width = "fit-content";
            trigger.style.minWidth = "12rem";
          });
        const routeGrid = card.querySelector<HTMLElement>(
          '[data-slot="card-content"] > div',
        );
        if (routeGrid) {
          routeGrid.style.display = "flex";
          routeGrid.style.flexWrap = "wrap";
          routeGrid.style.gap = "1rem";
          routeGrid.style.alignItems = "flex-end";
        }
      }
      if (text.includes(t("printAgentAgentSection")))
        card.style.display = activeTab === "agents" ? "" : "none";
      if (text.includes(t("printAgentCreateAgent")))
        card.style.display = "none";
      if (text.includes(t("printAgentAgentSection"))) {
        const title = card.querySelector<HTMLElement>(
          '[data-slot="card-title"]',
        );
        if (title) title.style.display = "none";
        card
          .querySelectorAll<HTMLElement>('[class*="bg-muted/40"]')
          .forEach((form) => {
            form.style.display = "none";
          });
        const addButton = document.getElementById(
          "print-agent-add-printer-button",
        );
        const agentPanel = card.querySelector<HTMLElement>(
          ".rounded-lg.border-2",
        );
        const actions = agentPanel?.querySelector<HTMLElement>(
          ".flex.flex-wrap.items-center.justify-between > .flex.gap-2",
        );
        if (addButton && actions && addButton.parentElement !== actions)
          actions.prepend(addButton);
      }
    });
  }, [activeTab, t]);

  const askConfirmation = (message: string) =>
    new Promise<boolean>((resolve) => setConfirmation({ message, resolve }));
  const createAgent = useMutation({
    mutationFn: createPrintAgent,
    onSuccess: (data) => {
      setCopied(false);
      setTokenData({ agent: data, token: data.token });
      setAgentForm(agentInitial);
      invalidate();
    },
  });
  const create = useMutation({
    mutationFn: createPrinter,
    onSuccess: () => {
      invalidate();
      setIsCreatePrinterOpen(false);
      setCreatePrinterForm(printerInitial);
    },
  });
  const updateAgent = useMutation({
    mutationFn: async (input: { id: string; data: { active: boolean } }) => {
      if (
        !(await askConfirmation(
          input.data.active
            ? t("printAgentConfirmEnable")
            : t("printAgentConfirmDisable"),
        ))
      )
        throw new Error("cancelled");
      return updatePrintAgent(input);
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async (input: {
      agentId: string;
      printerId: string;
      data: { active: boolean };
    }) => {
      if (
        !(await askConfirmation(
          input.data.active
            ? t("printAgentConfirmPrinterEnable")
            : t("printAgentConfirmPrinterDisable"),
        ))
      )
        throw new Error("cancelled");
      return updatePrinter(input);
    },
    onSuccess: invalidate,
  });
  const savePrinter = useMutation({
    mutationFn: (input: {
      agentId: string;
      printerId: string;
      data: PrinterForm;
    }) => updatePrinter(input),
    onSuccess: () => {
      setPrinterEdit(null);
      invalidate();
    },
  });
  const test = useMutation({
    mutationFn: async (input: {
      agentId: string;
      printerId: string;
      printableText: string;
      fontSize: number;
      bold: boolean;
      copies: number;
    }) => {
      return testPrinter(input);
    },
    onSuccess: () => {
      setTestDraft(null);
      toast.success(t("printAgentTestQueued"));
    },
    onError: (error) => {
      if (error instanceof Error && error.message !== "cancelled")
        toast.error(t("printAgentTestFailed"));
    },
  });
  const saveRouting = useMutation({
    mutationFn: updatePrintRouting,
    onSuccess: invalidate,
  });
  const rotate = useMutation({
    mutationFn: async (id: string) => {
      if (!(await askConfirmation(t("printAgentConfirmRotate"))))
        throw new Error("cancelled");
      return rotatePrintAgentToken(id);
    },
    onSuccess: (data) => {
      setCopied(false);
      setTokenData({ agent: data, token: data.token });
    },
  });
  const formFor = (id: string) => printerForms[id] ?? printerInitial;
  const setFormFor = (id: string, data: typeof printerInitial) =>
    setPrinterForms((current) => ({ ...current, [id]: data }));
  const backendUrl =
    typeof window === "undefined"
      ? ""
      : (
          process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin
        ).replace(/\/api\/?$/, "");
  const envText = tokenData
    ? `BACKEND_URL=${backendUrl}\nAGENT_ID=${tokenData.agent.agentId}\nAGENT_TOKEN=${tokenData.token}`
    : "";
  const copyConfig = async () => {
    if (!envText || copied) return;
    try {
      if (navigator.clipboard?.writeText)
        await navigator.clipboard.writeText(envText);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = envText;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const copiedByFallback = document.execCommand("copy");
        textarea.remove();
        if (!copiedByFallback) return;
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const saveRoute = () => {
    void toast.promise(saveRouting.mutateAsync(routeDraft), {
      loading: t("saving"),
      success: t("updateSuccess"),
      error: t("saveError"),
    });
  };
  const routeSelect = (label: string, key: keyof PrintRouting) => (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <Select
        value={routeDraft[key] ?? "none"}
        onValueChange={(value) =>
          setRouteDraft((current) => ({
            ...current,
            [key]: value === "none" ? undefined : value,
          }))
        }
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={t("printAgentRouteUnset")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{t("printAgentRouteUnset")}</SelectItem>
          {allPrinters
            .filter((printer) => printer.active)
            .map((printer) => (
              <SelectItem key={printer._id} value={printer._id}>
                {printer.name} — {printer.windowsPrinterName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
  const receiptCutFields = (
    form: PrinterForm,
    setForm: (data: PrinterForm) => void,
  ) =>
    form.profile === "receipt-escpos" && (
      <div className="space-y-3 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox
            checked={form.cutEnabled}
            onCheckedChange={(enabled) =>
              setForm({ ...form, cutEnabled: enabled === true })
            }
          />
          {t("printAgentCutEnabled")}
        </label>
        {form.cutEnabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("printAgentCutFeedHex")}</Label>
              <Input
                value={form.cutFeedHex}
                onChange={(event) =>
                  setForm({ ...form, cutFeedHex: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentCutCommandHex")}</Label>
              <Input
                value={form.cutCommandHex}
                onChange={(event) =>
                  setForm({ ...form, cutCommandHex: event.target.value })
                }
              />
            </div>
          </div>
        )}
      </div>
    );

  return (
    <div ref={settingsRef} className="space-y-3">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          size="sm"
          variant={activeTab === "agents" ? "default" : "outline"}
          onClick={() => setActiveTab("agents")}
        >
          Print Agent
        </Button>
        <Button
          size="sm"
          variant={activeTab === "routing" ? "default" : "outline"}
          onClick={() => setActiveTab("routing")}
        >
          Print Routing
        </Button>
      </div>
      <Dialog open={isCreatePrinterOpen} onOpenChange={setIsCreatePrinterOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("printAgentAddPrinter")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>{t("printAgentAgentSection")}</Label>
              <Select
                value={createPrinterAgentId}
                onValueChange={setCreatePrinterAgentId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentName")}</Label>
              <Input
                value={createPrinterForm.name}
                onChange={(e) =>
                  setCreatePrinterForm({
                    ...createPrinterForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentWindowsName")}</Label>
              <Input
                value={createPrinterForm.windowsPrinterName}
                onChange={(e) =>
                  setCreatePrinterForm({
                    ...createPrinterForm,
                    windowsPrinterName: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentProfile")}</Label>
              <Select
                value={createPrinterForm.profile}
                onValueChange={(value) =>
                  setCreatePrinterForm({
                    ...createPrinterForm,
                    profile: value as PrinterForm["profile"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen-label-tspl">
                    {t("printAgentKitchenProfile")}
                  </SelectItem>
                  <SelectItem value="receipt-escpos">
                    {t("printAgentReceiptProfile")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentDpi")}</Label>
              <Input
                type="number"
                value={createPrinterForm.printerDpi}
                onChange={(e) =>
                  setCreatePrinterForm({
                    ...createPrinterForm,
                    printerDpi: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>{t("printAgentWidth")}</Label>
              <Input
                type="number"
                value={createPrinterForm.labelWidthMm}
                onChange={(e) =>
                  setCreatePrinterForm({
                    ...createPrinterForm,
                    labelWidthMm: Number(e.target.value),
                  })
                }
              />
            </div>
            {createPrinterForm.profile !== "receipt-escpos" && (
              <>
                <div className="space-y-1">
                  <Label>{t("printAgentHeight")}</Label>
                  <Input
                    type="number"
                    value={createPrinterForm.labelHeightMm}
                    onChange={(e) =>
                      setCreatePrinterForm({
                        ...createPrinterForm,
                        labelHeightMm: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("printAgentGap")}</Label>
                  <Input
                    type="number"
                    value={createPrinterForm.labelGapMm}
                    onChange={(e) =>
                      setCreatePrinterForm({
                        ...createPrinterForm,
                        labelGapMm: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            )}
            {receiptCutFields(createPrinterForm, setCreatePrinterForm)}
            <div className="flex items-end sm:col-span-2">
              <Button
                disabled={
                  create.isPending ||
                  !createPrinterAgentId ||
                  !createPrinterForm.name.trim() ||
                  !createPrinterForm.windowsPrinterName.trim()
                }
                onClick={() =>
                  create.mutate({
                    agentId: createPrinterAgentId,
                    data: createPrinterForm,
                  })
                }
              >
                {create.isPending ? t("saving") : t("printAgentAddPrinter")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateAgentOpen} onOpenChange={setIsCreateAgentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("printAgentCreateAgent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t("printAgentAgentName")}</Label>
            <Input
              value={agentForm.name}
              placeholder={t("printAgentAgentNamePlaceholder")}
              onChange={(event) => setAgentForm({ name: event.target.value })}
            />
            <Button
              disabled={createAgent.isPending || !agentForm.name.trim()}
              onClick={() => createAgent.mutate(agentForm)}
            >
              {createAgent.isPending ? t("saving") : t("printAgentCreateAgent")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(testDraft)}
        onOpenChange={(open) => {
          if (!open && !test.isPending) setTestDraft(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("printAgentTestPrint")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              id="print-agent-test-text"
              value={testDraft?.text ?? ""}
              onChange={(event) =>
                setTestDraft((current) =>
                  current ? { ...current, text: event.target.value } : current,
                )
              }
              rows={5}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="print-agent-test-font-size">
                  {t("printAgentTestFontSize")}
                </Label>
                <Input
                  id="print-agent-test-font-size"
                  type="number"
                  min={8}
                  max={48}
                  value={testDraft?.fontSize ?? 40}
                  onChange={(event) =>
                    setTestDraft((current) =>
                      current
                        ? { ...current, fontSize: Number(event.target.value) }
                        : current,
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="print-agent-test-copies">
                  {t("printAgentTestCopies")}
                </Label>
                <Input
                  id="print-agent-test-copies"
                  type="number"
                  min={1}
                  max={50}
                  value={testDraft?.copies ?? 1}
                  onChange={(event) =>
                    setTestDraft((current) =>
                      current ? { ...current, copies: Number(event.target.value) } : current,
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 pt-7 text-sm font-medium">
                <Checkbox
                  checked={testDraft?.bold ?? false}
                  onCheckedChange={(bold) =>
                    setTestDraft((current) =>
                      current ? { ...current, bold: bold === true } : current,
                    )
                  }
                />
                {t("printAgentTestBold")}
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={test.isPending}
                onClick={() => setTestDraft(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                disabled={test.isPending || !testDraft?.text.trim()}
                onClick={() => {
                  if (!testDraft) return;
                  test.mutate({
                    agentId: testDraft.agentId,
                    printerId: testDraft.printerId,
                    printableText: testDraft.text,
                    fontSize: testDraft.fontSize,
                    bold: testDraft.bold,
                    copies: testDraft.copies,
                  });
                }}
              >
                {test.isPending ? t("saving") : t("printAgentTestPrint")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open && confirmation) {
            confirmation.resolve(false);
            setConfirmation(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-sm p-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                confirmation?.resolve(false);
                setConfirmation(null);
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmation?.resolve(true);
                setConfirmation(null);
              }}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={Boolean(tokenData)}
        onOpenChange={(open) => {
          if (!open) {
            setTokenData(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("printAgentTokenTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex min-w-0 items-start gap-2 rounded bg-muted p-3">
            <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all text-xs">
              {envText}
            </pre>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={t("printAgentCopyConfig")}
              title={t("printAgentCopyConfig")}
              onClick={() => void copyConfig()}
            >
              {copied ? <Check className="text-green-600" /> : <Copy />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(printerEdit)}
        onOpenChange={(open) => {
          if (!open) setPrinterEdit(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("printAgentEditPrinter")}</DialogTitle>
          </DialogHeader>
          {printerEdit && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("printAgentName")}</Label>
                <Input
                  value={printerEdit.data.name}
                  onChange={(event) =>
                    setPrinterEdit({
                      ...printerEdit,
                      data: { ...printerEdit.data, name: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("printAgentWindowsName")}</Label>
                <Input
                  value={printerEdit.data.windowsPrinterName}
                  onChange={(event) =>
                    setPrinterEdit({
                      ...printerEdit,
                      data: {
                        ...printerEdit.data,
                        windowsPrinterName: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("printAgentProfile")}</Label>
                <Select
                  value={printerEdit.data.profile}
                  onValueChange={(value) =>
                    setPrinterEdit({
                      ...printerEdit,
                      data: {
                        ...printerEdit.data,
                        profile: value as typeof printerEdit.data.profile,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kitchen-label-tspl">
                      {t("printAgentKitchenProfile")}
                    </SelectItem>
                    <SelectItem value="receipt-escpos">
                      {t("printAgentReceiptProfile")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("printAgentDpi")}</Label>
                <Input
                  type="number"
                  value={printerEdit.data.printerDpi}
                  onChange={(event) =>
                    setPrinterEdit({
                      ...printerEdit,
                      data: {
                        ...printerEdit.data,
                        printerDpi: Number(event.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{t("printAgentWidth")}</Label>
                <Input
                  type="number"
                  value={printerEdit.data.labelWidthMm}
                  onChange={(event) =>
                    setPrinterEdit({
                      ...printerEdit,
                      data: {
                        ...printerEdit.data,
                        labelWidthMm: Number(event.target.value),
                      },
                    })
                  }
                />
              </div>
              {printerEdit.data.profile !== "receipt-escpos" && (
                <>
                  <div className="space-y-1">
                    <Label>{t("printAgentHeight")}</Label>
                    <Input
                      type="number"
                      value={printerEdit.data.labelHeightMm}
                      onChange={(event) =>
                        setPrinterEdit({
                          ...printerEdit,
                          data: {
                            ...printerEdit.data,
                            labelHeightMm: Number(event.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("printAgentGap")}</Label>
                    <Input
                      type="number"
                      value={printerEdit.data.labelGapMm}
                      onChange={(event) =>
                        setPrinterEdit({
                          ...printerEdit,
                          data: {
                            ...printerEdit.data,
                            labelGapMm: Number(event.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
              {receiptCutFields(printerEdit.data, (data) =>
                setPrinterEdit({ ...printerEdit, data }),
              )}
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={
                    savePrinter.isPending ||
                    !printerEdit.data.name.trim() ||
                    !printerEdit.data.windowsPrinterName.trim()
                  }
                  onClick={() => savePrinter.mutate(printerEdit)}
                >
                  {t("printAgentSavePrinter")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {agents.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("printAgentCreateAgent")}</CardTitle>
            <CardDescription>
              {t("printAgentCreateDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-sm space-y-2">
              <Label>{t("printAgentAgentName")}</Label>
              <Input
                value={agentForm.name}
                placeholder={t("printAgentAgentNamePlaceholder")}
                onChange={(event) => setAgentForm({ name: event.target.value })}
              />
            </div>
            <Button
              disabled={createAgent.isPending || !agentForm.name.trim()}
              onClick={() => createAgent.mutate(agentForm)}
            >
              {t("printAgentCreateAgent")}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("printAgentRoutingTitle")}</CardTitle>
          <CardDescription>{t("printAgentRoutingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid items-end gap-3 md:grid-cols-4">
            {routeSelect(t("printAgentKitchenRoute"), "kitchenPrinterId")}
            {routeSelect(t("printAgentReceiptRoute"), "receiptPrinterId")}
            {routeSelect(t("printAgentFapiaoRoute"), "fapiaoPrinterId")}
            <Button
              className="h-8 w-fit"
              disabled={saveRouting.isPending}
              onClick={saveRoute}
            >
              {saveRouting.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("printAgentAgentSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("printAgentLoading")}
            </p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("printAgentEmpty")}
            </p>
          ) : (
            agents.map((agent) => {
              const form = formFor(agent._id);
              return (
                <div key={agent._id} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {agent.name} ·{" "}
                        {agent.active
                          ? t("printAgentEnabled")
                          : t("printAgentDisabled")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Agent ID: {agent.agentId} · {t("printAgentTokenLabel")}:{" "}
                        {agent.tokenPrefix}…
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCreatePrinterAgentId(agent._id);
                          setIsCreatePrinterOpen(true);
                        }}
                      >
                        {t("printAgentAddPrinter")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rotate.mutate(agent._id)}
                        disabled={rotate.isPending}
                      >
                        {t("printAgentRotateToken")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateAgent.mutate({
                            id: agent._id,
                            data: { active: !agent.active },
                          })
                        }
                      >
                        {agent.active
                          ? t("printAgentDisable")
                          : t("printAgentEnable")}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("printAgentName")}</Label>
                        <Input
                          className="h-9"
                          placeholder={t("printAgentNamePlaceholder")}
                          value={form.name}
                          onChange={(event) =>
                            setFormFor(agent._id, {
                              ...form,
                              name: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("printAgentWindowsName")}
                        </Label>
                        <Input
                          className="h-9"
                          placeholder={t("printAgentWindowsNamePlaceholder")}
                          value={form.windowsPrinterName}
                          onChange={(event) =>
                            setFormFor(agent._id, {
                              ...form,
                              windowsPrinterName: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("printAgentProfile")}
                        </Label>
                        <Select
                          value={form.profile}
                          onValueChange={(value) =>
                            setFormFor(agent._id, {
                              ...form,
                              profile: value as typeof form.profile,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kitchen-label-tspl">
                              {t("printAgentKitchenProfile")}
                            </SelectItem>
                            <SelectItem value="receipt-escpos">
                              {t("printAgentReceiptProfile")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="w-fit"
                          disabled={
                            create.isPending ||
                            !form.name.trim() ||
                            !form.windowsPrinterName.trim()
                          }
                          onClick={() => {
                            create.mutate({ agentId: agent._id, data: form });
                            setFormFor(agent._id, printerInitial);
                          }}
                        >
                          {t("printAgentAddPrinter")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("printAgentDpi")}</Label>
                        <Input
                          className="h-9"
                          type="number"
                          value={form.printerDpi}
                          onChange={(event) =>
                            setFormFor(agent._id, {
                              ...form,
                              printerDpi: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("printAgentWidth")}
                        </Label>
                        <Input
                          className="h-9"
                          type="number"
                          value={form.labelWidthMm}
                          onChange={(event) =>
                            setFormFor(agent._id, {
                              ...form,
                              labelWidthMm: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      {form.profile !== "receipt-escpos" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {t("printAgentHeight")}
                            </Label>
                            <Input
                              className="h-9"
                              type="number"
                              value={form.labelHeightMm}
                              onChange={(event) =>
                                setFormFor(agent._id, {
                                  ...form,
                                  labelHeightMm: Number(event.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {t("printAgentGap")}
                            </Label>
                            <Input
                              className="h-9"
                              type="number"
                              value={form.labelGapMm}
                              onChange={(event) =>
                                setFormFor(agent._id, {
                                  ...form,
                                  labelGapMm: Number(event.target.value),
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                      {receiptCutFields(form, (data) =>
                        setFormFor(agent._id, data),
                      )}
                    </div>
                  </div>
                  {agent.printers.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-medium">
                        {t("printAgentPrinters")} ({agent.printers.length})
                      </div>
                      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                        {agent.printers.map((printer: Printer) => (
                          <div
                            key={printer._id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {printer.name}
                              </span>{" "}
                              · {printer.windowsPrinterName} · {printer.profile}{" "}
                              ·{" "}
                              {printer.profile === "receipt-escpos"
                                ? `${printer.labelWidthMm}mm`
                                : `${printer.labelWidthMm}×${printer.labelHeightMm}mm`}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setPrinterEdit({
                                    agentId: agent._id,
                                    printerId: printer._id,
                                    data: {
                                      name: printer.name,
                                      windowsPrinterName:
                                        printer.windowsPrinterName,
                                      profile: printer.profile,
                                      printerDpi: printer.printerDpi,
                                      labelWidthMm: printer.labelWidthMm,
                                      labelHeightMm:
                                        printer.labelHeightMm ?? 40,
                                      labelGapMm: printer.labelGapMm ?? 2,
                                      cutEnabled: printer.cutEnabled === true,
                                      cutFeedHex: printer.cutFeedHex ?? "",
                                      cutCommandHex:
                                        printer.cutCommandHex ?? "",
                                    },
                                  })
                                }
                              >
                                {t("printAgentEditPrinter")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!printer.active || test.isPending}
                                onClick={() =>
                                  setTestDraft({
                                    agentId: agent._id,
                                    printerId: printer._id,
                                    text: defaultTestPrintText,
                                    fontSize: 40,
                                    bold: false,
                                    copies: 1,
                                  })
                                }
                              >
                                {t("printAgentTestPrint")}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  update.mutate({
                                    agentId: agent._id,
                                    printerId: printer._id,
                                    data: { active: !printer.active },
                                  })
                                }
                              >
                                {printer.active
                                  ? t("printAgentDisable")
                                  : t("printAgentEnable")}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
