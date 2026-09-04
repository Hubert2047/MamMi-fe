"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  type Item,
  type ItemInput,
  type LocalizedOption,
  type OptionGroup,
} from "@/api/item";
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItems,
  updateCatalogItem,
} from "@/api/catalog-item";
import { getCategories, type Category } from "@/api/category";
import { getAddons, type Addon } from "@/api/addon";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/auth";
import { useTablePageSize } from "@/hooks/use-table-page-size";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { uploadImage } from "@/lib/cloudinary";

const emptyForm: ItemInput = {
  type: "product",
  names: { vi: "", en: "", "zh-TW": "" },
  description: { vi: "", en: "", "zh-TW": "" },
  imageUrl: "",
  imagePublicId: "",
  recommended: false,
  popular: false,
  new: false,
  variants: [],
  optionGroups: [],
  price: { base: 0, uber: 0, foodpanda: 0 },
  categoryId: "",
  addons: [],
  addonConfigs: [],
  noteOptions: [],
  components: [],
};

type OptionInputs = { vi: string; en: string; "zh-TW": string };
const emptyOptionInputs: OptionInputs = { vi: "", en: "", "zh-TW": "" };
const splitOptions = (value: string) =>
  value.split(",").map((item) => item.trim());
const buildOptions = (
  inputs: OptionInputs,
  prefix: string,
): LocalizedOption[] => {
  const values = {
    vi: splitOptions(inputs.vi),
    en: splitOptions(inputs.en),
    "zh-TW": splitOptions(inputs["zh-TW"]),
  };
  const count = Math.max(
    values.vi.length,
    values.en.length,
    values["zh-TW"].length,
  );
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    names: {
      vi: values.vi[index] || "",
      en: values.en[index] || "",
      "zh-TW": values["zh-TW"][index] || "",
    },
  })).filter(
    (option) => option.names.vi || option.names.en || option.names["zh-TW"],
  );
};
const optionInputsFrom = (options: LocalizedOption[]): OptionInputs => ({
  vi: options.map((option) => option.names.vi).join(", "),
  en: options.map((option) => option.names.en).join(", "),
  "zh-TW": options.map((option) => option.names["zh-TW"]).join(", "),
});
type OptionGroupInput = {
  id: string;
  names: OptionInputs;
  options: OptionInputs;
  selection: "single" | "multiple";
  defaultOptionId: string;
};
const emptyGroup = (): OptionGroupInput => ({
  id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  names: { ...emptyOptionInputs },
  options: { ...emptyOptionInputs },
  selection: "single",
  defaultOptionId: "",
});
const groupInputsFrom = (groups: OptionGroup[] = []): OptionGroupInput[] =>
  groups.map((group) => ({
    id: group.id,
    names: optionInputsFrom([{ id: group.id, names: group.names }]),
    options: optionInputsFrom(group.options),
    selection: group.selection,
    defaultOptionId: group.options.some(
      (option) =>
        option.id ===
        (group as OptionGroup & { defaultOptionId?: string }).defaultOptionId,
    )
      ? (group as OptionGroup & { defaultOptionId?: string }).defaultOptionId ||
        ""
      : "",
  }));

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const { t, locale } = useI18n();
  const [form, setForm] = useState<ItemInput>(emptyForm);
  const [editing, setEditing] = useState<Item | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "create" | "update" | null
  >(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const { containerRef, pageSize } = useTablePageSize();
  const [variantInputs, setVariantInputs] =
    useState<OptionInputs>(emptyOptionInputs);
  const [noteOptionInputs, setNoteOptionInputs] =
    useState<OptionInputs>(emptyOptionInputs);
  const [optionGroupInputs, setOptionGroupInputs] = useState<
    OptionGroupInput[]
  >([]);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ["catalog-items", locale],
    queryFn: () => getCatalogItems(locale),
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const { data: addons = [] } = useQuery<Addon[]>({
    queryKey: ["addons", locale],
    queryFn: () => getAddons(locale),
  });
  const filteredItems = categoryFilter
    ? allItems.filter((item) =>
        typeof item.categoryId === "string"
          ? item.categoryId === categoryFilter
          : item.categoryId?._id === categoryFilter,
      )
    : allItems;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!isFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFormOpen]);

  const save = useMutation({
    mutationFn: (data: ItemInput) =>
      editing
        ? updateCatalogItem({ id: editing._id, data })
        : createCatalogItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      toast.success(editing ? t("updateSuccess") : t("createSuccess"));
      reset();
    },
    onError: () => toast.error(t("saveError")),
  });
  const remove = useMutation({
    mutationFn: deleteCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      toast.success(t("deleteSuccess"));
    },
    onError: () => toast.error(t("deleteError")),
  });

  if (!isSuperAdmin)
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminOnly")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("catalogSuperAdminHint")}
          </CardContent>
        </Card>
      </div>
    );

  function reset() {
    setForm(emptyForm);
    setEditing(null);
    setConfirmAction(null);
    setVariantInputs(emptyOptionInputs);
    setNoteOptionInputs(emptyOptionInputs);
    setOptionGroupInputs([]);
    setPendingImage(null);
    setIsFormOpen(false);
  }

  function closeForm() {
    setIsFormOpen(false);
    setConfirmAction(null);
  }

  function itemForm(item: Item): ItemInput {
    const categoryId =
      typeof item.categoryId === "string"
        ? item.categoryId
        : item.categoryId?._id || "";
    return {
      type: item.type || "product",
      names: item.names,
      description: item.description || { vi: "", en: "", "zh-TW": "" },
      imageUrl: item.imageUrl || "",
      imagePublicId: item.imagePublicId || "",
      recommended: item.recommended === true,
      popular: item.popular === true,
      new: item.new === true,
      categoryId,
      addons: item.addons.map((addon) => addon._id),
      addonConfigs: item.addons.map((addon) => ({
        addonId: addon._id,
        maxQuantity:
          addon.maxQuantity === null ? null : (addon.maxQuantity ?? 1),
      })),
      variants: item.variants || [],
      optionGroups: item.optionGroups || [],
      noteOptions: item.noteOptions || [],
      price: { base: 0, uber: 0, foodpanda: 0 },
      components: item.components || [],
    };
  }

  function edit(item: Item) {
    setIsFormOpen(true);
    setEditing(item);
    setForm(itemForm(item));
    setVariantInputs(optionInputsFrom(item.variants || []));
    setNoteOptionInputs(optionInputsFrom(item.noteOptions || []));
    setOptionGroupInputs(groupInputsFrom(item.optionGroups || []));
  }

  function copy(item: Item) {
    setIsFormOpen(true);
    setEditing(null);
    setForm(itemForm(item));
    setVariantInputs(optionInputsFrom(item.variants || []));
    setNoteOptionInputs(optionInputsFrom(item.noteOptions || []));
    setOptionGroupInputs(groupInputsFrom(item.optionGroups || []));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      (!form.names.vi.trim() &&
        !form.names.en.trim() &&
        !form.names["zh-TW"].trim()) ||
      !form.categoryId
    ) {
      return toast.error(t("validationProduct"));
    }
    setConfirmAction(editing ? "update" : "create");
  }

  async function confirmSave() {
    setIsUploadingImage(true);
    try {
      const uploadedImage = pendingImage
        ? await uploadImage(pendingImage)
        : null;
      const imageUrl = uploadedImage?.url || form.imageUrl;
      const imagePublicId = uploadedImage?.publicId || form.imagePublicId;
      const optionGroups = optionGroupInputs
        .map((group, index) => ({
          id: group.id || `group-${index + 1}`,
          names: {
            vi: group.names.vi.trim(),
            en: group.names.en.trim(),
            "zh-TW": group.names["zh-TW"].trim(),
          },
          selection: group.selection,
          required: false,
          defaultOptionId: group.defaultOptionId || undefined,
          options: buildOptions(group.options, `group-${index + 1}-option`),
        }))
        .filter(
          (group) => group.names.vi || group.names.en || group.names["zh-TW"],
        );
      save.mutate({
        ...form,
        imageUrl,
        imagePublicId,
        optionGroups,
        variants: buildOptions(variantInputs, "variant"),
        noteOptions: buildOptions(noteOptionInputs, "note"),
      });
      setConfirmAction(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `${t("imageUploadError")}: ${error.message}`
          : t("imageUploadError"),
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("products")}</h1>
        <Button
          onClick={() => {
            reset();
            setIsFormOpen(true);
          }}
        >
          {t("createProduct")}
        </Button>
      </div>
      <div>
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[92vh] !max-w-2xl flex-col overflow-hidden p-0"
          >
            <DialogTitle className="sr-only">
              {editing ? t("editProduct") : t("createProduct")}
            </DialogTitle>
            <CardHeader className="sticky top-0 z-10 shrink-0 border-b bg-card py-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>
                  {editing ? t("editProduct") : t("createProduct")}
                </CardTitle>
                <div className="flex shrink-0 gap-2">
                  <Button
                    className="min-w-24"
                    type="submit"
                    form="product-form"
                    size="sm"
                    disabled={save.isPending}
                  >
                    {save.isPending
                      ? t("saving")
                      : editing
                        ? t("update")
                        : t("createProduct")}
                  </Button>
                  <Button
                    className="min-w-20"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeForm}
                    disabled={save.isPending}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 overflow-y-auto">
              <form id="product-form" onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("productName")} (VI)</Label>
                  <Input
                    value={form.names.vi}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        names: { ...form.names, vi: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("productName")} (EN)</Label>
                  <Input
                    value={form.names.en}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        names: { ...form.names, en: event.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("productName")} (繁中)</Label>
                  <Input
                    value={form.names["zh-TW"]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        names: { ...form.names, "zh-TW": event.target.value },
                      })
                    }
                  />
                </div>
                <ImageUploadField
                  label={t("productImage")}
                  hint={t("imageUploadHint")}
                  chooseLabel={t("chooseImage")}
                  removeLabel={t("removeImage")}
                  value={form.imageUrl}
                  pendingFile={pendingImage}
                  onChange={(imageUrl) =>
                    setForm({
                      ...form,
                      imageUrl,
                      imagePublicId: imageUrl ? form.imagePublicId : "",
                    })
                  }
                  onFileChange={setPendingImage}
                  onError={() => toast.error(t("imageUploadError"))}
                />
                <div className="space-y-2">
                  <Label>{t("categories")}</Label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({ ...form, categoryId: event.target.value })
                    }
                  >
                    <option value="">{t("chooseCategory")}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.names[locale] ||
                          category.names.vi ||
                          category.names.en ||
                          category.names["zh-TW"]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("productType")}</Label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    value={form.type || "product"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value as ItemInput["type"],
                        components:
                          event.target.value === "combo"
                            ? form.components || []
                            : [],
                      })
                    }
                  >
                    <option value="product">{t("regularProduct")}</option>
                    <option value="combo">{t("comboProduct")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.recommended === true}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, recommended: checked === true })
                      }
                    />
                    {t("recommended")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.popular === true}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, popular: checked === true })
                      }
                    />
                    {t("popular")}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.new === true}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, new: checked === true })
                      }
                    />
                    {t("newProduct")}
                  </label>
                </div>
                {form.type === "combo" && (
                  <div className="space-y-2">
                    <Label>{t("comboComponents")}</Label>
                    <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                      {allItems
                        .filter((item) => item._id !== editing?._id)
                        .map((item) => {
                          const selected = (form.components || []).some(
                            (component) => component.itemId === item._id,
                          );
                          return (
                            <label
                              key={item._id}
                              className="flex min-w-0 items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) =>
                                  setForm({
                                    ...form,
                                    components: checked
                                      ? [
                                          ...(form.components || []),
                                          { itemId: item._id, quantity: 1 },
                                        ]
                                      : (form.components || []).filter(
                                          (component) =>
                                            component.itemId !== item._id,
                                        ),
                                  })
                                }
                              />
                              <span className="truncate">{item.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>
                    {t("variants")}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("commaSeparated")}
                    </span>
                  </Label>
                  <Input
                    value={variantInputs.vi}
                    onChange={(event) =>
                      setVariantInputs({
                        ...variantInputs,
                        vi: event.target.value,
                      })
                    }
                    placeholder={`${t("variantPlaceholder")} (VI)`}
                  />
                  <Input
                    value={variantInputs.en}
                    onChange={(event) =>
                      setVariantInputs({
                        ...variantInputs,
                        en: event.target.value,
                      })
                    }
                    placeholder={`${t("variantPlaceholder")} (EN)`}
                  />
                  <Input
                    value={variantInputs["zh-TW"]}
                    onChange={(event) =>
                      setVariantInputs({
                        ...variantInputs,
                        "zh-TW": event.target.value,
                      })
                    }
                    placeholder={`${t("variantPlaceholder")} (繁中)`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    {t("notes")}{" "}
                    <span className="font-normal text-muted-foreground">
                      {t("commaSeparated")}
                    </span>
                  </Label>
                  <Input
                    value={noteOptionInputs.vi}
                    onChange={(event) =>
                      setNoteOptionInputs({
                        ...noteOptionInputs,
                        vi: event.target.value,
                      })
                    }
                    placeholder={`${t("notePlaceholder")} (VI)`}
                  />
                  <Input
                    value={noteOptionInputs.en}
                    onChange={(event) =>
                      setNoteOptionInputs({
                        ...noteOptionInputs,
                        en: event.target.value,
                      })
                    }
                    placeholder={`${t("notePlaceholder")} (EN)`}
                  />
                  <Input
                    value={noteOptionInputs["zh-TW"]}
                    onChange={(event) =>
                      setNoteOptionInputs({
                        ...noteOptionInputs,
                        "zh-TW": event.target.value,
                      })
                    }
                    placeholder={`${t("notePlaceholder")} (繁中)`}
                  />
                </div>
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("optionGroups")}</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setOptionGroupInputs((groups) => [
                          ...groups,
                          emptyGroup(),
                        ])
                      }
                    >
                      {t("addOptionGroup")}
                    </Button>
                  </div>
                  {optionGroupInputs.map((group, index) => (
                    <div
                      key={group.id}
                      className="space-y-2 rounded border p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {t("optionGroups")} {index + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setOptionGroupInputs((groups) =>
                              groups.filter(
                                (_, groupIndex) => groupIndex !== index,
                              ),
                            )
                          }
                        >
                          {t("removeOptionGroup")}
                        </Button>
                      </div>
                      <Input
                        value={group.names.vi}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    names: {
                                      ...entry.names,
                                      vi: event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupName")} (VI)`}
                      />
                      <Input
                        value={group.names.en}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    names: {
                                      ...entry.names,
                                      en: event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupName")} (EN)`}
                      />
                      <Input
                        value={group.names["zh-TW"]}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    names: {
                                      ...entry.names,
                                      "zh-TW": event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupName")} (繁中)`}
                      />
                      <Input
                        value={group.options.vi}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    options: {
                                      ...entry.options,
                                      vi: event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupOptions")} (VI)`}
                      />
                      <Input
                        value={group.options.en}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    options: {
                                      ...entry.options,
                                      en: event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupOptions")} (EN)`}
                      />
                      <Input
                        value={group.options["zh-TW"]}
                        onChange={(event) =>
                          setOptionGroupInputs((groups) =>
                            groups.map((entry, groupIndex) =>
                              groupIndex === index
                                ? {
                                    ...entry,
                                    options: {
                                      ...entry.options,
                                      "zh-TW": event.target.value,
                                    },
                                  }
                                : entry,
                            ),
                          )
                        }
                        placeholder={`${t("optionGroupOptions")} (繁中)`}
                      />
                      <div className="flex gap-2">
                        <select
                          className="h-8 rounded border px-2 text-sm"
                          value={group.selection}
                          onChange={(event) =>
                            setOptionGroupInputs((groups) =>
                              groups.map((entry, groupIndex) =>
                                groupIndex === index
                                  ? {
                                      ...entry,
                                      selection: event.target.value as
                                        "single" | "multiple",
                                    }
                                  : entry,
                              ),
                            )
                          }
                        >
                          <option value="single">
                            {t("optionGroupSingle")}
                          </option>
                          <option value="multiple">
                            {t("optionGroupMultiple")}
                          </option>
                        </select>
                        <select
                          className="h-8 min-w-32 rounded border px-2 text-sm"
                          value={group.defaultOptionId}
                          onChange={(event) =>
                            setOptionGroupInputs((groups) =>
                              groups.map((entry, groupIndex) =>
                                groupIndex === index
                                  ? {
                                      ...entry,
                                      defaultOptionId: event.target.value,
                                    }
                                  : entry,
                              ),
                            )
                          }
                        >
                          <option value="">{t("optionGroupDefault")}</option>
                          {buildOptions(
                            group.options,
                            `group-${index + 1}-option`,
                          ).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.names[locale] ||
                                option.names.vi ||
                                option.names.en ||
                                option.names["zh-TW"]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                {form.type !== "combo" && (
                  <div className="space-y-2">
                    <Label>{t("addons")}</Label>
                    <div className="space-y-2 rounded-lg border p-3">
                      {addons.map((addon) => {
                        const selected = form.addons.includes(addon._id);
                        const config = form.addonConfigs.find(
                          (entry) => entry.addonId === addon._id,
                        );
                        const maxQuantity =
                          config?.maxQuantity === null
                            ? null
                            : (config?.maxQuantity ?? 1);
                        const updateConfig = (nextMaxQuantity: number | null) =>
                          setForm({
                            ...form,
                            addonConfigs: form.addonConfigs.map((entry) =>
                              entry.addonId === addon._id
                                ? { ...entry, maxQuantity: nextMaxQuantity }
                                : entry,
                            ),
                          });
                        return (
                          <div
                            key={addon._id}
                            className="flex flex-wrap items-center gap-3 rounded border px-3 py-2"
                          >
                            <label className="flex min-w-44 flex-1 items-center gap-2 text-sm">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) =>
                                  setForm({
                                    ...form,
                                    addons: checked
                                      ? [...form.addons, addon._id]
                                      : form.addons.filter(
                                          (id) => id !== addon._id,
                                        ),
                                    addonConfigs: checked
                                      ? [
                                          ...form.addonConfigs.filter(
                                            (entry) =>
                                              entry.addonId !== addon._id,
                                          ),
                                          {
                                            addonId: addon._id,
                                            maxQuantity: 1,
                                          },
                                        ]
                                      : form.addonConfigs.filter(
                                          (entry) =>
                                            entry.addonId !== addon._id,
                                        ),
                                  })
                                }
                              />
                              <span className="truncate">
                                {addon.names[locale] ||
                                  addon.names.vi ||
                                  addon.names.en ||
                                  addon.names["zh-TW"]}
                              </span>
                            </label>
                            {selected && (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={maxQuantity === null}
                                    onCheckedChange={(checked) =>
                                      updateConfig(checked === true ? null : 1)
                                    }
                                  />
                                  {t("addonUnlimited")}
                                </label>
                                <Label className="text-sm">
                                  {t("addonMaxQuantity")}
                                </Label>
                                <Input
                                  className="h-8 w-20"
                                  type="number"
                                  min={1}
                                  disabled={maxQuantity === null}
                                  placeholder={
                                    maxQuantity === null ? "∞" : undefined
                                  }
                                  value={maxQuantity ?? ""}
                                  onChange={(event) =>
                                    updateConfig(
                                      Math.max(
                                        1,
                                        Math.floor(
                                          Number(event.target.value) || 1,
                                        ),
                                      ),
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t("description")} (VI)</Label>
                  <Textarea
                    className="min-h-12 resize-none"
                    placeholder={t("descriptionPlaceholder")}
                    value={form.description.vi}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: {
                          ...form.description,
                          vi: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("description")} (EN)</Label>
                  <Textarea
                    className="min-h-12 resize-none"
                    placeholder={t("descriptionPlaceholder")}
                    value={form.description.en}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: {
                          ...form.description,
                          en: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("description")} (繁中)</Label>
                  <Textarea
                    className="min-h-12 resize-none"
                    placeholder={t("descriptionPlaceholder")}
                    value={form.description["zh-TW"]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: {
                          ...form.description,
                          "zh-TW": event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </form>
            </CardContent>
          </DialogContent>
        </Dialog>
        <Card
          ref={containerRef}
          className={`flex h-[calc(100svh-180px)] min-h-0 flex-col overflow-hidden [&>div:last-child]:flex-1 [&>div:last-child]:min-h-0 [&>div:last-child]:overflow-hidden [&>div:last-child>div]:h-full [&>div:last-child>div]:!max-h-none ${isFormOpen ? "hidden" : ""}`}
        >
          <CardHeader className="shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t("productList")}</CardTitle>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <span className="mr-2 text-xs text-muted-foreground">
                  {t("productTotal")}: {filteredItems.length}
                </span>
                <select
                  aria-label={t("categories")}
                  className="h-8 max-w-40 rounded-md border bg-background px-2 text-xs"
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t("allCategories")}</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.names[locale] ||
                        category.names.vi ||
                        category.names.en ||
                        category.names["zh-TW"]}
                    </option>
                  ))}
                </select>
                <span className="ml-1 text-xs text-muted-foreground">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  ‹
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="max-h-[calc(100svh-220px)] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 py-1 text-xs">
                      {t("name")}
                    </TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs">
                      {t("categories")}
                    </TableHead>
                    <TableHead className="h-8 px-2 py-1 text-right text-xs">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell className="px-2 py-1 text-xs" colSpan={3}>
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="px-2 py-1 text-xs font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {item.categoryName || "—"}
                        </TableCell>
                        <TableCell className="space-x-1 px-2 py-1 text-right">
                          <Button
                            className="min-w-20"
                            size="sm"
                            variant="outline"
                            onClick={() => edit(item)}
                          >
                            {t("edit")}
                          </Button>
                          <Button
                            className="min-w-20"
                            size="sm"
                            variant="outline"
                            onClick={() => copy(item)}
                          >
                            {t("copy")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="min-w-20"
                                size="sm"
                                variant="destructive"
                              >
                                {t("delete")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("confirmDeleteTitle")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("confirmDeleteProduct")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="min-w-20">
                                  {t("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="min-w-20"
                                  variant="destructive"
                                  onClick={() => remove.mutate(item._id)}
                                >
                                  {t("confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                confirmAction === "update"
                  ? "confirmUpdateProduct"
                  : "confirmCreateProduct",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-w-20">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-w-20"
              disabled={isUploadingImage || save.isPending}
              onClick={confirmSave}
            >
              {isUploadingImage ? t("uploadingImage") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
