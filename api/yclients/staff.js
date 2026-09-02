const { yclientsFetch, getCompanyId } = require('../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../lib/http');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  try {
    const companyId = getCompanyId();
    const data = await yclientsFetch(`/company/${companyId}/staff`);
    res.status(200).json({ success: true, staff: data?.data ?? [] });
  } catch (err) {
    sendError(res, err);
  }
};
