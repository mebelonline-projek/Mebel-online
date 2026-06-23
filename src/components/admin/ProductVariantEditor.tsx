"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sortVariants, VARIANT_LABELS } from "@/lib/variant-utils";
import type { ProductVariant, VariantOption } from "@/types";

/* ── Konfigurasi statis 4 section ── */

const SECTIONS: Array<{
  type: ProductVariant["type"];
  title: string;
  showHex: boolean;
  placeholder: string;
}> = [
  { type: "color",    title: "Pilih Warna",         showHex: true,  placeholder: "Coklat" },
  { type: "size",     title: "Pilih Ukuran",        showHex: false, placeholder: "100×200" },
  { type: "material", title: "Pilih Bahan/Material", showHex: false, placeholder: "Kayu Jati" },
  { type: "text",     title: "Opsi Tambahan",        showHex: false, placeholder: "Custom" },
];

/* ── Props ── */

interface ProductVariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

/* ── Component ── */

export default function ProductVariantEditor({
  variants,
  onChange,
}: ProductVariantEditorProps) {
  const sorted = useMemo(() => sortVariants(variants), [variants]);

  /* ── UI-only local state ── */
  const [collapsed, setCollapsed] = useState<boolean[]>(
    SECTIONS.map(() => true)
  );
  const [addingOptionFor, setAddingOptionFor] = useState<number | null>(null);
  const [newOptLabel, setNewOptLabel] = useState("");
  const [newOptHex, setNewOptHex] = useState("");

  /* ── Edit option state ── */
  const [editingOption, setEditingOption] = useState<{
    type: ProductVariant["type"];
    idx: number;
    label: string;
    hex: string;
  } | null>(null);
  const editingInputRef = useRef<HTMLInputElement>(null);
  const editingHexInputRef = useRef<HTMLInputElement>(null);

  /* Opsi-opsi yang disimpan sementara saat toggle OFF, dikembalikan saat toggle ON */
  const savedOptionsRef = useRef<Map<string, VariantOption[]>>(new Map());

  /* ── Helper ── */

  const resetOptionForm = useCallback(() => {
    setAddingOptionFor(null);
    setNewOptLabel("");
    setNewOptHex("");
  }, []);

  /* ── Toggle section ON / OFF ── */

  const handleToggleSection = useCallback(
    (idx: number) => {
      const { type } = SECTIONS[idx];
      const isCurrentlyEnabled = sorted.some((g) => g.type === type);

      if (isCurrentlyEnabled) {
        // ── OFF: simpan options dulu, lalu hapus grup ──
        const group = sorted.find((g) => g.type === type);
        if (group) {
          savedOptionsRef.current.set(type, group.options);
        }
        onChange(variants.filter((g) => g.type !== type));
      } else {
        // ── ON: restore dari saved atau mulai kosong ──
        const restored = savedOptionsRef.current.get(type) ?? [];
        savedOptionsRef.current.delete(type);
        onChange([
          ...variants,
          { type, name: VARIANT_LABELS[type], options: restored },
        ]);
        // auto-expand section ini
        setCollapsed((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      }
    },
    [sorted, variants, onChange]
  );

  /* ── Tambah opsi ke section ── */

  const handleAddOption = useCallback(
    (idx: number) => {
      const label = newOptLabel.trim();
      if (!label) return;
      const value = label.toLowerCase().replace(/\s+/g, "-");
      const { type } = SECTIONS[idx];

      const opt: VariantOption = { label, value };
      if (type === "color" && /^#[0-9a-fA-F]{6}$/.test(newOptHex)) {
        opt.hex = newOptHex;
      }

      const updated = variants.map((g) => {
        if (g.type !== type) return g;
        const currentOptions = Array.isArray(g.options) ? g.options : [];
        return { ...g, options: [...currentOptions, opt] };
      });
      // Jika belum ada grup (seharusnya sudah, karena toggle ON), buat baru
      if (!updated.some((g) => g.type === type)) {
        updated.push({ type, name: VARIANT_LABELS[type], options: [opt] });
      }
      onChange(updated);
      resetOptionForm();
    },
    [newOptLabel, newOptHex, variants, onChange, resetOptionForm]
  );

  /* ── Hapus satu opsi ── */

  const handleRemoveOption = useCallback(
    (type: ProductVariant["type"], optIndex: number) => {
      const updated = variants
        .map((g) => {
          if (g.type !== type) return g;
          const currentOptions = Array.isArray(g.options) ? g.options : [];
          return {
            ...g,
            options: currentOptions.filter((_, i) => i !== optIndex),
          };
        })
        .filter((g) => {
          const opts = Array.isArray(g.options) ? g.options : [];
          return opts.length > 0;
        }); // hapus grup jika opsi habis
      onChange(updated);
    },
    [variants, onChange]
  );

  /* ── Hapus seluruh grup via tombol X ── */

  const handleRemoveGroup = useCallback(
    (type: ProductVariant["type"]) => {
      onChange(variants.filter((g) => g.type !== type));
    },
    [variants, onChange]
  );

  /* ── Edit opsi yang sudah ada ── */

  const handleStartEdit = useCallback(
    (type: ProductVariant["type"], idx: number, label: string, hex?: string) => {
      setEditingOption({ type, idx, label, hex: hex ?? "" });
      // Focus input setelah render
      requestAnimationFrame(() => editingInputRef.current?.focus());
    },
    []
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingOption) return;
    const { type, idx, label } = editingOption;
    const trimmed = label.trim();
    if (!trimmed) {
      setEditingOption(null);
      return;
    }

    const newValue = trimmed.toLowerCase().replace(/\s+/g, "-");

    onChange(
      variants.map((g) => {
        if (g.type !== type) return g;
        const currentOptions = Array.isArray(g.options) ? g.options : [];
        return {
          ...g,
          options: currentOptions.map((opt, oi) => {
            if (oi !== idx) return opt;
            const updated: VariantOption = { label: trimmed, value: newValue };
            // Update hex jika tipe color dan valid
            if (
              type === "color" &&
              editingOption.hex &&
              /^#[0-9a-fA-F]{6}$/.test(editingOption.hex)
            ) {
              updated.hex = editingOption.hex;
            } else {
              updated.hex = opt.hex; // pertahankan hex lama
            }
            return updated;
          }),
        };
      })
    );
    setEditingOption(null);
  }, [editingOption, variants, onChange]);

  /* ── Start add-option untuk section ── */

  const startAddOption = useCallback(
    (idx: number) => {
      setAddingOptionFor(idx);
      setNewOptLabel("");
      setNewOptHex(SECTIONS[idx].type === "color" ? "#" : "");
    },
    []
  );

  /* ── Toggle collapse/expand ── */

  const handleToggleCollapse = useCallback(
    (idx: number) => {
      // Jangan toggle kalau sedang menambah opsi di section ini
      if (addingOptionFor === idx) return;
      setCollapsed((prev) => {
        const next = [...prev];
        next[idx] = !next[idx];
        return next;
      });
    },
    [addingOptionFor]
  );

  /* ── Render satu section ── */

  const renderSection = useCallback(
    (section: (typeof SECTIONS)[number], idx: number) => {
      const group = sorted.find((g) => g.type === section.type);
      const enabled = !!group;
      const options = group?.options ?? [];
      const isCollapsed = collapsed[idx];
      const isAdding = addingOptionFor === idx;

      return (
        <div
          key={section.type}
          className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden"
        >
          {/* ── Header (seluruh area clickable untuk toggle collapse) ── */}
          <div
            className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none"
            onClick={() => handleToggleCollapse(idx)}
          >
            <div className="flex items-center gap-2">
              {/* Toggle switch — stopPropagation biar gak trigger collapse */}
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${enabled ? "Nonaktifkan" : "Aktifkan"} ${section.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSection(idx);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-maroon focus-visible:ring-offset-2 ${
                  enabled ? "bg-brand-maroon" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                    enabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {section.title}
              </span>
              {enabled && options.length > 0 && (
                <span className="text-[10px] text-gray-400 font-mono">
                  {options.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {enabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveGroup(section.type);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  aria-label={`Hapus ${section.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {/* Chevron — decoratif, toggle dari header di atas */}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  !isCollapsed ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {/* ── Body ── */}
          {!isCollapsed && (
            <div className="px-3 pb-3 space-y-3">
              {enabled ? (
                <>
                  {/* Option chips — bisa diedit */}
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((opt, oi) => {
                        const isEditing =
                          editingOption?.type === section.type &&
                          editingOption?.idx === oi;

                        if (isEditing) {
                          return (
                            <div
                              key={oi}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-300 text-xs"
                            >
                              {/* Color picker inline untuk type color */}
                              {section.type === "color" && (
                                <input
                                  ref={editingHexInputRef}
                                  type="color"
                                  value={
                                    editingOption.hex &&
                                    /^#[0-9a-fA-F]{6}$/.test(
                                      editingOption.hex
                                    )
                                      ? editingOption.hex
                                      : "#B31324"
                                  }
                                  onChange={(e) =>
                                    setEditingOption((prev) =>
                                      prev
                                        ? { ...prev, hex: e.target.value }
                                        : null
                                    )
                                  }
                                  className="h-6 w-6 rounded cursor-pointer border border-gray-300 shrink-0 p-0"
                                />
                              )}
                              <input
                                ref={editingInputRef}
                                value={editingOption?.label ?? ""}
                                onChange={(e) =>
                                  setEditingOption((prev) =>
                                    prev
                                      ? { ...prev, label: e.target.value }
                                      : null
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit();
                                  if (e.key === "Escape") {
                                    setEditingOption(null);
                                  }
                                }}
                                onBlur={handleSaveEdit}
                                className="min-w-[60px] max-w-[140px] bg-transparent border-none outline-none text-xs font-medium text-gray-900 p-0"
                              />
                            </div>
                          );
                        }

                        return (
                          <span
                            key={oi}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border text-xs cursor-pointer hover:border-gray-400 transition-colors group"
                          >
                            {section.type === "color" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(
                                    section.type,
                                    oi,
                                    opt.label,
                                    opt.hex
                                  );
                                }}
                                className="relative shrink-0"
                                aria-label={`Ubah warna ${opt.label}`}
                              >
                                <span
                                  className="h-3 w-3 rounded-full block"
                                  style={{
                                    backgroundColor: opt.hex ?? "#ccc",
                                  }}
                                />
                                <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(
                                  section.type,
                                  oi,
                                  opt.label,
                                  opt.hex
                                );
                              }}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {opt.label}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveOption(section.type, oi);
                              }}
                              className="text-gray-300 hover:text-red-500 ml-0.5 transition-colors"
                              aria-label={`Hapus ${opt.label}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Tambah opsi button */}
                  <button
                    type="button"
                    onClick={() => startAddOption(idx)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-dashed border-gray-300 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Tambah opsi{section.type === "color" ? " warna" : section.type === "size" ? " ukuran" : section.type === "material" ? " bahan" : ""}
                  </button>

                  {/* Inline form: tambah opsi */}
                  {isAdding && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">Label</Label>
                        <Input
                          value={newOptLabel}
                          onChange={(e) => setNewOptLabel(e.target.value)}
                          placeholder={section.placeholder}
                          className="h-9 text-sm mt-0.5 w-full"
                          autoFocus
                        />
                      </div>

                      {/* Color picker hanya untuk type color */}
                      {section.showHex && (
                        <div>
                          <Label className="text-xs text-gray-500">
                            Kode Warna
                          </Label>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="color"
                              value={
                                newOptHex && /^#[0-9a-fA-F]{6}$/.test(newOptHex)
                                  ? newOptHex
                                  : "#B31324"
                              }
                              onChange={(e) => setNewOptHex(e.target.value)}
                              className="h-9 w-9 rounded cursor-pointer border border-gray-300 shrink-0"
                            />
                            <Input
                              value={newOptHex}
                              onChange={(e) => setNewOptHex(e.target.value)}
                              placeholder="#B31324"
                              className="h-9 min-w-[100px] flex-1 text-sm font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Tombol aksi */}
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetOptionForm}
                          className="h-8 text-xs"
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!newOptLabel.trim()}
                          onClick={() => handleAddOption(idx)}
                          className="h-8 text-xs bg-brand-maroon hover:bg-brand-maroon-dark text-white"
                        >
                          Tambah
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {section.type === "text"
                    ? "Aktifkan untuk menambahkan opsi custom tambahan."
                    : `Aktifkan untuk menambahkan pilihan ${section.title.toLowerCase()}.`}
                </p>
              )}
            </div>
          )}
        </div>
      );
    },
    [
      sorted,
      collapsed,
      addingOptionFor,
      newOptLabel,
      newOptHex,
      editingOption,
      handleToggleSection,
      handleAddOption,
      handleRemoveOption,
      handleRemoveGroup,
      handleStartEdit,
      handleSaveEdit,
      startAddOption,
      resetOptionForm,
      handleToggleCollapse,
    ]
  );

  /* ── Render ── */

  return <div className="space-y-2">{SECTIONS.map((s, i) => renderSection(s, i))}</div>;
}