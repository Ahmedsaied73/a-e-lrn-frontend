import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.privacy,
  description: `وثيقة سياسة الخصوصية وحماية البيانات لمنصة ${siteConfig.brandMark} - متوافقة مع قانون حماية البيانات الشخصية رقم 151 لسنة 2020`,
};

export default function PrivacyPage() {
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
            سياسة الخصوصية وحماية البيانات
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            معدة بما يتوافق مع أحكام <strong>قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020</strong>.
          </p>
        </header>

        <div className="mt-8 space-y-8 text-brand-text leading-relaxed text-sm sm:text-base">
          {/* مقدمة */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">مقدمة والتزام بالخصوصية</h2>
            <p className="mt-2 text-brand-muted leading-relaxed">
              تلتزم منصة <strong className="text-brand-text">{siteConfig.brandMark}</strong> بإدارة الأستاذ <strong className="text-brand-text">{siteConfig.teacherName}</strong> بحماية الخصوصية والبيانات الشخصية لجميع طلابنا. توضح هذه الوثيقة البيانات التي نجمعها وكيفية معالجتها وتأمينها.
            </p>
          </section>

          {/* أولاً: البيانات المجمعة */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">أولاً: البيانات التي نقوم بجمعها</h2>
            <div className="mt-3 space-y-3 text-brand-muted">
              <div>
                <strong className="text-brand-text">1. بيانات حساب الطالب:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، والصف الدراسي (أولى، ثانية، ثالثة ثانوي).
              </div>
              <div>
                <strong className="text-brand-text">2. بيانات المتابعة (ولي الأمر):</strong> رقم هاتف ولي الأمر لمشاركة تقارير الدرجات ونتائج الاختبارات والواجبات عند الحاجة.
              </div>
              <div>
                <strong className="text-brand-text">3. البيانات التقنية والتشغيلية:</strong> عنوان الـ IP، نوع المتصفح والجهاز، وسجلات تسجيل الدخول لمكافحة اختراق الحسابات وضمان أمن المنصة.
              </div>
              <div>
                <strong className="text-brand-text">4. السجل التعليمي:</strong> نسب مشاهدة المحاضرات، درجات الامتحانات والواجبات، والإجابات المقدمة.
              </div>
            </div>
          </section>

          {/* ثانياً: أمان المدفوعات والبطاقات البنكية */}
          <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">ثانياً: أمان المدفوعات وبوابات الدفع (Paymob & PCI-DSS)</h2>
            <p className="mt-2 text-brand-text">
              نحن <strong>لا نجمع ولا نخزن نهائياً</strong> أرقام البطاقات الائتمانية أو رمز الأمان (CVV) أو كلمات مرور المحافظ الإلكترونية على خوادمنا. تتم جميع المعاملات المالية بسلاسة وأمان عبر بوابة الدفع الإلكتروني المعتمدة من البنك المركزي المصري <strong>(Paymob)</strong> والخاضعة لأعلى معايير الأمان الدولية (PCI-DSS). نحتفظ فقط برقم مرجع العملية وتاريخها لتأكيد الاشتراك.
            </p>
          </section>

          {/* ثالثاً: بيانات المتابعة الأكاديمية */}
          <section className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-5">
            <h2 className="text-lg font-bold text-brand-primary">ثالثاً: بيانات المتابعة والتواصل الأكاديمي</h2>
            <p className="mt-2 text-brand-text">
              يُسجل رقم هاتف ولي الأمر كجهة اتصال للتواصل التعليمي وإرسال تقارير الأداء الأكاديمي ودرجات الاختبارات الدورية عند الحاجة. يحق للطالب أو ولي أمره مراجعة البيانات أو تحديثها في أي وقت.
            </p>
          </section>

          {/* رابعاً: التزام قاطع بعدم بيع أو مشاركة البيانات */}
          <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">رابعاً: التزام قاطع بعدم بيع أو تأجير البيانات</h2>
            <p className="mt-2 text-brand-text">
              تلتزم إدارة المنصة التزاماً مطلقاً بعدم بيع، أو تأجير، أو مشاركة أرقام هواتف الطلاب أو أرقام المتابعة مع أي شركات تسويق أو مراكز تعليمية أو جهات خارجية لأي غرض تجاري. تُستخدم البيانات حصرياً لتقديم الخدمة التعليمية للمنصة.
            </p>
          </section>

          {/* خامساً: حقوق أصحاب البيانات */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">خامساً: حقوقك في إدارة بياناتك</h2>
            <p className="mt-2 text-brand-muted">
              يحق لك طلب تعديل بياناتك المسجلة أو طلب حذف الحساب بعد انتهاء العام الدراسي والامتحانات، عبر التواصل مع فريق الدعم الفني بالمنصة.
            </p>
          </section>
        </div>

        <footer className="mt-10 border-t border-brand-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-muted">
          <p>© 2026 {siteConfig.brandMark} — منصة الأستاذ {siteConfig.teacherName}.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-brand-primary transition">شروط الاستخدام</Link>
            <Link href="/refund-policy" className="hover:text-brand-primary transition">سياسة الاسترداد</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
