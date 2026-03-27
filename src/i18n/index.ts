import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const ar = {
  translation: {
    // ── Meta ──
    app_name: 'يلو وانت',
    tagline: 'أسرع تاكسي أصفر في عمّان',
    tagline_sub: 'اطلب تاكسيك الآن — مجاني تمامًا',

    // ── Landing ──
    want_taxi: 'أريد تاكسي',
    register_driver: 'سجّل كسائق',
    how_it_works: 'كيف يعمل؟',
    login: 'تسجيل الدخول',
    logout: 'خروج',

    // ── How it works ──
    step1_title: 'اضغط "أريد تاكسي"',
    step1_desc: 'شارك موقعك الحالي بضغطة واحدة',
    step2_title: 'السائق يقبل طلبك',
    step2_desc: 'أقرب تاكسي خلال 2 كم يصلك',
    step3_title: 'تتبّع التاكسي على الخريطة',
    step3_desc: 'شاهد السائق وهو يقترب منك',
    step4_title: 'الدفع عند الوصول',
    step4_desc: 'ادفع نقدًا كالعادة، بدون تطبيق',

    // ── Request flow ──
    finding_taxi: 'نبحث عن تاكسي قريب...',
    no_taxi_found: 'لا يوجد تاكسي متاح قريبك الآن',
    taxi_accepted: 'قبل سائقك طلبك!',
    driver_on_way: 'السائق في الطريق إليك',
    driver_arrived: 'السائق وصل!',
    chat_unlocked: 'يمكنك الآن التواصل مع السائق',
    trip_started: 'الرحلة بدأت',
    trip_completed: 'وصلت بسلامة!',

    // ── Driver info ──
    driver_name: 'اسم السائق',
    plate_number: 'رقم اللوحة',
    car_model: 'نوع السيارة',
    company: 'الشركة',
    verified_driver: 'سائق موثّق ✓',
    anonymous_passenger: 'راكب مجهول',

    // ── Privacy toggle ──
    hide_number: 'إخفاء رقمي',
    hide_number_desc: 'استخدام قناة مؤقتة آمنة',
    hide_number_on: 'الرقم مخفي — قناة مؤقتة فعّالة',
    hide_number_off: 'رقمك مرئي للسائق عند الوصول',

    // ── Driver portal ──
    go_online: 'متاح الآن',
    go_offline: 'غير متاح',
    new_request: 'طلب جديد!',
    accept_ride: 'قبول الرحلة',
    reject_ride: 'رفض',
    im_here: 'وصلت!',
    start_trip: 'بدء الرحلة',
    end_trip: 'إنهاء الرحلة',
    report_no_show: 'الراكب لم يحضر',
    driver_signup_title: 'سجّل كسائق تاكسي',
    driver_signup_desc: 'انضم لأسطول تاكسي عمّان الأصفر عبر واتساب مباشرة',
    driver_signup_wa: 'تسجيل عبر واتساب',

    // ── Admin ──
    admin_panel: 'لوحة الإدارة',
    verify_driver: 'توثيق السائق',
    suspend_driver: 'إيقاف السائق',
    total_rides: 'إجمالي الرحلات',
    active_drivers: 'السائقون النشطون',
    pending_verifications: 'طلبات التوثيق',

    // ── Auth ──
    phone_number: 'رقم الهاتف',
    otp_sent: 'تم إرسال الرمز',
    enter_otp: 'أدخل رمز التحقق',
    verify: 'تحقق',
    continue: 'متابعة',
    back: 'رجوع',

    // ── Errors ──
    location_denied: 'يرجى السماح بالوصول لموقعك',
    network_error: 'خطأ في الاتصال',
    generic_error: 'حدث خطأ، حاول مجددًا',

    // ── Misc ──
    free_service: 'مجاني بالكامل',
    amman_only: 'عمّان، الأردن',
    km_away: 'كم',
    min_away: 'دقيقة',
    chat: 'محادثة',
    send: 'إرسال',
    type_message: 'اكتب رسالة...',
    close: 'إغلاق',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    rate_trip: 'قيّم رحلتك',
  },
}

const en = {
  translation: {
    app_name: 'YellowWant',
    tagline: 'Fastest Yellow Taxi in Amman',
    tagline_sub: 'Hail your taxi now — completely free',

    want_taxi: 'I Want a Taxi',
    register_driver: 'Register as Driver',
    how_it_works: 'How It Works',
    login: 'Login',
    logout: 'Logout',

    step1_title: 'Tap "I Want a Taxi"',
    step1_desc: 'Share your location with one tap',
    step2_title: 'Driver Accepts',
    step2_desc: 'Nearest taxi within 2 km finds you',
    step3_title: 'Track on Map',
    step3_desc: 'Watch your driver approach in real time',
    step4_title: 'Pay on Arrival',
    step4_desc: 'Cash as usual — no app required',

    finding_taxi: 'Searching for a nearby taxi...',
    no_taxi_found: 'No taxis available near you right now',
    taxi_accepted: 'Your driver accepted!',
    driver_on_way: 'Driver is on the way',
    driver_arrived: 'Driver has arrived!',
    chat_unlocked: 'You can now chat with your driver',
    trip_started: 'Trip started',
    trip_completed: 'Arrived safely!',

    driver_name: 'Driver Name',
    plate_number: 'Plate Number',
    car_model: 'Car Model',
    company: 'Company',
    verified_driver: 'Verified Driver ✓',
    anonymous_passenger: 'Anonymous Passenger',

    hide_number: 'Hide My Number',
    hide_number_desc: 'Use a secure temporary channel',
    hide_number_on: 'Number hidden — temporary channel active',
    hide_number_off: 'Your number visible to driver on arrival',

    go_online: 'Go Online',
    go_offline: 'Go Offline',
    new_request: 'New Request!',
    accept_ride: 'Accept Ride',
    reject_ride: 'Reject',
    im_here: "I'm Here",
    start_trip: 'Start Trip',
    end_trip: 'End Trip',
    report_no_show: 'Passenger No-Show',
    driver_signup_title: 'Register as a Driver',
    driver_signup_desc: 'Join Amman\'s yellow taxi fleet via WhatsApp',
    driver_signup_wa: 'Sign up via WhatsApp',

    admin_panel: 'Admin Panel',
    verify_driver: 'Verify Driver',
    suspend_driver: 'Suspend Driver',
    total_rides: 'Total Rides',
    active_drivers: 'Active Drivers',
    pending_verifications: 'Pending Verifications',

    phone_number: 'Phone Number',
    otp_sent: 'Code Sent',
    enter_otp: 'Enter Verification Code',
    verify: 'Verify',
    continue: 'Continue',
    back: 'Back',

    location_denied: 'Please allow location access',
    network_error: 'Connection error',
    generic_error: 'Something went wrong, please try again',

    free_service: 'Completely Free',
    amman_only: 'Amman, Jordan',
    km_away: 'km',
    min_away: 'min',
    chat: 'Chat',
    send: 'Send',
    type_message: 'Type a message...',
    close: 'Close',
    confirm: 'Confirm',
    cancel: 'Cancel',
    rate_trip: 'Rate Your Trip',
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ar, en },
    fallbackLng: 'ar',
    lng: 'ar', // Force Arabic as default
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
