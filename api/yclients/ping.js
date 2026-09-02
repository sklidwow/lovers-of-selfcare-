const { yclientsFetch, getCompanyId } = require('../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../lib/http');

// Sanity check: confirms the configured token + company id can actually
// authenticate against YClients. Hit this first after deploying.
module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  try {
    const companyId = getCompanyId();
    const data = await yclientsFetch(`/company/${companyId}`);
    res.status(200).json({ success: true, connected: true, company: data?.data ?? null });
  } catch (err) {
    sendError(res, err);
  }
};
