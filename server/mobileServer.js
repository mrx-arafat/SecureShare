/**
 * SecureShare Mobile Landing Server
 * Serves the mobile landing page for QR code links
 * Runs on localhost:6969
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 6969;

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the mobile directory
app.use(express.static(path.join(__dirname, '../mobile')));

// Serve vendor files from popup/js/vendor
app.use('/js/vendor', express.static(path.join(__dirname, '../popup/js/vendor')));

// Main route for secure links: /s/:sessionId
app.get('/s/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const encryptionKey = req.query.k;
  
  console.log(`📱 Mobile access request for session: ${sessionId}`);
  
  if (!sessionId || !encryptionKey) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SecureShare - Invalid Link</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1 class="error">Invalid SecureShare Link</h1>
        <p>This link is missing required parameters.</p>
        <p>Please scan the QR code again or request a new share link.</p>
      </body>
      </html>
    `);
  }
  
  // Redirect to mobile landing page with parameters
  const redirectUrl = `/index.html?s=${sessionId}&k=${encryptionKey}`;
  console.log(`🔄 Redirecting to: ${redirectUrl}`);
  res.redirect(redirectUrl);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SecureShare Mobile Server',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Fallback route for any other requests
app.get('*', (req, res) => {
  console.log(`📱 Fallback route accessed: ${req.path}`);
  res.sendFile(path.join(__dirname, '../mobile/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Mobile server error:', err);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SecureShare - Server Error</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #d32f2f; }
      </style>
    </head>
    <body>
      <h1 class="error">Server Error</h1>
      <p>Something went wrong processing your request.</p>
      <p>Please try scanning the QR code again.</p>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 SecureShare Mobile Server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile landing page: http://localhost:${PORT}/s/{sessionId}?k={key}`);
  console.log(`🔧 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📱 Mobile server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📱 Mobile server shutting down gracefully...');
  process.exit(0);
});
