import { images } from "@/lib/images";
import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/certificate-settings";
import type { CertificateSettings, CertificateTemplateId } from "@/lib/admin/types";

/** @deprecated use DEFAULT_CERTIFICATE_SETTINGS */
export const ORG = {
  name: DEFAULT_CERTIFICATE_SETTINGS.organizationName,
  subtitle: DEFAULT_CERTIFICATE_SETTINGS.organizationSubtitle,
  directorName: DEFAULT_CERTIFICATE_SETTINGS.director.name,
  directorTitle: DEFAULT_CERTIFICATE_SETTINGS.director.title,
  registrarName: DEFAULT_CERTIFICATE_SETTINGS.registrar.name,
  registrarTitle: DEFAULT_CERTIFICATE_SETTINGS.registrar.title,
};

export type CertificateData = {
  studentName: string;
  quizTitle: string;
  courseTitle: string;
  percentage: number;
  score: number;
  issuedAt: string;
  certificateNo: string;
  qrCodeDataUrl?: string;
  verifyUrl?: string;
};

export const CERTIFICATE_TEMPLATES: {
  id: CertificateTemplateId;
  name: string;
  description: string;
  swatch: string[];
}[] = [
  { id: "classic-maroon", name: "Classic Maroon", description: "Traditional double-border with gold seal", swatch: ["#7b1e2b", "#c79a3a", "#fbf7ee"] },
  { id: "royal-gold", name: "Royal Gold", description: "Ornate gold frame, ceremonial look", swatch: ["#b8860b", "#7b1e2b", "#fffdf5"] },
  { id: "modern-minimal", name: "Modern Minimal", description: "Clean, white, sans-serif corporate", swatch: ["#7b1e2b", "#1f2937", "#ffffff"] },
  { id: "elegant-forest", name: "Elegant Forest", description: "Deep green with gold botanical accents", swatch: ["#2f5233", "#c79a3a", "#f6f8f2"] },
  { id: "premium-dark", name: "Premium Dark", description: "Luxe dark charcoal with gold foil text", swatch: ["#14110f", "#d4af37", "#1f1b18"] },
];

type TemplateProps = { c: CertificateData; settings: CertificateSettings };

const fmtDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "";

