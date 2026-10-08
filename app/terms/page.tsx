import type { Metadata } from 'next';
import Link from 'next/link';
import { PAGE_TITLES } from '@/lib/page-titles';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: PAGE_TITLES.terms,
  description: `شروط وأحكام الاستخدام - منصة ${siteConfig.brandMark}`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-brand-text leading-relaxed text-base" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">شروط وأحكام الاستخدام</h1>
      <p className="text-sm text-brand-muted mb-8">
        منصة {siteConfig.brandMark} — الأستاذ {siteConfig.teacherName} (آخر تحديث: أكتوبر 2026)
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">تمهيد</h2>
          <p>
            مرحباً بكم في منصة {siteConfig.brandMark} التعليمية التابعة للأستاذ {siteConfig.teacherName}. تسجيلك للحساب أو اشتراكك في الكورسات والاختبارات يعد موافقة على شروط الاستخدام الموضحة أدناه لضمان تجربة تعليمية منظمة وعادلة.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">1. تسجيل الحساب والاشتراك وبيانات ولي الأمر</h2>
          <p className="mb-2">
            يمكن للطالب التسجيل والاشتراك وسداد الرسوم مباشرة وبكل سهولة عبر وسائل الدفع المتاحة على المنصة.
          </p>
          <p>
            يُطلب تسجيل رقم هاتف ولي الأمر للتواصل وإرسال التقارير الدورية حول المستوى الأكاديمي ودرجات الاختبارات والواجبات عند الحاجة لذلك.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. الترخيص التعليمي وصلاحية المحتوى</h2>
          <p>
            الاشتراك في أي كورس يمنح الطالب ترخيصاً شخصياً لمشاهدة المحاضرات وحل الاختبارات والمتابعة الدراسية خلال العام الدراسي المحدد. المحتوى مخصص للتعلم الذاتي ولا يمنح الطالب حق إعادة توزيعه أو نشره.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. الأجهزة المسموح بها وحظر مشاركة الحسابات</h2>
          <p className="mb-2">
            يُسمح للطالب بفتح حسابه من خلال ما يصل إلى 3 أجهزة شخصية كحد أقصى (مثل: الهاتف المحمول، التابلت، وجهاز الكمبيوتر الشخصي).
          </p>
          <p>
            الحساب مخصص لاستخدام نفس الطالب حصرياً، ويُحظر تماماً مشاركة بيانات تسجيل الدخول مع أي طالب آخر أو بيع الحساب أو استخدامه بشكل جماعي. في حال ثبوت مشاركة الحساب مع أطراف أخرى، يحق لإدارة المنصة تعليق الحساب دون استرداد الرسوم.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. حماية المحتوى والملكية الفكرية</h2>
          <p className="mb-2">
            كافة مقاطع الفيديو، الشروحات، وبنوك الأسئلة والامتحانات هي ملكية تعليمية خاصة بالأستاذ {siteConfig.teacherName} ومحمية بحقوق الملكية الفكرية.
          </p>
          <p className="mb-2">
            يعرض مشغل الفيديو علامة مائية تتضمن بيانات حساب الطالب ورقم هاتفه بشكل دوري أثناء التشغيل لحماية المحتوى ومتابعة جودة البث.
          </p>
          <p>
            يُمنع تصوير الشاشة أو تفريغ الروابط أو إعادة رفع المحتوى على منصات خارجية (مثل تليجرام أو فيسبوك). يترتب على مخالفة ذلك إلغاء تفعيل الكورسات وحظر الحساب فوراً من المنصة دون استرداد للاشتراك.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. سياسة الدفع وعدم الاسترداد</h2>
          <p>
            تتم المدفوعات بالجنيه المصري عبر بوابة الدفع الإلكتروني المعتمدة. جميع عمليات الشراء نهائية بمجرد تفعيل الكورس في الحساب وإتاحته للاستخدام الفوري. للمزيد من التفاصيل يرجى مراجعة{' '}
            <Link href="/refund-policy" className="underline hover:text-brand-primary">
              سياسة الدفع والاسترداد
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. إخلاء المسؤولية الأكاديمية</h2>
          <p>
            تهدف المنصة إلى تقديم أعلى مستوى من الشرح والتدريب لطلاب الثانوية العامة، وتعتمد النتيجة النهائية للامتحانات الرسمية على اجتهاد الطالب وقدراته وظروف الامتحانات الرسمية العامة.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-brand-border text-sm text-brand-muted flex gap-4">
        <Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link>
        <span>•</span>
        <Link href="/refund-policy" className="hover:underline">سياسة الاسترداد</Link>
      </div>
    </div>
  );
}
