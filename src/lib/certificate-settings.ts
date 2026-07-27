import type {
  AppSettings,
  CertificateSettings,
  HomeCmsContent,
  PaymentGatewayCredentials,
  PaymentGatewaysSettings,
  SiteCmsContent,
} from "@/lib/admin/types";

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  organizationName: "Navbharat Gurukulam",
  organizationSubtitle: "Research Foundation",
  director: {
    name: "Dr. A. K. Sharma",
    title: "Director",
    signatureImage: "",
  },
  registrar: {
    name: "R. Mehta",
    title: "Registrar",
    signatureImage: "",
  },
};

export const DEFAULT_GATEWAY: PaymentGatewayCredentials = {
  enabled: false,
  mode: "test",
  keyId: "",
  keySecret: "",
  webhookSecret: "",
};

export const DEFAULT_PAYMENT_GATEWAYS: PaymentGatewaysSettings = {
  razorpay: { ...DEFAULT_GATEWAY },
  cashfree: { ...DEFAULT_GATEWAY },
  primary: "auto",
};

export const DEFAULT_HOME_CMS: HomeCmsContent = {
  heroKicker: "Welcome to Navbharat Gurukulam",
  heroTitleLine1: "Building Nation",
  heroHighlight1: "Research",
  heroTitleLine2: "and",
  heroHighlight2: "Education",
  heroSubtitle:
    "Navbharat Gurukulam Research Foundation empowers learners with research-led courses, expert mentors, and career-ready skills.",
  primaryCtaLabel: "Explore Courses",
  primaryCtaHref: "/courses",
  secondaryCtaLabel: "Learn More",
  secondaryCtaHref: "/about",
};

export const DEFAULT_SITE_CMS: SiteCmsContent = {
  home: DEFAULT_HOME_CMS,
  footerTagline:
    "Empowering learners worldwide with quality education and practical skills to achieve their dreams.",
  socialFacebook: "#",
  socialTwitter: "#",
  socialInstagram: "#",
  socialLinkedin: "#",
  socialYoutube: "#",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  siteName: "Navbharat Gurukulam",
  siteEmail: "support@navbharatgurukulam.com",
  sitePhone: "+91 12345 67890",
  currency: "INR",
  timezone: "Asia/Kolkata",
  maintenanceMode: false,
  allowRegistration: true,
  certificate: DEFAULT_CERTIFICATE_SETTINGS,
  paymentGateways: DEFAULT_PAYMENT_GATEWAYS,
  cms: DEFAULT_SITE_CMS,
};

export function mergeCertificateSettings(raw?: Partial<CertificateSettings>): CertificateSettings {
  return {
    organizationName: raw?.organizationName ?? DEFAULT_CERTIFICATE_SETTINGS.organizationName,
    organizationSubtitle: raw?.organizationSubtitle ?? DEFAULT_CERTIFICATE_SETTINGS.organizationSubtitle,
    director: {
      name: raw?.director?.name ?? DEFAULT_CERTIFICATE_SETTINGS.director.name,
      title: raw?.director?.title ?? DEFAULT_CERTIFICATE_SETTINGS.director.title,
      signatureImage: raw?.director?.signatureImage ?? "",
    },
    registrar: {
      name: raw?.registrar?.name ?? DEFAULT_CERTIFICATE_SETTINGS.registrar.name,
      title: raw?.registrar?.title ?? DEFAULT_CERTIFICATE_SETTINGS.registrar.title,
      signatureImage: raw?.registrar?.signatureImage ?? "",
    },
  };
}

function mergeGateway(
  raw: Partial<PaymentGatewayCredentials> | undefined,
  fallback: PaymentGatewayCredentials,
): PaymentGatewayCredentials {
  return {
    enabled: Boolean(raw?.enabled),
    mode: raw?.mode === "live" ? "live" : "test",
    keyId: String(raw?.keyId ?? fallback.keyId ?? ""),
    keySecret: String(raw?.keySecret ?? fallback.keySecret ?? ""),
    webhookSecret: String(raw?.webhookSecret ?? fallback.webhookSecret ?? ""),
  };
}

export function mergePaymentGateways(
  raw?: Partial<PaymentGatewaysSettings>,
): PaymentGatewaysSettings {
  return {
    razorpay: mergeGateway(raw?.razorpay, DEFAULT_PAYMENT_GATEWAYS.razorpay),
    cashfree: mergeGateway(raw?.cashfree, DEFAULT_PAYMENT_GATEWAYS.cashfree),
    primary:
      raw?.primary === "razorpay" || raw?.primary === "cashfree" ? raw.primary : "auto",
  };
}

export function mergeSiteCms(raw?: Partial<SiteCmsContent>): SiteCmsContent {
  return {
    ...DEFAULT_SITE_CMS,
    ...raw,
    home: {
      ...DEFAULT_HOME_CMS,
      ...(raw?.home ?? {}),
    },
  };
}

export function mergeAppSettings(raw?: Partial<AppSettings>): AppSettings {
  if (!raw) {
    return {
      ...DEFAULT_APP_SETTINGS,
      certificate: { ...DEFAULT_CERTIFICATE_SETTINGS },
      paymentGateways: {
        razorpay: { ...DEFAULT_GATEWAY },
        cashfree: { ...DEFAULT_GATEWAY },
        primary: "auto",
      },
      cms: {
        ...DEFAULT_SITE_CMS,
        home: { ...DEFAULT_HOME_CMS },
      },
    };
  }
  return {
    ...DEFAULT_APP_SETTINGS,
    ...raw,
    certificate: mergeCertificateSettings(raw.certificate),
    paymentGateways: mergePaymentGateways(raw.paymentGateways),
    cms: mergeSiteCms(raw.cms),
  };
}

/** Safe settings for admin UI — secrets masked unless empty */
export function redactPaymentSecrets(settings: AppSettings): AppSettings {
  const mask = (value: string) => (value ? "••••••••" + value.slice(-4) : "");
  return {
    ...settings,
    paymentGateways: {
      ...settings.paymentGateways,
      razorpay: {
        ...settings.paymentGateways.razorpay,
        keySecret: mask(settings.paymentGateways.razorpay.keySecret),
        webhookSecret: mask(settings.paymentGateways.razorpay.webhookSecret),
      },
      cashfree: {
        ...settings.paymentGateways.cashfree,
        keySecret: mask(settings.paymentGateways.cashfree.keySecret),
        webhookSecret: mask(settings.paymentGateways.cashfree.webhookSecret),
      },
    },
  };
}

export function isMaskedSecret(value: string | undefined) {
  return Boolean(value && value.startsWith("••••••••"));
}

export async function fileToDataUrl(file: File, maxBytes = 600_000): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please upload a PNG or JPG image");
  if (file.size > maxBytes) throw new Error("Image must be under 600 KB");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}
