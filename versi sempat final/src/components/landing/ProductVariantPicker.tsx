"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ProductVariant } from "@/types";
import { sortVariants } from "@/lib/variant-utils";

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
  const sortedVariants = sortVariants(variants);
  if (!sortedVariants.length) return null;

  return (
    <div className="space-y-3 mt-3 mb-4">
      {sortedVariants.map((group) => (
        <div key={group.name}>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            {group.name}
          </label>

          {group.type === "color" ? (
            /* ── Color swatches (circles with check on selected) ── */
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
                    className={`relative h-7 w-7 rounded-full transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-brand-maroon ring-offset-1 scale-110"
                        : "ring-1 ring-gray-300 hover:ring-gray-400"
                    }`}
                    style={{ backgroundColor: opt.hex || "#ddd" }}
                    aria-label={`${group.name}: ${opt.label}`}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className={`h-4 w-4 ${opt.hex && isLightColor(opt.hex) ? "text-gray-800" : "text-white"}`} strokeWidth={3} />
                      </span>
                    )}
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

/**
 * Helper untuk menentukan apakah warna terang (butuh icon gelap) atau gelap (butuh icon putih)
 */
function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16) || 0;
  const g = parseInt(color.substring(2, 4), 16) || 0;
  const b = parseInt(color.substring(4, 6), 16) || 0;
  // Relative luminance approximation
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
