"use client";

import { useCallback, useRef } from "react";

interface ImageUploaderProps {
  label: string;
  preview: string | null;
  onImageSelect: (dataUrl: string) => void;
  accentColor: string;
}

export default function ImageUploader({
  label,
  preview,
  onImageSelect,
  accentColor,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => onImageSelect(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => onImageSelect(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: accentColor }}
      >
        {label}
      </span>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] transition-all hover:border-white/25 hover:bg-white/[0.06]"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-white/30">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs">Drop or click</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
