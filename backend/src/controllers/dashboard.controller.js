import Sale from '../models/sale.model.js';

const TIME_ZONE = 'Asia/Karachi';

function getPakistanDayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const date = `${values.year}-${values.month}-${values.day}`;

  // Pakistan uses UTC+05:00 year-round.
  const start = new Date(`${date}T00:00:00+05:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

export async function getDashboardSummary(_req, res, next) {
  try {
    const { start, end } = getPakistanDayBounds();

    const [summary] = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: null,
          totalPaisa: { $sum: '$totalPaisa' },
          transactions: { $sum: 1 },
          hourlySales: {
            $push: {
              hour: {
                $hour: { date: '$createdAt', timezone: TIME_ZONE }
              },
              totalPaisa: '$totalPaisa'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalPaisa: 1,
          transactions: 1,
          hourlySales: 1
        }
      }
    ]);

    const buckets = Array.from({ length: 12 }, (_, index) => ({
      startHour: index * 2,
      endHour: index * 2 + 2,
      totalPaisa: 0,
      transactions: 0
    }));

    for (const sale of summary?.hourlySales ?? []) {
      const index = Math.floor(sale.hour / 2);
      buckets[index].totalPaisa += sale.totalPaisa;
      buckets[index].transactions += 1;
    }

    const totalPaisa = summary?.totalPaisa ?? 0;
    const transactions = summary?.transactions ?? 0;

    return res.json({
      data: {
        date: start.toLocaleDateString('en-CA', { timeZone: TIME_ZONE }),
        timeZone: TIME_ZONE,
        totalPaisa,
        transactions,
        averageSalePaisa: transactions
          ? Math.round(totalPaisa / transactions)
          : 0,
        hourlySales: buckets
      }
    });
  } catch (error) {
    next(error);
  }
}
