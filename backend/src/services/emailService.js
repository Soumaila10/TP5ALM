const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
    logger.info('[email] Nodemailer SMTP transporter configured');
  } else {
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info({ mailTo: mailOptions.to, mailSubject: mailOptions.subject }, '[email] [DEV/MOCK] Sending email');
        return { messageId: 'mock-id' };
      }
    };
    logger.warn('[email] SMTP configuration missing, using mock email transporter');
  }

  return transporter;
}

async function sendWelcomeEmail(to, firstName) {
  const mailOptions = {
    from: '"FIFA Ticketing Hub 2026" <noreply@fifa.com>',
    to,
    subject: 'Bienvenue sur FIFA Ticketing Hub 2026 !',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #F5A623;">Bienvenue ${firstName} !</h1>
        <p>Votre compte a été créé avec succès sur la plateforme de billetterie de la Coupe du Monde de la FIFA 2026.</p>
        <p>Vous pouvez dès à présent vous connecter et réserver vos places pour les matchs.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    `,
  };
  return getTransporter().sendMail(mailOptions);
}

async function sendOTPEmail(to, code) {
  const mailOptions = {
    from: '"FIFA Ticketing Hub 2026" <security@fifa.com>',
    to,
    subject: 'Votre code de validation OTP - FIFA Ticketing Hub',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; text-align: center;">
        <h1 style="color: #0A0A0F;">Connexion FIFA Ticketing Hub</h1>
        <p>Voici votre code de sécurité à usage unique (OTP) :</p>
        <div style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #F5A623; background-color: #f7f7f7; padding: 15px; margin: 20px auto; width: 200px; border-radius: 8px; border: 1px dashed #F5A623;">
          ${code}
        </div>
        <p>Ce code est valide pendant <strong>10 minutes</strong>. Ne le partagez jamais.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
      </div>
    `,
  };
  return getTransporter().sendMail(mailOptions);
}

async function sendOrderConfirmationEmail(to, orderId, pdfUrl) {
  const Ticket = require('../models/Ticket');
  const Order = require('../models/Order');

  let orderSummaryHtml = '';
  try {
    const tickets = await Ticket.find({ orderId })
      .populate({
        path: 'matchId',
        populate: { path: 'stadiumId' },
      })
      .populate('seatId');

    const order = await Order.findById(orderId);

    if (tickets && tickets.length > 0) {
      orderSummaryHtml = `
        <h3 style="color: #0A0A0F; margin-top: 20px;">Détail de votre commande :</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f7f7f7; text-align: left;">
              <th style="padding: 10px; border-bottom: 2px solid #eee;">Match</th>
              <th style="padding: 10px; border-bottom: 2px solid #eee;">Stade</th>
              <th style="padding: 10px; border-bottom: 2px solid #eee;">Tribune / Siège</th>
              <th style="padding: 10px; border-bottom: 2px solid #eee; text-align: right;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${tickets
              .map((t) => {
                const matchName = t.matchId ? `${t.matchId.teamA} vs ${t.matchId.teamB}` : 'Match Inconnu';
                const stadiumName = t.matchId?.stadiumId?.name || 'Stade Inconnu';
                const seatDetails = t.seatId ? `Cat ${t.seatId.category} - Sec ${t.seatId.section}, Rang ${t.seatId.row}, N° ${t.seatId.number}` : 'N/A';
                const price = t.seatId ? `${t.seatId.price} €` : '0 €';
                const matchDate = t.matchId?.date ? new Date(t.matchId.date).toLocaleString('fr-FR') : '';
                return `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      <strong>${matchName}</strong><br/>
                      <span style="font-size: 12px; color: #666;">${matchDate}</span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${stadiumName}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${seatDetails}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${price}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      `;

      if (order) {
        orderSummaryHtml += `
          <div style="text-align: right; margin-top: 15px; font-size: 16px; font-weight: bold;">
            Total payé : <span style="color: #00D97E;">${order.totalAmount} €</span>
          </div>
        `;
      }
    }
  } catch (err) {
    logger.error({ err, orderId }, '[email] Failed to generate order summary for email');
  }

  const mailOptions = {
    from: '"FIFA Ticketing Hub 2026" <tickets@fifa.com>',
    to,
    subject: 'Confirmation d\'achat - FIFA Ticketing Hub 2026',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #00D97E;">Merci pour votre achat !</h1>
        <p>Votre commande <strong>${orderId}</strong> a bien été confirmée.</p>
        
        ${orderSummaryHtml}

        <p>Vous pouvez télécharger votre billet en cliquant sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${pdfUrl}" style="background-color: #F5A623; color: black; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(245,166,35,0.3);">
            Télécharger mon Billet PDF
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Merci de faire confiance à FIFA Ticketing Hub 2026.</p>
      </div>
    `,
  };
  return getTransporter().sendMail(mailOptions);
}

async function sendMatchUpdateEmail(to, match, firstName) {
  const mailOptions = {
    from: '"FIFA Ticketing Hub 2026" <notifications@fifa.com>',
    to,
    subject: 'Mise à jour importante pour votre match - FIFA Ticketing Hub 2026',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #F5A623;">Mise à jour de match</h1>
        <p>Bonjour ${firstName || ''},</p>
        <p>Des modifications ont été apportées aux détails du match pour lequel vous avez acheté un billet :</p>
        <div style="background-color: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0; color: #0A0A0F;">${match.teamA} vs ${match.teamB}</h2>
          <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date(match.date).toLocaleString('fr-FR')}</p>
        </div>
        <p>Vos billets restent valides pour ce match. Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Merci de faire confiance à FIFA Ticketing Hub 2026.</p>
      </div>
    `,
  };
  return getTransporter().sendMail(mailOptions);
}

module.exports = {
  sendWelcomeEmail,
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendMatchUpdateEmail,
  getTransporter, // useful for testing
};
