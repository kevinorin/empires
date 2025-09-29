// SMTP2GO Email Service
// Using SMTP2GO API for sending emails

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export class SMTP2GOEmailService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.SMTP2GO_API_KEY!
    // Use a verified email for now - you can change this once manifestfts.com is verified
    this.fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'empires@manifestfts.com'

    if (!this.apiKey) {
      throw new Error('SMTP2GO_API_KEY is not configured')
    }
  }

  async sendEmail({ to, subject, html, text }: EmailData) {
    console.log('📧 Attempting to send email via SMTP2GO:', {
      to,
      subject,
      from: this.fromEmail,
      hasApiKey: !!this.apiKey
    })

    const payload = {
      api_key: this.apiKey,
      to: [to],
      sender: this.fromEmail,
      subject: subject,
      html_body: html,
      text_body: text || this.stripHtml(html)
    }

    try {
      console.log('📧 Making request to SMTP2GO API...')
      const response = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('📧 SMTP2GO API Response:', {
        status: response.status,
        statusText: response.statusText,
        result
      })

      if (!response.ok || result.data?.error) {
        throw new Error(`SMTP2GO Error: ${result.data?.error || result.error || 'Unknown error'}`)
      }

      console.log('✅ Email sent successfully!')
      return result
    } catch (error) {
      console.error('❌ Failed to send email via SMTP2GO:', error)
      throw error
    }
  }

  async sendWelcomeEmail(userEmail: string, username: string, tribe: string) {
    const tribeEmojis = {
      'Romans': '🏛️',
      'Teutons': '⚔️',
      'Gauls': '🛡️',
      'Egyptians': '🏺',
      'Nubians': '🏹'
    }

    const tribeEmoji = tribeEmojis[tribe as keyof typeof tribeEmojis] || '⚔️'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Empires</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 2.5em;">⚔️ EMPIRES</h1>
            <p style="margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9;">Build your empire, forge alliances, conquer worlds</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Welcome to your Empire, ${username}! ${tribeEmoji}</h2>
            
            <p>Congratulations on joining the <strong>${tribe}</strong> tribe! Your empire awaits your command.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #2c3e50;">Your Empire Begins Now</h3>
              <ul style="margin: 0;">
                <li>🏰 <strong>Your Capital City</strong> has been founded</li>
                <li>💰 <strong>Starting Resources</strong> have been allocated</li>
                <li>🛡️ <strong>Initial Defenses</strong> are in place</li>
                <li>⚔️ <strong>Ready for Expansion</strong> when you are</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/village" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Enter Your Village
              </a>
            </div>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #2c3e50;">Quick Start Tips:</h4>
              <p style="margin-bottom: 0; font-size: 0.9em;">
                • Build resource buildings to grow your economy<br>
                • Train troops to defend your empire<br>
                • Join an alliance for protection and cooperation<br>
                • Explore the world map to find expansion opportunities
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="text-align: center; color: #6c757d; font-size: 0.9em; margin-bottom: 0;">
              The realm awaits your command, Emperor ${username}!<br>
              <strong>May your empire prosper! ${tribeEmoji}</strong>
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
Welcome to Empires, ${username}!

Congratulations on joining the ${tribe} tribe! Your empire awaits your command.

Your Empire Begins Now:
- Your Capital City has been founded
- Starting Resources have been allocated  
- Initial Defenses are in place
- Ready for Expansion when you are

Quick Start Tips:
• Build resource buildings to grow your economy
• Train troops to defend your empire
• Join an alliance for protection and cooperation
• Explore the world map to find expansion opportunities

Visit your village: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/village

The realm awaits your command, Emperor ${username}!
May your empire prosper! ${tribeEmoji}
    `

    return this.sendEmail({
      to: userEmail,
      subject: `Welcome to Empires, Emperor ${username}! ${tribeEmoji}`,
      html,
      text
    })
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
}

export const emailService = new SMTP2GOEmailService()