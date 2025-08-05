// lib/auth/resendEmailProvider.ts

import { Resend } from "resend";
import type { EmailConfig } from "next-auth/providers/email";

const resend = new Resend(process.env.RESEND_API_KEY!);

export function resendEmailProvider(): EmailConfig {
  return {
    id: "resend",
    type: "email",
    name: "Email",
    from: "tu@dominio.com", // Debe estar verificado en Resend

    async sendVerificationRequest({ identifier, url }) {
      try {
        await resend.emails.send({
          from: "tu@dominio.com",
          to: [identifier],
          subject: "Tu enlace mágico de acceso",
          html: `
            <p>Hola,</p>
            <p>Haz clic en el siguiente enlace para iniciar sesión:</p>
            <p><a href="${url}">${url}</a></p>
            <p>Este enlace expirará en 10 minutos.</p>
          `,
        });
      } catch (error) {
        console.error("Error enviando el Magic Link con Resend:", error);
        throw new Error("No se pudo enviar el enlace de verificación.");
      }
    },
  };
}
