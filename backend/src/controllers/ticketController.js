const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const ticketService = require('../services/ticketService');
const { generateQR } = require('../utils/qrGenerator');

/**
 * Contrôleur pour récupérer et streamer le PDF du ticket.
 */
async function getTicketPdf(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const ticketId = req.params.id;

    const ticket = await ticketService.getTicketById(ticketId, userId, role);
    const fileName = `ticket-${ticket._id}.pdf`;

    // Si l'URL pointe vers localhost (fallback local), streamer le fichier local
    if (ticket.pdfUrl && (ticket.pdfUrl.startsWith('http://localhost') || ticket.pdfUrl.startsWith('http://127.0.0.1'))) {
      const filePath = path.join(__dirname, '../../public/tickets', fileName);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Sinon, streamer depuis l'URL distante (Azure Blob)
    if (ticket.pdfUrl) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      const client = ticket.pdfUrl.startsWith('https') ? https : http;
      client.get(ticket.pdfUrl, (response) => {
        if (response.statusCode === 200) {
          response.pipe(res);
        } else {
          res.status(response.statusCode).json({
            error: { code: 'PDF_STREAM_ERROR', message: 'Failed to stream PDF from storage', status: response.statusCode }
          });
        }
      }).on('error', (err) => {
        next(err);
      });
    } else {
      res.status(404).json({
        error: { code: 'PDF_NOT_FOUND', message: 'PDF non disponible pour ce ticket', status: 404 }
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Contrôleur pour récupérer le QR Code du ticket sous forme d'image Base64.
 */
async function getTicketQr(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const ticketId = req.params.id;

    const ticket = await ticketService.getTicketById(ticketId, userId, role);
    const qrCodeDataUrl = await generateQR(ticket.qrCode);

    res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTicketPdf,
  getTicketQr,
};
