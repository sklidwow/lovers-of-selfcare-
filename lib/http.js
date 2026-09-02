// Basic access control + CORS for the /api/yclients/* proxy endpoints.
// These endpoints expose business data (bookings, clients, revenue), so they
// must not be left open on a public site.

function applyCors(req, res) {
  const allowedOrigin = process.env.DASHBOARD_ALLOWED_ORIGIN;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
}

function requireApiKey(req, res) {
  const expected = process.env.DASHBOARD_API_KEY;
  if (!expected) {
    res.status(500).json({
      success: false,
      error: 'DASHBOARD_API_KEY is not configured on the server',
    });
    return false;
  }
  const provided = req.headers['x-api-key'];
  if (provided !== expected) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing or invalid X-Api-Key header' });
    return false;
  }
  return true;
}

function sendError(res, err) {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ success: false, error: err.message || 'Internal error' });
}

module.exports = { applyCors, requireApiKey, sendError };
