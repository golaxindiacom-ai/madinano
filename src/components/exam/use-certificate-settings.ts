"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/certificate-settings";
import type { CertificateSettings } from "@/lib/admin/types";

export function useCertificateSettings() {
  const [settings, setSettings] = useState<CertificateSettings>(DEFAULT_CERTIFICATE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/certificate")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setSettings(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
