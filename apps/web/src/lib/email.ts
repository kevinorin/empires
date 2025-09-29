import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private static defaultFrom = 'Empires Game <noreply@empires-game.com>'

  static async sendEmail({ to, subject, html, from }: EmailOptions) {
    try {
      const { data, error } = await resend.emails.send({
        from: from || this.defaultFrom,
        to: [to],
        subject,
        html,
      })

      if (error) {
        console.error('Email send error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  // Welcome email for new players
  static async sendWelcomeEmail(username: string, email: string, tribe: number) {
    const tribeNames = { 1: 'Romans', 2: 'Teutons', 3: 'Gauls' }
    const tribeName = tribeNames[tribe as keyof typeof tribeNames] || 'Romans'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Empires!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .tribe-badge { display: inline-block; background: #fbbf24; color: black; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .cta-button { display: inline-block; background: #fbbf24; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .resources { display: flex; justify-content: space-around; margin: 20px 0; }
            .resource { text-align: center; }
            .resource-icon { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚔️ Welcome to EMPIRES!</h1>
              <p>Your empire awaits, ${username}!</p>
            </div>
            <div class="content">
              <h2>Your Journey Begins</h2>
              <p>Congratulations on joining the <span class="tribe-badge">${tribeName}</span> tribe!</p>
              
              <p>You've been granted a starting village with resources to begin building your empire:</p>
              
              <div class="resources">
                <div class="resource">
                  <div class="resource-icon">🪵</div>
                  <div>750 Wood</div>
                </div>
                <div class="resource">
                  <div class="resource-icon">🧱</div>
                  <div>750 Clay</div>
                </div>
                <div class="resource">
                  <div class="resource-icon">⚒️</div>
                  <div>750 Iron</div>
                </div>
                <div class="resource">
                  <div class="resource-icon">🌾</div>
                  <div>750 Crop</div>
                </div>
              </div>

              <h3>Next Steps:</h3>
              <ul>
                <li>📍 Build your first resource buildings</li>
                <li>🏘️ Expand your village population</li>
                <li>⚔️ Train your first army units</li>
                <li>🤝 Consider joining an alliance</li>
                <li>🗺️ Explore the world map</li>
              </ul>

              <div style="text-align: center;">
                <a href="http://localhost:3000" class="cta-button">Enter Your Empire →</a>
              </div>

              <p><small>May your empire prosper and your enemies tremble!</small></p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: '⚔️ Welcome to Empires - Your Empire Awaits!',
      html,
    })
  }

  // Password reset email
  static async sendPasswordResetEmail(email: string, resetLink: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Empires Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .cta-button { display: inline-block; background: #fbbf24; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>Reset your Empires account password</p>
            </div>
            <div class="content">
              <p>You requested a password reset for your Empires account.</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="cta-button">Reset Password →</a>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>

              <p><small>Protect your empire - keep your account secure!</small></p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: '🔐 Reset Your Empires Password',
      html,
    })
  }

  // Alliance invitation email
  static async sendAllianceInvitation(
    playerEmail: string,
    playerName: string,
    allianceName: string,
    inviterName: string
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Alliance Invitation - ${allianceName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .alliance-badge { display: inline-block; background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .cta-button { display: inline-block; background: #fbbf24; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 Alliance Invitation</h1>
              <p>You've been invited to join an alliance!</p>
            </div>
            <div class="content">
              <p>Greetings ${playerName},</p>
              
              <p><strong>${inviterName}</strong> has invited you to join the alliance:</p>
              <div style="text-align: center;">
                <span class="alliance-badge">${allianceName}</span>
              </div>

              <h3>Alliance Benefits:</h3>
              <ul>
                <li>🛡️ Protection from enemy attacks</li>
                <li>🤝 Coordinated strategies and support</li>
                <li>📈 Shared resources and knowledge</li>
                <li>💬 Access to alliance chat</li>
                <li>🎯 Participate in alliance wars</li>
              </ul>

              <div style="text-align: center;">
                <a href="http://localhost:3000/alliances" class="cta-button">View Invitation →</a>
              </div>

              <p><small>Unite with fellow players and dominate the realm!</small></p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: playerEmail,
      subject: `🤝 ${allianceName} Alliance Invitation`,
      html,
    })
  }
}