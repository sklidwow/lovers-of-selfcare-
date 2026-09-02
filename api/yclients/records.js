const { yclientsFetch, getCompanyId } = require('../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../lib/http');

// Raw bookings list. Query params: start_date, end_date (YYYY-MM-DD),
// staff_id, client_id, page, count. Requires YCLIENTS_USER_TOKEN to be set
// (a partner token alone is not enough to read bookings).
module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  try {
    const companyId = getCompanyId();
    const { start_date, end_date, staff_id, client_id, page, count } = req.query;
    const data = await yclientsFetch(`/records/${companyId}`, {
      params: { start_date, end_date, staff_id, client_id, page, count },
    });
    res.status(200).json({ success: true, records: data?.data ?? [], meta: data?.meta ?? null });
  } catch (err) {
    sendError(res, err);
  }
};
