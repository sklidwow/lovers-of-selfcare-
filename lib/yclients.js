const YCLIENTS_BASE_URL = 'https://api.yclients.com/api/v1';

function getAuthHeader() {
  const partnerToken = process.env.YCLIENTS_PARTNER_TOKEN;
  if (!partnerToken) {
    throw new Error('YCLIENTS_PARTNER_TOKEN is not configured on the server');
  }
  const userToken = process.env.YCLIENTS_USER_TOKEN;
  return userToken ? `Bearer ${partnerToken}, User ${userToken}` : `Bearer ${partnerToken}`;
}

function getCompanyId() {
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  if (!companyId) {
    throw new Error('YCLIENTS_COMPANY_ID is not configured on the server');
  }
  return companyId;
}

async function yclientsFetch(path, { method = 'GET', params, body } = {}) {
  const url = new URL(`${YCLIENTS_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // YClients occasionally returns non-JSON error bodies (e.g. gateway errors).
  }

  if (!response.ok || (data && data.success === false)) {
    const message = data?.meta?.message || `YClients API error (HTTP ${response.status})`;
    const err = new Error(message);
    err.status = response.ok ? 502 : response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Records endpoint is paginated; walk pages until a short page tells us we're done.
async function fetchAllRecords(companyId, params = {}, { maxPages = 10, pageSize = 100 } = {}) {
  const all = [];
  let page = 1;
  while (page <= maxPages) {
    const data = await yclientsFetch(`/records/${companyId}`, {
      params: { ...params, page, count: pageSize },
    });
    const batch = data?.data || [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return all;
}

module.exports = { yclientsFetch, fetchAllRecords, getCompanyId };