/** Subtle academic guilloche / crosshatch pattern rendered as a full-bleed background. */
function PatternBg({ color, opacity = 0.05 }: { color: string; opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 9px), repeating-linear-gradient(-45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 9px)`,
      }}
    />
  );
}

/** Faded crest watermark behind the content. */
function Watermark({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <img src={images.logo} alt="" className="h-3/4 w-3/4 max-w-[60%] object-contain" style={{ opacity }} />
    </div>
  );
}

/** Decorative corner flourish placed in each of the four corners of a frame. */
function CornerFlourishes({ color }: { color: string }) {
  const corner = (
    <svg viewBox="0 0 60 60" className="h-7 w-7 sm:h-9 sm:w-9" fill="none" stroke={color} strokeWidth={1.5}>
      <path d="M2 30 C2 14 14 2 30 2" strokeLinecap="round" />
      <path d="M2 22 C2 11 11 2 22 2" opacity={0.55} strokeLinecap="round" />
      <circle cx="9" cy="9" r="2" fill={color} stroke="none" />
    </svg>
  );
  return (
    <div className="pointer-events-none absolute inset-2.5 sm:inset-3">
      <span className="absolute left-0 top-0">{corner}</span>
      <span className="absolute right-0 top-0 rotate-90">{corner}</span>
      <span className="absolute bottom-0 right-0 rotate-180">{corner}</span>
      <span className="absolute bottom-0 left-0 -rotate-90">{corner}</span>
    </div>
  );
}

/** Ornamental divider (fleuron) used under section titles. */
function Fleuron({ color }: { color: string }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2" aria-hidden>
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <svg viewBox="0 0 24 24" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill={color}>
        <path d="M12 2l2.2 6.9H21l-5.6 4 2.2 6.9L12 15.8 6.4 19.8l2.2-6.9L3 8.9h6.8z" />
      </svg>
      <span className="h-px w-10 sm:w-16" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}

/** Award seal / medallion badge showing the achieved percentage. */
function SealBadge({ percentage, ring, accent, textColor = "#ffffff" }: { percentage: number; ring: string; accent: string; textColor?: string }) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
      <div className="relative grid h-14 w-14 place-items-center sm:h-[70px] sm:w-[70px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <circle cx="50" cy="50" r="46" fill={accent} />
          <circle cx="50" cy="50" r="46" fill="none" stroke={ring} strokeWidth="3" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="38" fill="none" stroke={ring} strokeWidth="1.5" />
        </svg>
        <div className="relative text-center" style={{ color: textColor }}>
          <p className="text-sm font-extrabold leading-none sm:text-lg">{percentage}%</p>
          <p className="text-[6px] font-bold uppercase tracking-widest sm:text-[7px]">Score</p>
        </div>
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45" style={{ background: ring }} />
      </div>
    </div>
  );
}

function Signature({
  name,
  title,
  signatureImage,
  color = "#334155",
}: {
  name: string;
  title: string;
  signatureImage?: string;
  color?: string;
}) {
  return (
    <div className="min-w-[100px] text-center sm:min-w-[120px]">
      {signatureImage ? (
        <img src={signatureImage} alt={`${name} signature`} className="mx-auto h-10 max-w-[130px] object-contain sm:h-12" />
      ) : (
        <p className="font-serif text-lg italic sm:text-xl" style={{ color }}>{name}</p>
      )}
      <div className="mx-auto mt-1 h-px w-28 sm:w-36" style={{ backgroundColor: color, opacity: 0.5 }} />
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider sm:text-xs" style={{ color, opacity: 0.85 }}>{title}</p>
      {signatureImage ? <p className="mt-0.5 text-[9px] font-medium sm:text-[10px]" style={{ color }}>{name}</p> : null}
    </div>
  );
}

function QrBlock({ data, label = "Scan to verify", light }: { data?: string; label?: string; light?: boolean }) {
  if (!data) return <div className="w-20 sm:w-24" />;
  return (
    <div className="text-center">
      <img src={data} alt="Verification QR" className="mx-auto h-20 w-20 rounded-md sm:h-24 sm:w-24" style={{ background: "#fff", padding: 4 }} />
      <p className={`mt-1 text-[9px] sm:text-[10px] ${light ? "text-white/70" : "text-slate-500"}`}>{label}</p>
    </div>
  );
}

function ClassicMaroon({ c, settings }: TemplateProps) {
  const sigColor = "#7b1e2b";
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-[#fbf7ee] p-2 sm:p-3">
      <PatternBg color="#7b1e2b" opacity={0.04} />
      <div className="relative flex h-full w-full flex-col items-center justify-center border-[3px] border-double border-[#7b1e2b] px-6 py-6 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-2 border border-[#c79a3a]/60" />
        <CornerFlourishes color="#c79a3a" />
        <Watermark opacity={0.04} />
        <SealBadge percentage={c.percentage} ring="#c79a3a" accent="#7b1e2b" />
        <img src={images.logo} alt="crest" className="relative h-16 w-16 object-contain sm:h-20 sm:w-20" />
        <h2 className="relative mt-2 font-serif text-xl font-bold tracking-tight text-[#7b1e2b] sm:text-2xl">{settings.organizationName}</h2>
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c79a3a] sm:text-xs">{settings.organizationSubtitle}</p>
        <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500 sm:text-sm">Certificate of Achievement</p>
        <Fleuron color="#c79a3a" />
        <p className="relative mt-3 text-[11px] text-slate-500 sm:text-sm">This is proudly presented to</p>
        <p className="relative mt-1 font-serif text-2xl font-bold text-slate-900 sm:text-4xl">{c.studentName}</p>
        <p className="relative mt-3 max-w-xl text-[11px] text-slate-600 sm:text-sm">
          for successfully completing <span className="font-semibold text-[#7b1e2b]">{c.quizTitle}</span>
          {c.courseTitle ? <> in the course <span className="font-semibold">{c.courseTitle}</span></> : null} with a score of{" "}
          <span className="font-semibold">{c.percentage}%</span>.
        </p>
        <div className="relative mt-6 flex w-full items-end justify-between gap-4">
          <Signature name={settings.director.name} title={settings.director.title} signatureImage={settings.director.signatureImage} color={sigColor} />
          <QrBlock data={c.qrCodeDataUrl} />
          <Signature name={settings.registrar.name} title={settings.registrar.title} signatureImage={settings.registrar.signatureImage} color={sigColor} />
        </div>
        <div className="relative mt-3 flex w-full items-center justify-between text-[9px] text-slate-400 sm:text-[10px]">
          <span className="font-mono">No: {c.certificateNo}</span>
          <span>Issued: {fmtDate(c.issuedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function RoyalGold({ c, settings }: TemplateProps) {
  const sigColor = "#b8860b";
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-[#fffdf5] p-2 sm:p-3">
      <PatternBg color="#b8860b" opacity={0.06} />
      <div className="relative flex h-full w-full flex-col items-center justify-center border-[6px] border-[#b8860b] px-6 py-6 text-center sm:px-12"
        style={{ boxShadow: "inset 0 0 0 3px #fffdf5, inset 0 0 0 5px #7b1e2b" }}>
        {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map((pos) => (
          <span key={pos} className={`pointer-events-none absolute ${pos} h-6 w-6 border-2 border-[#b8860b]`} />
        ))}
        <CornerFlourishes color="#b8860b" />
        <Watermark opacity={0.05} />
        <SealBadge percentage={c.percentage} ring="#b8860b" accent="#7b1e2b" />
        <img src={images.logo} alt="crest" className="relative h-16 w-16 object-contain sm:h-20 sm:w-20" />
        <h2 className="relative mt-2 font-serif text-xl font-bold tracking-tight text-[#7b1e2b] sm:text-2xl">{settings.organizationName}</h2>
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b8860b] sm:text-xs">{settings.organizationSubtitle}</p>
        <p className="relative mt-3 font-serif text-lg font-bold uppercase tracking-[0.2em] text-[#b8860b] sm:text-2xl">Certificate of Excellence</p>
        <Fleuron color="#b8860b" />
        <p className="relative mt-2 text-[11px] text-slate-500 sm:text-sm">This certificate is awarded to</p>
        <p className="relative mt-1 font-serif text-2xl font-bold text-slate-900 sm:text-4xl">{c.studentName}</p>
        <p className="relative mt-3 max-w-xl text-[11px] text-slate-600 sm:text-sm">
          in recognition of outstanding performance in <span className="font-semibold text-[#7b1e2b]">{c.quizTitle}</span>
          {c.courseTitle ? <> ({c.courseTitle})</> : null}, achieving <span className="font-semibold">{c.percentage}%</span>.
        </p>
        <div className="relative mt-6 flex w-full items-end justify-between gap-4">
          <Signature name={settings.director.name} title={settings.director.title} signatureImage={settings.director.signatureImage} color={sigColor} />
          <QrBlock data={c.qrCodeDataUrl} />
          <Signature name={settings.registrar.name} title={settings.registrar.title} signatureImage={settings.registrar.signatureImage} color={sigColor} />
        </div>
        <div className="relative mt-3 flex w-full items-center justify-between text-[9px] text-slate-400 sm:text-[10px]">
          <span className="font-mono">No: {c.certificateNo}</span>
          <span>Issued: {fmtDate(c.issuedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function ModernMinimal({ c, settings }: TemplateProps) {
  const sigColor = "#1f2937";
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-white">
      <PatternBg color="#7b1e2b" opacity={0.035} />
      <Watermark opacity={0.035} />
      <div className="absolute inset-y-0 left-0 w-2 bg-[#7b1e2b] sm:w-3" />
      <div className="absolute inset-y-0 left-2 w-1 bg-[#c79a3a] sm:left-3" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 sm:h-32 sm:w-32" style={{ background: "radial-gradient(circle at top right, rgba(199,154,58,0.18), transparent 70%)" }} />
      <SealBadge percentage={c.percentage} ring="#c79a3a" accent="#7b1e2b" />
      <div className="relative flex h-full flex-col justify-center px-8 py-6 sm:px-16">
        <div className="flex items-center gap-3">
          <img src={images.logo} alt="crest" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">{settings.organizationName}</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#7b1e2b] sm:text-[10px]">{settings.organizationSubtitle}</p>
          </div>
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.35em] text-[#7b1e2b] sm:text-xs">Certificate of Completion</p>
        <p className="mt-3 text-[11px] text-slate-500 sm:text-sm">This certifies that</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{c.studentName}</p>
        <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-slate-600 sm:text-sm">
          has successfully completed <span className="font-semibold text-[#7b1e2b]">{c.quizTitle}</span>
          {c.courseTitle ? <> · {c.courseTitle}</> : null} scoring <span className="font-semibold">{c.percentage}%</span> ({c.score} marks).
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="flex items-end gap-8">
            <Signature name={settings.director.name} title={settings.director.title} signatureImage={settings.director.signatureImage} color={sigColor} />
            <div>
              <p className="font-mono text-[9px] text-slate-400 sm:text-[10px]">No: {c.certificateNo}</p>
              <p className="text-[9px] text-slate-400 sm:text-[10px]">Issued: {fmtDate(c.issuedAt)}</p>
            </div>
          </div>
          <QrBlock data={c.qrCodeDataUrl} />
        </div>
      </div>
    </div>
  );
}

function ElegantForest({ c, settings }: TemplateProps) {
  const sigColor = "#2f5233";
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-[#f6f8f2] p-2 sm:p-3">
      <PatternBg color="#2f5233" opacity={0.045} />
      <div className="relative flex h-full w-full flex-col items-center justify-center border-2 border-[#2f5233] px-6 py-6 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-1.5 border border-[#c79a3a]/50" />
        <CornerFlourishes color="#2f5233" />
        <Watermark opacity={0.04} />
        <SealBadge percentage={c.percentage} ring="#c79a3a" accent="#2f5233" />
        <div className="relative flex items-center gap-2">
          <span className="h-px w-8 bg-[#c79a3a] sm:w-12" />
          <img src={images.logo} alt="crest" className="h-14 w-14 object-contain sm:h-16 sm:w-16" />
          <span className="h-px w-8 bg-[#c79a3a] sm:w-12" />
        </div>
        <h2 className="relative mt-2 font-serif text-xl font-bold tracking-tight text-[#2f5233] sm:text-2xl">{settings.organizationName}</h2>
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c79a3a] sm:text-xs">{settings.organizationSubtitle}</p>
        <p className="relative mt-4 font-serif text-base font-bold uppercase tracking-[0.25em] text-[#2f5233] sm:text-xl">Certificate of Merit</p>
        <Fleuron color="#c79a3a" />
        <p className="relative mt-2 text-[11px] text-slate-500 sm:text-sm">Awarded with distinction to</p>
        <p className="relative mt-1 font-serif text-2xl font-bold text-[#1f2b1f] sm:text-4xl">{c.studentName}</p>
        <p className="relative mt-3 max-w-xl text-[11px] text-slate-600 sm:text-sm">
          for excellence in <span className="font-semibold text-[#2f5233]">{c.quizTitle}</span>
          {c.courseTitle ? <> ({c.courseTitle})</> : null} with a score of <span className="font-semibold">{c.percentage}%</span>.
        </p>
        <div className="relative mt-6 flex w-full items-end justify-between gap-4">
          <Signature name={settings.director.name} title={settings.director.title} signatureImage={settings.director.signatureImage} color={sigColor} />
          <QrBlock data={c.qrCodeDataUrl} />
          <Signature name={settings.registrar.name} title={settings.registrar.title} signatureImage={settings.registrar.signatureImage} color={sigColor} />
        </div>
        <div className="relative mt-3 flex w-full items-center justify-between text-[9px] text-slate-400 sm:text-[10px]">
          <span className="font-mono">No: {c.certificateNo}</span>
          <span>Issued: {fmtDate(c.issuedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function PremiumDark({ c, settings }: TemplateProps) {
  const sigColor = "#d4af37";
  return (
    <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-[#14110f] p-2 sm:p-3">
      <PatternBg color="#d4af37" opacity={0.06} />
      <div className="relative flex h-full w-full flex-col items-center justify-center border border-[#d4af37]/60 px-6 py-6 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-1.5 border border-[#d4af37]/20" />
        <CornerFlourishes color="#d4af37" />
        <Watermark opacity={0.06} />
        <SealBadge percentage={c.percentage} ring="#d4af37" accent="#1f1b18" textColor="#d4af37" />
        <img src={images.logo} alt="crest" className="relative h-16 w-16 object-contain sm:h-20 sm:w-20" />
        <h2 className="relative mt-2 font-serif text-xl font-bold tracking-tight text-[#d4af37] sm:text-2xl">{settings.organizationName}</h2>
        <p className="relative text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d4af37]/70 sm:text-xs">{settings.organizationSubtitle}</p>
        <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.35em] text-[#d4af37] sm:text-sm">Certificate of Honour</p>
        <Fleuron color="#d4af37" />
        <p className="relative mt-3 text-[11px] text-white/60 sm:text-sm">Presented to</p>
        <p className="relative mt-1 font-serif text-2xl font-bold text-white sm:text-4xl">{c.studentName}</p>
        <p className="relative mt-3 max-w-xl text-[11px] text-white/70 sm:text-sm">
          for successfully completing <span className="font-semibold text-[#d4af37]">{c.quizTitle}</span>
          {c.courseTitle ? <> in {c.courseTitle}</> : null}, scoring <span className="font-semibold text-white">{c.percentage}%</span>.
        </p>
        <div className="relative mt-6 flex w-full items-end justify-between gap-4">
          <Signature name={settings.director.name} title={settings.director.title} signatureImage={settings.director.signatureImage} color={sigColor} />
          <QrBlock data={c.qrCodeDataUrl} light />
          <Signature name={settings.registrar.name} title={settings.registrar.title} signatureImage={settings.registrar.signatureImage} color={sigColor} />
        </div>
        <div className="relative mt-3 flex w-full items-center justify-between text-[9px] text-white/40 sm:text-[10px]">
          <span className="font-mono">No: {c.certificateNo}</span>
          <span>Issued: {fmtDate(c.issuedAt)}</span>
        </div>
      </div>
    </div>
  );
}

export function CertificateDesign({
  template = "classic-maroon",
  data,
  settings = DEFAULT_CERTIFICATE_SETTINGS,
}: {
  template?: CertificateTemplateId;
  data: CertificateData;
  settings?: CertificateSettings;
}) {
  const props = { c: data, settings };
  switch (template) {
    case "royal-gold":
      return <RoyalGold {...props} />;
    case "modern-minimal":
      return <ModernMinimal {...props} />;
    case "elegant-forest":
      return <ElegantForest {...props} />;
    case "premium-dark":
      return <PremiumDark {...props} />;
    case "classic-maroon":
    default:
      return <ClassicMaroon {...props} />;
  }
}
