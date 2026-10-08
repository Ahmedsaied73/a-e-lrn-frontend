import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.privacy,
  description: `سياسة الخصوصية وحماية البيانات - منصة ${siteConfig.brandMark}`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-brand-text leading-relaxed text-base" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">سياسة الخصوصية وحماية البيانات</h1>
      <p className="text-sm text-brand-muted mb-8">
        منصة {siteConfig.brandMark} — الأستاذ {siteConfig.teacherName} (آخر تحديث: أكتوبر 2026)
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">مقدمة</h2>
          <p>
            تلتزم إدارة منصة {siteConfig.brandMark} بحماية الخصوصية والبيانات الشخصية لجميع طلابنا. توضح هذه الوثيقة البيانات التي نجمعها وكيفية معالجتها وتأمينها.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">1. البيانات التي نقوم بجمعها</h2>
          <ul className="list-disc list-inside space-y-1.5 text-brand-muted">
            <li><strong className="text-brand-text">بيانات الحساب:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، والصف الدراسي.</li>
            <li><strong className="text-brand-text">بيانات المتابعة (ولي الأمر):</strong> رقم هاتف ولي الأمر لمشاركة تقارير الدرجات ونتائج الاختبارات والواجبات عند الحاجة.</li>
            <li><strong className="text-brand-text">البيانات التقنية:</strong> عنوان الـ IP، نوع المتصفح والجهاز، وسجلات الدخول لضمان أمان الحسابات.</li>
            <li><strong className="text-brand-text">السجل التعليمي:</strong> نسب مشاهدة المحاضرات، درجات الاختبارات، والواجبات.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. أمان المدفوعات والبطاقات البنكية</h2>
          <p>
            نحن لا نجمع ولا نخزن نهائياً أرقام البطاقات الائتمانية أو كلمات مرور المحافظ الإلكترونية على خوادمنا. تتم جميع المعاملات المالية بأمان عبر بوابة الدفع الإلكتروني المعتمدة (Paymob). نحتفظ فقط برقم مرجع العملية وتاريخها لتأكيد الاشتراك.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. بيانات التواصل الأكاديمي</h2>
          <p>
            يُسجل رقم هاتف ولي الأمر كجهة اتصال للتواصل التعليمي وإرسال تقارير الأداء الأكاديمي ودرجات الاختبارات الدورية عند الحاجة. يحق للطالب أو ولي أمره مراجعة البيانات أو تحديثها في أي وقت.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. عدم بيع أو مشاركة البيانات</h2>
          <p>
            تلتزم إدارة المنصة التزاماً مطلقاً بعدم بيع، أو تأجير، أو مشاركة أرقام هواتف الطلاب أو أرقام المتابعة مع أي شركات تسويق أو جهات خارجية. تُستخدم البيانات حصرياً لتقديم الخدمة التعليمية للمنصة.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. إدارة بياناتك</h2>
          <p>
            يحق لك طلب تعديل بياناتك المسجلة أو طلب حذف الحساب بعد انتهاء العام الدراسي، عبر التواصل مع فريق الدعم الفني بالمنصة.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-brand-border text-sm text-brand-muted flex gap-4">
        <Link href="/terms" className="hover:underline">شروط الاستخدام</Link>
        <span>•</span>
        <Link href="/refund-policy" className="hover:underline">سياسة الاسترداد</Link>
      </div>
    </div>
  );
}
