import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'MMovieNight <noreply@resend.dev>' // En producción, usar dominio propio

interface SendInvitationEmailParams {
  to: string
  groupName: string
  inviterName: string
  inviteUrl: string
}

export async function sendInvitationEmail({
  to,
  groupName,
  inviterName,
  inviteUrl,
}: SendInvitationEmailParams) {
  // En desarrollo sin API key, solo logueamos
  if (!process.env.RESEND_API_KEY) {
    console.log('📧 Email de invitación (simulado):')
    console.log(`  To: ${to}`)
    console.log(`  Group: ${groupName}`)
    console.log(`  Inviter: ${inviterName}`)
    console.log(`  URL: ${inviteUrl}`)
    return { success: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${inviterName} te invitó a "${groupName}" en MMovieNight`,
      html: getInvitationEmailHtml({ groupName, inviterName, inviteUrl }),
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    throw error
  }
}

function getInvitationEmailHtml({
  groupName,
  inviterName,
  inviteUrl,
}: Omit<SendInvitationEmailParams, 'to'>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a MMovieNight</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a0f;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto;">
          <!-- Logo -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 12px; border-radius: 12px;">
                <span style="font-size: 24px;">🎬</span>
              </div>
              <h1 style="color: #f0f0f5; font-size: 24px; font-weight: bold; margin: 15px 0 5px 0;">MMovieNight</h1>
              <p style="color: #a0a0b0; font-size: 12px; margin: 0;">Después de los créditos, empieza la charla</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: #16161e; border-radius: 16px; padding: 30px; border: 1px solid #2a2a35;">
              <h2 style="color: #f0f0f5; font-size: 20px; margin: 0 0 15px 0; text-align: center;">
                ¡Te invitaron a un grupo!
              </h2>

              <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                <strong style="color: #14b8a6;">${inviterName}</strong> te invitó a unirte al grupo
                <strong style="color: #f0f0f5;">"${groupName}"</strong> en MMovieNight.
              </p>

              <p style="color: #a0a0b0; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                Uníte para registrar las películas que ven juntos, calificarlas y compartir opiniones.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${inviteUrl}"
                       style="display: inline-block; background-color: #14b8a6; color: #0a0a0f; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                      Unirme al grupo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b6b7b; font-size: 12px; margin: 25px 0 0 0; text-align: center;">
                Este link expira en 7 días.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 30px;">
              <p style="color: #6b6b7b; font-size: 12px; margin: 0;">
                Si no esperabas esta invitación, podés ignorar este email.
              </p>
              <p style="color: #6b6b7b; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} MMovieNight
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
