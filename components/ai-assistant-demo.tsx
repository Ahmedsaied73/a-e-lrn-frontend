'use client';

import { useEffect, useRef, useState } from 'react';

type Entry = { role: 'student' | 'assistant'; text: string };

const seed: Entry[] = [
  { role: 'student', text: 'ما الفرق بين التفاعل الطارد والماص للحرارة؟' },
  {
    role: 'assistant',
    text: 'الطارد يُحرّر طاقة للوسط المحيط فترتفع حرارته (مثل الاحتراق)، بينما الماص يمتص طاقة من الوسط فتنخفض حرارته (مثل ذوبان الثلج).',
  },
];

const suggestions = [
  'اشرح قانون حفظ الكتلة ببساطة',
  'ما الفرق بين الذرة والجزيء؟',
  'كيف أوازن معادلة كيميائية؟',
];

const knowledgeBase: { keys: string[]; answer: string }[] = [
  {
    keys: ['حفظ الكتلة'],
    answer: 'قانون حفظ الكتلة: كتلة المواد المتفاعلة تساوي كتلة النواتج — لا تفنى المادة ولا تُستحدث، فقط تتغير صورتها.',
  },
  {
    keys: ['ذرة', 'جزيء'],
    answer: 'الذرة أصغر وحدة تحتفظ بخواص العنصر، أما الجزيء فمجموعة ذرات مرتبطة كيميائيًا — قد تكون من عنصر واحد أو أكثر.',
  },
  {
    keys: ['وازن', 'موازنة'],
    answer: 'لموازنة معادلة: عدّل المعاملات (وليس الأدلة السفلية) حتى يتساوى عدد كل نوع ذرة في طرفي المعادلة، ابدأ بالعنصر الأكثر تعقيدًا.',
  },
];

function findAnswer(question: string): string {
  const match = knowledgeBase.find((k) => k.keys.some((key) => question.includes(key)));
  if (match) return match.answer;
  return 'سؤال جيد — هذا النوع من الأسئلة يُشرح بالتفصيل داخل دروس الوحدة المرتبطة به، مع أمثلة محلولة خطوة بخطوة.';
}

export function AiAssistantDemo() {
  const [log, setLog] = useState<Entry[]>(seed);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: 'smooth' });
  }, [log, thinking]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    setLog((l) => [...l, { role: 'student', text: q }]);
    setInput('');
    setThinking(true);
    window.setTimeout(() => {
      setLog((l) => [...l, { role: 'assistant', text: findAnswer(q) }]);
      setThinking(false);
    }, 500);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-brand-border bg-brand-surface px-3.5 py-1.5 text-xs font-medium text-brand-muted-strong transition hover:border-brand-primary/50 hover:text-brand-primary"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-4 flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface p-1.5 pe-1.5 ps-5 shadow-sm focus-within:border-brand-primary/50"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك في الكيمياء…"
          className="w-full bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted"
        />
        <button
          type="submit"
          aria-label="إرسال"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-primary text-white transition hover:bg-brand-primary/90"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="-scale-x-100" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      <div
        ref={consoleRef}
        className="mt-4 h-64 overflow-y-auto rounded-2xl bg-brand-ink p-5 text-start font-mono text-xs leading-relaxed sm:text-sm"
        dir="rtl"
      >
        {log.map((entry, i) => (
          <p key={i} className={'mb-3 ' + (entry.role === 'student' ? 'text-white' : 'text-brand-secondary')}>
            <span className="text-brand-muted">{entry.role === 'student' ? '>' : '◆'}</span> {entry.text}
          </p>
        ))}
        {thinking && <p className="text-brand-muted">◆ يكتب الآن…</p>}
      </div>
    </div>
  );
}
