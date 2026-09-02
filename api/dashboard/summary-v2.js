const { fetchAllRecords, getCompanyId, yclientsFetch } = require('../../lib/yclients');
const { requireTelegramUser } = require('../../lib/telegram');
const { businessDateRanges } = require('../../lib/dates');
const { sendError } = require('../../lib/http');

function recordRevenue(record) {
  if (typeof record.cost === 'number') return record.cost;
  if (Array.isArray(record.services)) {
    return record.services.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  }
  return 0;
}

function summarize(records) {
  return records.reduce(
    (acc, r) => {
      acc.bookings += 1;
      acc.revenue += recordRevenue(r);
      return acc;
    },
    { bookings: 0, revenue: 0 }
  );
}

// Single round trip for the whole mini app: today/week/month figures plus a
// staff leaderboard, all derived from one month-wide records fetch.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const user = requireTelegramUser(req, res);
  if (!user) return;

  try {
    const companyId = getCompanyId();
    const { today, weekStart, monthStart } = businessDateRanges();

    const [companyResponse, monthRecords] = await Promise.all([
      yclientsFetch(`/company/${companyId}`),
      fetchAllRecords(companyId, { start_date: monthStart, end_date: today }),
    ]);

    const todayRecords = monthRecords.filter((r) => (r.date || '').slice(0, 10) === today);
    const weekRecords = monthRecords.filter((r) => (r.date || '').slice(0, 10) >= weekStart);

    const byStaff = {};
    for (const record of monthRecords) {
      const name = record.staff?.name || `#${record.staff_id ?? '?'}`;
      byStaff[name] = byStaff[name] || { name, bookings: 0, revenue: 0 };
      byStaff[name].bookings += 1;
      byStaff[name].revenue += recordRevenue(record);
    }
    const topStaff = Object.values(byStaff)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      company: {
        title: companyResponse?.data?.title ?? null,
        city: companyResponse?.data?.city ?? null,
      },
      today: summarize(todayRecords),
      week: summarize(weekRecords),
      month: summarize(monthRecords),
      topStaff,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    sendError(res, err);
  }
};
