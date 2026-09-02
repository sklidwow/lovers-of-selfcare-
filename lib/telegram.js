const crypto = require('crypto');

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const pairs = [];
  for (const [key, value] of params.entries()) {
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();

  return {
    dataCheckString: pairs.join('\n'),
    hash,
    userRaw: params.get('user'),
    authDate: params.get('auth_date'),
  };
}

// Verifies the initData Telegram signs for every Mini App launch.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyTelegramUser(initData, botToken) {
  if (!initData) return null;

  const { dataCheckString, hash, userRaw, authDate } = parseInitData(initData);
  if (!hash || !dataCheckString) return null;

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computedHash !== hash) return null;

  // Reject stale init data so a leaked/cached link can't be replayed indefinitely.
  const authTimestampMs = Number(authDate) * 1000;
  if (!authTimestampMs || Date.now() - authTimestampMs > 24 * 60 * 60 * 1000) return null;

  try {
    return userRaw ? JSON.parse(userRaw) : null;
  } catch {
    return null;
  }
}

function requireTelegramUser(req, res) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    res.status(500).json({ success: false, error: 'TELEGRAM_BOT_TOKEN is not configured on the server' });
    return null;
  }

  const initData = req.headers['x-telegram-init-data'];
  const user = verifyTelegramUser(initData, botToken);
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid or missing Telegram init data' });
    return null;
  }

  const allowedIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedIds.length > 0 && !allowedIds.includes(String(user.id))) {
    res.status(403).json({ success: false, error: 'This Telegram account is not allowed to view this dashboard' });
    return null;
  }

  return user;
}

module.exports = { requireTelegramUser };
