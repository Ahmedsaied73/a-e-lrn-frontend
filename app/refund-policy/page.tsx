import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.refundPolicy,
  description: `وثيقة سياسة الدفع وعدم الاسترداد لمنصة ${siteConfig.brandMark} - متوافقة مع قانون حماية المستهلك المصري رقم 181 لسنة 2018`,
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-4xl rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm sm:p-10">
        <header className="border-b border-brand-border pb-6">
          <div className="flex items-center gap-2 text-sm text-brand-primary font-bold">
            <span>{siteConfig.brandMark}</span>
            <span>•</span>
            <span>{siteConfig.teacherName}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-text">
            سياسة الدفع والرسوم وعدم الاسترداد
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            معدة وفقاً لأحكام <strong>قانون حماية المستهلك المصري رقم 181 لسنة 2018 ولائحته التنفيذية</strong>.
          </p>
        </header>

        <div className="mt-8 space-y-8 text-brand-text leading-relaxed text-sm sm:text-base">
          {/* السند القانوني */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">السند القانوني لخدمات المحتوى الرقمي الفوري</h2>
            <p className="mt-2 text-brand-muted leading-relaxed">
              نظراً لأن منصة <strong className="text-brand-text">{siteConfig.brandMark}</strong> تقدم محتوى تعليمياً رقمياً متاحاً للاستهلاك والولوج الفوري بمجرد إتمام الدفع (محاضرات فيديو، واجبات، بنوك أسئلة، ومذكرات)، فإن الاشتراك يخضع لأحكام <strong className="text-brand-text">المادة (17) من اللائحة التنفيذية لقانون حماية المستهلك المصري رقم 181 لسنة 2018</strong>، والتي تستثني من حق المستهلك في العدول والاسترجاع (المدة العامة 14 يوماً) السلع والخدمات الرقمية التي بدأ تنفيذها واستهلاكها فور التعاقد بموافقة وإقرار المستهلك.
            </p>
          </section>

          {/* البند الأول: نهائية الشراء */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">أولاً: نهائية عمليات الشراء وعدم الاسترداد</h2>
            <div className="mt-2 space-y-2 text-brand-text">
              <p>
                <strong>جميع عمليات الشراء نهائية وقاطعة:</strong> لا يجوز استرداد أو استبدال أو استرجاع قيمة الكورسات أو الاشتراكات بعد إتمام الدفع وتفعيل الكورس في حساب الطالب.
              </p>
              <p>
                يقر الطالب وولي أمره قبل الدفع بسقوط حقهما في المطالبة بأي مبالغ مدفوعة بمجرد فتح الكورس، سواء لأسباب تغيير الرغبة، أو عدم ملاءمة الشرح (حيث يُتاح مسبقاً محتوى تمهيدي مجاني لمعاينة أسلوب التدريس)، أو ظروف انقطاع الإنترنت أو تغيير الجدول المدرسي.
              </p>
            </div>
          </section>

          {/* البند الثاني: الاستثناء التقني (الخصم المزدوج) */}
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">ثانياً: الاستثناء التقني الوحيد (الخصم المزدوج المكرر)</h2>
            <div className="mt-2 space-y-2 text-brand-text">
              <p>
                الحالة الوحيدة التي يُقبل فيها استرداد الأموال هي <strong>الخطأ التقني البنكي المكرر (Duplicate Payment)</strong>؛ أي قيام النظام بخصم قيمة الكورس ذاته مرتين في نفس اللحظة لنفس الحساب.
              </p>
              <p>
                <strong>إجراءات رد المبلغ المكرر:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-brand-muted">
                <li>إخطار الدعم الفني خلال 48 ساعة مع إرفاق لقطة شاشة لإيصال الخصم موضحاً بها رقم المرجع (Reference ID).</li>
                <li>يتم رد المبلغ المكرر حصرياً إلى نفس وسيلة الدفع الأصلية (نفس المحفظة أو البطاقة البنكية) خلال 5 إلى 14 يوم عمل.</li>
              </ul>
            </div>
          </section>

          {/* البند الثالث: الإلغاء الأمني */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">ثالثاً: إلغاء الحساب نتيجة المخالفات الأمنية</h2>
            <p className="mt-2 text-brand-muted">
              في حال إغلاق أو تعليق الحساب بسبب مخالفة شروط الاستخدام (مثل تصوير الشاشة، تفريغ الروابط، أو مشاركة الحساب مع طلاب آخرين)، يسقط تماماً أي حق في استرداد الرسوم أو المطالبة بأي تعويضات مالية.
            </p>
          </section>
        </div>

        <footer className="mt-10 border-t border-brand-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-muted">
          <p>© 2026 {siteConfig.brandMark} — منصة الأستاذ {siteConfig.teacherName}.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-brand-primary transition">شروط الاستخدام</Link>
            <Link href="/privacy" className="hover:text-brand-primary transition">سياسة الخصوصية</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
