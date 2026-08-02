import type { NextAuthOptions } from "next-auth";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { createTransport } from "nodemailer9";

type AuthProvider = NextAuthOptions["providers"][number];

type SecureEmailProviderOptions = {
  server: SMTPTransport.Options;
  from?: string;
  maxAge?: number;
};

type SecureEmailProviderConfig = {
  id: "email";
  type: "email";
  name: "Email";
  server: SecureEmailProviderOptions["server"];
  from: string;
  maxAge: number;
  options: SecureEmailProviderOptions;
  sendVerificationRequest: (params: {
    identifier: string;
    url: string;
    provider: SecureEmailProviderConfig;
    theme: {
      brandColor?: string;
      buttonText?: string;
    };
  }) => Promise<void>;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });

export function createSecureEmailProvider(
  options: SecureEmailProviderOptions
): AuthProvider {
  const provider: SecureEmailProviderConfig = {
    id: "email",
    type: "email",
    name: "Email",
    server: options.server,
    from: options.from ?? "NextAuth <no-reply@example.com>",
    maxAge: options.maxAge ?? 24 * 60 * 60,
    options,
    async sendVerificationRequest({ identifier, url, provider, theme }) {
      const host = new URL(url).host;
      const safeHost = escapeHtml(host).replace(/\./g, "&#8203;.");
      const safeUrl = escapeHtml(url);
      const transport = createTransport(provider.server);
      const result = await transport.sendMail({
        to: identifier,
        from: provider.from,
        subject: `Sign in to ${host}`,
        text: `Sign in to ${host}\n${url}\n\n`,
        html: `<body style="background: #f9f9f9"><table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #fff; max-width: 600px; margin: auto; border-radius: 5px"><tr><td align="center" style="padding: 10px 0; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #444">Sign in to <strong>${safeHost}</strong></td></tr><tr><td align="center" style="padding: 20px 0"><a href="${safeUrl}" target="_blank" rel="noreferrer" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${theme.buttonText ?? "#fff"}; background: ${theme.brandColor ?? "#346df1"}; text-decoration: none; border-radius: 5px; padding: 10px 20px; display: inline-block">Sign in</a></td></tr><tr><td align="center" style="padding: 0 0 10px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #444">If you did not request this email you can safely ignore it.</td></tr></table></body>`,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      const failed = [...result.rejected, ...result.pending].filter(Boolean);
      if (failed.length > 0) {
        throw new Error(`Email (${failed.join(", ")}) could not be sent`);
      }
    },
  };

  return provider as unknown as AuthProvider;
}
