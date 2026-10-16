import Sale from '../models/sale.model.js';

function parseDate(value, endOfDay = false) {
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return undefined;
  }

  return date;
}

export async function getReportSummary(req, res, next) {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to, true);

    if (from === undefined || to === undefined) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE',
          message: 'Dates must use the YYYY-MM-DD format.'
        }
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'The start date must not be after the end date.'
        }
      });
    }

    const match = { status: 'completed' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }

    const [summaryRows, dailySales, topProducts, paymentRows] = await Promise.all([
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            grossSalesPaisa: { $sum: '$totalPaisa' },
            transactions: { $sum: 1 }
          }
        }
      ]),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' }
            },
            salesPaisa: { $sum: '$totalPaisa' },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Sale.aggregate([
        { $match: match },
        { $unwind: '$items' },
        {
          $group: {
            _id: { name: '$items.name', sku: '$items.sku' },
            unitsSold: { $sum: '$items.quantity' },
            salesPaisa: { $sum: '$items.lineTotalPaisa' }
          }
        },
        { $sort: { unitsSold: -1, salesPaisa: -1, '_id.name': 1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            name: '$_id.name',
            sku: '$_id.sku',
            unitsSold: 1,
            salesPaisa: 1
          }
        }
      ]),
      Sale.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$paymentMethod',
            transactions: { $sum: 1 },
            salesPaisa: { $sum: '$totalPaisa' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const summary = summaryRows[0] || {
      grossSalesPaisa: 0,
      transactions: 0
    };

    return res.json({
      data: {
        filters: {
          from: from ? from.toISOString().slice(0, 10) : null,
          to: to ? to.toISOString().slice(0, 10) : null
        },
        summary: {
          grossSalesPaisa: summary.grossSalesPaisa,
          transactions: summary.transactions,
          averageSalePaisa: summary.transactions
            ? Math.round(summary.grossSalesPaisa / summary.transactions)
            : 0
        },
        dailySales: dailySales.map(day => ({
          date: day._id,
          salesPaisa: day.salesPaisa,
          transactions: day.transactions
        })),
        topProducts,
        paymentMethods: paymentRows.map(row => ({
          method: row._id,
          transactions: row.transactions,
          salesPaisa: row.salesPaisa
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}
