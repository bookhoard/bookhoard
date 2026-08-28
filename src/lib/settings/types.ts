export type SmtpEncryption = "none" | "starttls" | "ssl";

export interface SmtpSettings {
  host?: string;
  port?: number;
  /** none = plaintext, starttls = upgrade via STARTTLS (typically port 587), ssl = implicit TLS (typically port 465) */
  encryption?: SmtpEncryption;
  user?: string;
  pass?: string;
  fromAddress?: string;
}

export interface AppSettings {
  /** how many candidates the Fetch Metadata drawer requests from Open Library */
  metadataCandidateLimit: number;
  trendingEnabled: boolean;
  smtp: SmtpSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  metadataCandidateLimit: 10,
  trendingEnabled: true,
  smtp: {},
};

/** Settings the client is allowed to see — SMTP password stripped. */
export type PublicAppSettings = Omit<AppSettings, "smtp"> & {
  smtp: Omit<SmtpSettings, "pass"> & { hasPassword: boolean };
};

export function toPublicSettings(settings: AppSettings): PublicAppSettings {
  const { pass, ...smtpRest } = settings.smtp;
  return {
    ...settings,
    smtp: { ...smtpRest, hasPassword: !!pass },
  };
}
