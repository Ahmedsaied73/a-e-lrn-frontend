import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.refundPolicy,
  description: `سياسة الدفع والاسترداد - منصة ${siteConfig.brandMark}`,
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-brand-text leading-relaxed text-base" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">سياسة الدفع والرسوم وعدم الاسترداد</h1>
      <p className="text-sm text-brand-muted mb-8">
        منصة {siteConfig.brandMark} — الأستاذ {siteConfig.teacherName} (آخر تحديث: أكتوبر 2026)
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">طبيعة المحتوى الرقمي الفوري</h2>
          <p>
            نظراً لأن منصة {siteConfig.brandMark} تقدم محتوى تعليمياً رقمياً متاحاً للاستخدام والمشاهدة الفورية بمجرد إتمام الدفع (محاضرات فيديو، واجبات، بنوك أسئلة، ومذكرات)، فإن الاشتراك يخضع لقواعد تسليم المنتجات الرقمية الفورية عبر الإنترنت.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">1. نهائية عمليات الشراء وعدم الاسترداد</h2>
          <p className="mb-2">
            جميع عمليات الشراء نهائية وقاطعة؛ لا يجوز استرداد أو استرجاع قيمة الكورسات أو الاشتراكات بعد إتمام الدفع وتفعيل الكورس في حساب الطالب.
          </p>
          <p>
            يُتاح مسبقاً محتوى تمهيدي مجاني لمعاينة أسلوب التدريس والتأكد من ملاءمة الشرح للطالب قبل إتمام الدفع.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. الاستثناء التقني (الخصم المزدوج)</h2>
          <p className="mb-2">
            الحالة الوحيدة التي يُقبل فيها استرداد الأموال هي الخطأ التقني البنكي المكرر؛ أي قيام النظام بخصم قيمة الكورس ذاته مرتين في نفس اللحظة لنفس الحساب.
          </p>
          <p className="mb-1">
            <strong>إجراءات رد المبلغ المكرر:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-brand-muted">
            <li>إخطار الدعم الفني خلال 48 ساعة مع إرفاق لقطة شاشة لإيصال الخصم يظهر بها رقم المرجع.</li>
            <li>يتم رد المبلغ المكرر إلى نفس وسيلة الدفع الأصلية (نفس المحفظة أو البطاقة البنكية) خلال 5 إلى 14 يوم عمل.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. إلغاء الحساب نتيجة المخالفات</h2>
          <p>
            في حال إغلاق أو تعليق الحساب بسبب مخالفة شروط الاستخدام (مثل تصوير الشاشة، تفريغ الروابط، أو مشاركة الحساب مع طلاب آخرين)، يسقط تماماً أي حق في استرداد الرسوم أو المطالبة بأي تعويضات مالية.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-brand-border text-sm text-brand-muted flex gap-4">
        <Link href="/terms" className="hover:underline">شروط الاستخدام</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link>
      </div>
    </div>
  );
}
