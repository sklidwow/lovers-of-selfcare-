const { yclientsFetch, getCompanyId } = require('../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../lib/http');

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  try {
    const companyId = getCompanyId();
    const { category_id, staff_id } = req.query;
    const data = await yclientsFetch(`/company/${companyId}/services`, {
      params: { category_id, staff_id },
    });
    res.status(200).json({ success: true, services: data?.data ?? [] });
  } catch (err) {
    sendError(res, err);
  }
};
