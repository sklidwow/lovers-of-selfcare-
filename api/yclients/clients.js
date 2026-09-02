const { yclientsFetch, getCompanyId } = require('../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../lib/http');

// Client list/search. Query params: page, count, name/phone (free-text
// filters, passed straight through to YClients search body). Requires
// YCLIENTS_USER_TOKEN.
module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  try {
    const companyId = getCompanyId();
    const { page, count, name, phone } = req.query;
    const data = await yclientsFetch(`/company/${companyId}/clients/search`, {
      method: 'POST',
      body: {
        page: page ? Number(page) : 1,
        page_size: count ? Number(count) : 100,
        fields: ['id', 'name', 'phone', 'email', 'visits_count', 'spent', 'last_visit_date'],
        filters: [
          ...(name ? [{ type: 'quick_search', state: { value: name } }] : []),
          ...(phone ? [{ type: 'quick_search', state: { value: phone } }] : []),
        ],
      },
    });
    res.status(200).json({ success: true, clients: data?.data ?? [], meta: data?.meta ?? null });
  } catch (err) {
    sendError(res, err);
  }
};
