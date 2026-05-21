const PDFDocument = require('pdfkit');

/**
 * Génère un buffer PDF représentant le ticket de match.
 * @param {object} ticket - Le document Ticket Mongoose.
 * @param {object} match - Le document Match avec le stade peuplé.
 * @param {object} seat - Le document Seat.
 * @param {string} qrCodeDataUrl - Le QR Code encodé en base64.
 * @returns {Promise<Buffer>} - Le buffer PDF contenant le ticket généré.
 */
function generatePDF(ticket, match, seat, qrCodeDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => reject(err));

      // Style global Premium (Noir & Gold)
      // Arrière-plan sombre
      doc.rect(0, 0, 595.28, 841.89).fill('#0A0A0F');

      // Bordure double Gold
      doc.rect(20, 20, 555.28, 801.89).lineWidth(2).stroke('#F5A623');
      doc.rect(25, 25, 545.28, 791.89).lineWidth(0.5).stroke('#F5A623');

      // En-tête
      doc.fillColor('#F5A623')
         .fontSize(26)
         .text('FIFA WORLD CUP 2026', 50, 60, { align: 'center', characterSpacing: 1.5 });

      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .text('BILLET D\'ENTRÉE OFFICIEL', 50, 95, { align: 'center', characterSpacing: 2 });

      // Ligne de séparation
      doc.moveTo(50, 115).lineTo(545, 115).lineWidth(1).stroke('#F5A623');

      // Section Match
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('ÉVÉNEMENT / MATCH', 70, 140);
      doc.fillColor('#FFFFFF')
         .fontSize(22)
         .text(`${match.teamA} vs ${match.teamB}`, 70, 155, { stroke: false });

      // Section Date & Heure
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('DATE & HEURE', 70, 205);
      
      const dateOptions = { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' };
      const dateStr = new Date(match.date).toLocaleString('fr-FR', dateOptions);
      doc.fillColor('#FFFFFF')
         .fontSize(14)
         .text(`${dateStr} (UTC)`, 70, 220);

      // Section Stade
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('STADE', 70, 265);
      doc.fillColor('#FFFFFF')
         .fontSize(14)
         .text(`${match.stadiumId.name}, ${match.stadiumId.city} (${match.stadiumId.country})`, 70, 280);

      // Ligne horizontale
      doc.moveTo(50, 320).lineTo(545, 320).lineWidth(0.5).stroke('#F5A623');

      // Section Siège (Détails)
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('TRIBUNE / SECTION', 70, 340);
      doc.fillColor('#FFFFFF')
         .fontSize(16)
         .text(seat.section, 70, 355);

      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('RANG / SIÈGE', 240, 340);
      doc.fillColor('#FFFFFF')
         .fontSize(16)
         .text(`Rang ${seat.row}, Siège ${seat.number}`, 240, 355);

      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('CATÉGORIE', 420, 340);
      doc.fillColor('#FFFFFF')
         .fontSize(16)
         .text(`Catégorie ${seat.category}`, 420, 355);

      // Ligne horizontale
      doc.moveTo(50, 395).lineTo(545, 395).lineWidth(0.5).stroke('#F5A623');

      // Section Prix & ID Billet
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('PRIX D\'ACHAT', 70, 415);
      doc.fillColor('#FFFFFF')
         .fontSize(14)
         .text(`${seat.price} EUR`, 70, 430);

      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('ID UNIQUE DU BILLET', 240, 415);
      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .text(ticket.qrCode, 240, 430);

      // QR Code
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      doc.image(Buffer.from(base64Data, 'base64'), 197.64, 475, { width: 200, height: 200 });

      // Note de sécurité
      doc.fillColor('#888888')
         .fontSize(9)
         .text('Présentez ce QR Code sur votre mobile ou imprimé aux portillons du stade.', 50, 710, { align: 'center' });
      
      doc.text('Ce billet est nominatif, incessible et régi par les conditions générales de la FIFA.', 50, 725, { align: 'center' });

      // Signature officielle FIFA
      doc.fillColor('#F5A623')
         .fontSize(10)
         .text('FIFA WORLD CUP 2026 — COMITÉ D\'ORGANISATION', 50, 780, { align: 'center', characterSpacing: 1 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDF };
