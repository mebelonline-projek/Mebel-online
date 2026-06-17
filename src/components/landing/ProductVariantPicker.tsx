"use client";

import { motion } from "framer-motion";
import type { ProductVariant } from "@/types";

interface ProductVariantPickerProps {
  variants: ProductVariant[];
  selected: Record<string, string>;
  onChange: (groupName: string, value: string) => void;
}

export default function ProductVariantPicker({
  variants,
  selected,
  onChange,
}: ProductVariantPickerProps) {
  if (!variants.length) return null;

  return (
    <div className="space-y-3 mt-3 mb-4">
      {variants.map((group) => (
        <div key={group.name}>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {group.name}
          </label>

          {group.type === "color" ? (
            /* ── Color swatches (circles) ── */
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isSelected = selected[group.name] === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(group.name, opt.value)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                    aria-label={`${group.name}: ${opt.label}`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full transition-all duration-200 ${
                        isSelected
                          ? "ring-2 ring-brand-maroon ring-offset-2"
                          : "ring-1 ring-gray-200 hover:ring-gray-400"
                      }`}
                      style={{
                        backgroundColor: opt.hex || "#ddd",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
                      }}
                    />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* ── Size / Material / Text pills ── */
            <div className="flex flex-wrap gap-1.5">
              {group.options.map((opt) => {
                const isSelected = selected[group.name] === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(group.name, opt.value)}
                    whileTap={{ scale: 0.94 }}
                    className={`px-3 h-7 rounded-md text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-brand-maroon text-white shadow-sm shadow-brand-maroon/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    aria-label={`${group.name}: ${opt.label}`}
                  >
                    {opt.label}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
