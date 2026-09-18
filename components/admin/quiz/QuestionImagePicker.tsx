"use client";

interface QuestionImagePickerProps {
  imageUrl: string;
  imagePreview: string | null;
  imageUploading: boolean;
  imageError: string | null;
  optional?: boolean;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
}

/**
 * Shared device-upload picker for quiz question photos (admin decides per
 * question: MCQ, essay, or standalone display image). Upload itself is done
 * by the parent via POST /quizzes/images; this component is pure UI state.
 */
export default function QuestionImagePicker({
  imageUrl,
  imagePreview,
  imageUploading,
  imageError,
  optional = false,
  onSelect,
  onClear,
}: QuestionImagePickerProps) {
  return (
    <div className="text-sm font-semibold text-on-surface/80">
      {optional ? "صورة توضيحية (اختياري)" : "صورة السؤال"}
      <div className="mt-1">
        {(imageUrl || imagePreview) && (
          // eslint-disable-next-line @next/next/no-img-element -- imagePreview is a blob: object URL (URL.createObjectURL) pending upload; next/image cannot render blob sources
          <img
            src={imageUrl || imagePreview || ""}
            alt="معاينة صورة السؤال"
            className="mb-2 max-h-48 rounded-lg border border-outline-variant object-contain"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors duration-150 ${imageUploading ? "bg-outline cursor-wait" : "bg-primary-color hover:bg-[#0057c0]"}`}>
            {imageUrl ? "استبدال الصورة" : "اختيار صورة من الجهاز"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={imageUploading}
              onChange={(event) => {
                onSelect(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {(imageUrl || imageError) && (
            <button
              type="button"
              onClick={onClear}
              disabled={imageUploading}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors duration-150 hover:border-primary-color hover:text-[#0057c0] disabled:opacity-40"
            >
              إزالة
            </button>
          )}
        </div>
        {imageUploading && <p className="mt-1 text-xs font-semibold text-[#0057c0]">جاري رفع الصورة...</p>}
        {imageError && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{imageError}</p>}
      </div>
    </div>
  );
}
