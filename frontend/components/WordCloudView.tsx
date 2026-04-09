import type { WordCloudItem } from "@/lib/types";

interface WordCloudViewProps {
  words: WordCloudItem[];
}

export function WordCloudView({ words }: WordCloudViewProps) {
  if (!words.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        아직 표시할 키워드가 없습니다.
      </div>
    );
  }

  const maxValue = Math.max(...words.map((word) => word.value));

  return (
    <div className="flex min-h-44 flex-wrap items-center justify-center gap-3 rounded-3xl bg-slate-50 p-6">
      {words.map((word) => {
        const ratio = word.value / maxValue;
        const fontSize = 16 + ratio * 26;

        return (
          <span
            key={word.text}
            style={{ fontSize }}
            className="rounded-full bg-white px-4 py-2 font-semibold text-sky-700 shadow-sm"
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}
