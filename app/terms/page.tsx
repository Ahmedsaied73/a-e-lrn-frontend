import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.terms,
  description: `وثيقة شروط وأحكام الاستخدام الرسمية لمنصة ${siteConfig.brandMark} التعليمية - ${siteConfig.teacherName}`,
};

export default function TermsPage() {
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
            شروط وأحكام الاستخدام
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            تاريخ آخر تحديث: أكتوبر 2026 — القواعد والضوابط المنظمة للاستخدام والاشتراك في منصة {siteConfig.brandMark}.
          </p>
        </header>

        <div className="mt-8 space-y-8 text-brand-text leading-relaxed text-sm sm:text-base">
          {/* التمهيد */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">تمهيد</h2>
            <p className="mt-2 text-brand-muted leading-relaxed">
              مرحباً بكم في منصة <strong className="text-brand-text">{siteConfig.brandMark}</strong> التعليمية التابعة للأستاذ <strong className="text-brand-text">{siteConfig.teacherName}</strong>.
              تسجيلك للحساب أو اشتراكك في الكورسات والاختبارات يعد موافقة على شروط الاستخدام الموضحة أدناه لضمان تجربة تعليمية منظمة وعادلة لجميع الطلاب.
            </p>
          </section>

          {/* المادة 1: حساب الطالب وبيانات ولي الأمر */}
          <section className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-5">
            <h2 className="text-lg font-bold text-brand-primary">المادة (1): تسجيل الحساب والاشتراك وبيانات ولي الأمر</h2>
            <div className="mt-3 space-y-2 text-brand-text">
              <p>
                يمكن للطالب التسجيل والاشتراك وسداد الرسوم مباشرة وبكل سهولة عبر وسائل الدفع المتاحة على المنصة.
              </p>
              <p>
                يُطلب تسجيل رقم هاتف ولي الأمر للتواصل وإرسال التقارير الدورية حول المستوى الأكاديمي ودرجات الاختبارات والواجبات عند الحاجة لذلك.
              </p>
            </div>
          </section>

          {/* المادة 2: طبيعة الحساب والترخيص الشخصي */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">المادة (2): الترخيص التعليمي وصلاحية المحتوى</h2>
            <p className="mt-2 text-brand-muted">
              الاشتراك في أي كورس يمنح الطالب ترخيصاً شخصياً لمشاهدة المحاضرات وحل الاختبارات والمتابعة الدراسية خلال العام الدراسي المحدد.
              المحتوى مخصص للتعلم الذاتي ولا يمنح الطالب حق إعادة توزيعه أو نشره.
            </p>
          </section>

          {/* المادة 3: الأجهزة المسموح بها وحظر مشاركة الحسابات */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h2 className="text-lg font-bold text-amber-700 dark:text-amber-400">المادة (3): الأجهزة المسموح بها وحظر مشاركة الحسابات</h2>
            <div className="mt-2 space-y-2 text-brand-text">
              <p>
                <strong>حد الأجهزة المسموح بها:</strong> يُسمح للطالب بفتح حسابه من خلال ما يصل إلى <strong>3 أجهزة شخصية كحد أقصى</strong> (مثل: الهاتف المحمول، التابلت، وجهاز الكمبيوتر الشخصي).
              </p>
              <p>
                <strong>حساب شخصي لطالب واحد:</strong> الحساب مخصص لاستخدام نفس الطالب حصرياً. يُحظر تماماً مشاركة بيانات تسجيل الدخول مع أي طالب آخر أو بيع الحساب أو استخدامه بشكل جماعي. في حال ثبوت مشاركة الحساب مع أطراف أخرى، يحق لإدارة المنصة تعليق الحساب دون استرداد الرسوم.
              </p>
            </div>
          </section>

          {/* المادة 4: حماية المحتوى والملكية الفكرية */}
          <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">المادة (4): حماية المحتوى والملكية الفكرية</h2>
            <div className="mt-2 space-y-2 text-brand-text">
              <p>
                كافة مقاطع الفيديو، الشروحات، وبنوك الأسئلة والامتحانات هي ملكية تعليمية خاصة بالأستاذ {siteConfig.teacherName} ومحمية بحقوق الملكية الفكرية.
              </p>
              <p>
                <strong>العلامة المائية الرقمية:</strong> يعرض مشغل الفيديو علامة مائية تتضمن بيانات حساب الطالب ورقم هاتفه بشكل دوري أثناء التشغيل لحماية المحتوى ومتابعة جودة البث.
              </p>
              <p className="text-brand-muted">
                يُمنع تصوير الشاشة أو تفريغ الروابط أو إعادة رفع المحتوى على منصات خارجية (مثل تليجرام أو فيسبوك). ارتكاب أي من هذه المخالفات يؤدي إلى إلغاء تفعيل الكورسات وحظر الحساب فوراً من المنصة دون استرداد للاشتراك.
              </p>
            </div>
          </section>

          {/* المادة 5: الدفع وعدم الاسترداد */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">المادة (5): سياسة الدفع والاسترداد</h2>
            <p className="mt-2 text-brand-muted">
              تتم المدفوعات بالجنيه المصري عبر بوابة الدفع الإلكتروني المعتمدة. جميع عمليات الشراء نهائية بمجرد تفعيل الكورس وإتاحته في الحساب، نظراً لطبيعة المحتوى الرقمي الفوري. للمزيد من التفاصيل يرجى مراجعة{' '}
              <Link href="/refund-policy" className="text-brand-primary font-semibold underline hover:text-brand-primary/80">
                سياسة الدفع والاسترداد
              </Link>.
            </p>
          </section>

          {/* المادة 6: إخلاء المسؤولية */}
          <section>
            <h2 className="text-lg font-bold text-brand-primary">المادة (6): إخلاء المسؤولية الأكاديمية</h2>
            <p className="mt-2 text-brand-muted">
              تهدف المنصة إلى تقديم أعلى مستوى من الشرح والتدريب لطلاب الثانوية العامة، وتعتمد النتيجة النهائية للامتحانات الرسمية على اجتهاد الطالب وقدراته وظروف امتحانات نهاية العام الرسمية.
            </p>
          </section>
        </div>

        <footer className="mt-10 border-t border-brand-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-muted">
          <p>© 2026 {siteConfig.brandMark} — جميع الحقوق محفوظة للأستاذ {siteConfig.teacherName}.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-brand-primary transition">سياسة الخصوصية</Link>
            <Link href="/refund-policy" className="hover:text-brand-primary transition">سياسة الاسترداد</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
