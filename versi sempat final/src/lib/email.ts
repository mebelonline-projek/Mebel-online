import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@mebelonline.id";
const APP_NAME = "Muara Teweh";

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: "Reset Password — Toko Furnitur",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="padding: 40px 32px 20px; text-align: center;">
                      <h1 style="font-size: 24px; color: #1a1a1a; margin: 0 0 8px;">Reset Password</h1>
                      <p style="font-size: 14px; color: #666; margin: 0;">
                        Kamu menerima email ini karena ada permintaan reset password untuk akun admin Toko Furnitur.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 32px; text-align: center;">
                      <a href="${resetLink}"
                         style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none;
                                padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 32px;">
                      <p style="font-size: 13px; color: #999; margin: 0; text-align: center;">
                        Link ini berlaku selama 1 jam. Abaikan email ini jika kamu tidak meminta reset password.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px; text-align: center; border-top: 1px solid #eee;">
                      <p style="font-size: 12px; color: #aaa; margin: 0;">
                        &copy; ${new Date().getFullYear()} Toko Furnitur. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: "Gagal mengirim email reset password. Silakan coba lagi.",
    };
  }
}
