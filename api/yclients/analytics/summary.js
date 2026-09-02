const { fetchAllRecords, getCompanyId } = require('../../../lib/yclients');
const { applyCors, requireApiKey, sendError } = require('../../../lib/http');

function recordRevenue(record) {
  if (typeof record.cost === 'number') return record.cost;
  if (Array.isArray(record.services)) {
    return record.services.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  }
  return 0;
}

// Ready-made numbers for a dashboard: totals + breakdown by day/staff/status
// for a date range. Query params: start_date, end_date (YYYY-MM-DD, required).
module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireApiKey(req, res)) return;

  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, error: 'start_date and end_date (YYYY-MM-DD) are required' });
  }

  try {
    const companyId = getCompanyId();
    const records = await fetchAllRecords(companyId, { start_date, end_date });

    const byDate = {};
    const byStaff = {};
    const byStatus = { confirmed: 0, cancelled: 0, pending: 0 };
    let totalRevenue = 0;

    for (const record of records) {
      const date = (record.date || '').slice(0, 10);
      const revenue = recordRevenue(record);
      totalRevenue += revenue;

      byDate[date] = byDate[date] || { bookings: 0, revenue: 0 };
      byDate[date].bookings += 1;
      byDate[date].revenue += revenue;

      const staffName = record.staff?.name || `staff_${record.staff_id ?? 'unknown'}`;
      byStaff[staffName] = byStaff[staffName] || { bookings: 0, revenue: 0 };
      byStaff[staffName].bookings += 1;
      byStaff[staffName].revenue += revenue;

      if (record.attendance === 1) byStatus.confirmed += 1;
      else if (record.attendance === -1) byStatus.cancelled += 1;
      else byStatus.pending += 1;
    }

    res.status(200).json({
      success: true,
      range: { start_date, end_date },
      totals: {
        bookings: records.length,
        revenue: totalRevenue,
      },
      byStatus,
      byDate,
      byStaff,
    });
  } catch (err) {
    sendError(res, err);
  }
};
