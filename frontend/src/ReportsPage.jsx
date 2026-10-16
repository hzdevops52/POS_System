import { useEffect, useState } from 'react';
import {
  ChartNoAxesCombined,
  ShoppingBag,
  ReceiptText,
  CreditCard,
  RefreshCw,
  CalendarDays,
  AlertTriangle,
  Download,
  RotateCcw,
  TrendingUp,
  Package
} from 'lucide-react';
import './reports.css';

const money = value =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((Number(value) || 0) / 100);

const number = value => new Intl.NumberFormat('en-PK').format(Number(value) || 0);

function formatDay(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  async function loadReport(dateFrom = from, dateTo = to) {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError('The start date must not be after the end date.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const response = await fetch(
        `/api/v1/reports/summary?${params.toString()}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || 'Unable to load reports.'
        );
      }

      setReport(result.data);
    } catch (err) {
      setError(err.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [requestKey]);

  const dailySales = report?.dailySales || [];
  const topProducts = report?.topProducts || [];
  const paymentMethods = report?.paymentMethods || [];

  const maxDaily = Math.max(
    1,
    ...dailySales.map(day => Number(day.salesPaisa) || 0)
  );
  const maxProduct = Math.max(
    1,
    ...topProducts.map(product => Number(product.salesPaisa) || 0)
  );

  function applyFilters() {
    loadReport(from, to);
  }

  function resetFilters() {
    setFrom('');
    setTo('');
    loadReport('', '');
  }

  function exportCsv() {
    if (!report) return;

    const rows = [
      ['Report', 'Sales summary'],
      ['From', report.filters?.from || 'All time'],
      ['To', report.filters?.to || 'All time'],
      [],
      ['Metric', 'Value'],
      ['Gross sales (PKR)', (report.summary.grossSalesPaisa / 100).toFixed(2)],
      ['Completed transactions', report.summary.transactions],
      ['Average sale (PKR)', (report.summary.averageSalePaisa / 100).toFixed(2)],
      [],
      ['Daily sales'],
      ['Date', 'Sales (PKR)', 'Transactions'],
      ...dailySales.map(day => [
        day.date,
        (day.salesPaisa / 100).toFixed(2),
        day.transactions
      ]),
      [],
      ['Top products'],
      ['Product', 'SKU', 'Units sold', 'Sales (PKR)'],
      ...topProducts.map(product => [
        product.name,
        product.sku,
        product.unitsSold,
        (product.salesPaisa / 100).toFixed(2)
      ]),
      [],
      ['Payment methods'],
      ['Method', 'Transactions', 'Sales (PKR)'],
      ...paymentMethods.map(method => [
        method.method || 'Unknown',
        method.transactions,
        (method.salesPaisa / 100).toFixed(2)
      ])
    ];

    const csv = rows.map(row =>
      row.map(value => {
        const safe = String(value ?? '');
        return `"${safe.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hz-retail-sales-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const summary = report?.summary || {
    grossSalesPaisa: 0,
    transactions: 0,
    averageSalePaisa: 0
  };

  return (
    <div className="reports-content">
      <div className="reports-header">
        <div>
          <p className="eyebrow">BUSINESS INTELLIGENCE</p>
          <h2>Sales reports</h2>
          <p className="muted">
            Understand sales performance, popular products and payment activity.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={exportCsv}
          disabled={loading || !report}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <section className="reports-filter panel" aria-label="Report date filters">
        <div className="reports-filter-title">
          <span className="reports-filter-icon"><CalendarDays size={18} /></span>
          <div>
            <strong>Reporting period</strong>
            <p className="muted">Choose a date range to update your figures.</p>
          </div>
        </div>

        <div className="reports-filter-controls">
          <label>
            <span>From date</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={event => setFrom(event.target.value)}
            />
          </label>
          <label>
            <span>To date</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={event => setTo(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={applyFilters}
            disabled={loading}
          >
            <CalendarDays size={15} /> Apply filters
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={resetFilters}
            disabled={loading && !from && !to}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      {error && (
        <div className="reports-error" role="alert">
          <AlertTriangle size={19} />
          <div>
            <strong>Reports could not be loaded</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="outline-button"
            onClick={() => setRequestKey(value => value + 1)}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="reports-section-heading">
        <div>
          <h3>Performance overview</h3>
          <p className="muted">
            {report?.filters?.from || report?.filters?.to
              ? `${report.filters.from || 'Beginning'} — ${report.filters.to || 'Today'}`
              : 'All recorded dates'}
          </p>
        </div>
        <button
          type="button"
          className="date-filter"
          onClick={() => setRequestKey(value => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'reports-spinning' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="reports-metrics">
        <article className="metric-card">
          <div className="metric-top">
            <span>Gross sales</span>
            <span className="metric-icon green"><TrendingUp size={19} /></span>
          </div>
          <div className="metric-value">
            {loading && !report ? '—' : money(summary.grossSalesPaisa)}
          </div>
          <div className="metric-foot">Completed sales in selected period</div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Transactions</span>
            <span className="metric-icon sage"><ReceiptText size={19} /></span>
          </div>
          <div className="metric-value">
            {loading && !report ? '—' : number(summary.transactions)}
          </div>
          <div className="metric-foot">Completed transactions</div>
        </article>

        <article className="metric-card">
          <div className="metric-top">
            <span>Average sale</span>
            <span className="metric-icon amber"><ShoppingBag size={19} /></span>
          </div>
          <div className="metric-value">
            {loading && !report ? '—' : money(summary.averageSalePaisa)}
          </div>
          <div className="metric-foot">Average value per transaction</div>
        </article>
      </div>

      <section className="panel reports-chart-panel">
        <div className="panel-heading">
          <div>
            <h3>Daily sales trend</h3>
            <p className="muted">Gross sales and transaction activity by date</p>
          </div>
          <ChartNoAxesCombined size={19} className="heading-icon" />
        </div>

        {loading && !report ? (
          <div className="reports-empty"><RefreshCw size={22} className="reports-spinning" /><strong>Loading sales data…</strong></div>
        ) : dailySales.length ? (
          <div className="reports-chart-scroll">
            <div className="reports-chart">
              {dailySales.map(day => (
                <div className="reports-chart-column" key={day.date}>
                  <span className="reports-bar-value">{money(day.salesPaisa)}</span>
                  <div
                    className="reports-bar-track"
                    title={`${day.date}: ${money(day.salesPaisa)} · ${number(day.transactions)} transactions`}
                  >
                    <div
                      className="reports-bar"
                      style={{
                        height: `${Math.max(0, (Number(day.salesPaisa) || 0) / maxDaily * 100)}%`
                      }}
                    />
                  </div>
                  <span className="reports-chart-date">{formatDay(day.date)}</span>
                  <span className="reports-chart-count">{number(day.transactions)} sales</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="reports-empty">
            <ChartNoAxesCombined size={25} />
            <strong>No sales activity for this period</strong>
            <p>Try another date range or record a completed sale to see the trend.</p>
          </div>
        )}
      </section>

      <div className="reports-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Top-selling products</h3>
              <p className="muted">Ranked by units sold</p>
            </div>
            <Package size={19} className="heading-icon" />
          </div>

          {loading && !report ? (
            <div className="reports-empty"><RefreshCw size={21} className="reports-spinning" /><strong>Loading products…</strong></div>
          ) : topProducts.length ? (
            <div className="reports-product-list">
              {topProducts.map((product, index) => (
                <div className="reports-product" key={`${product.sku}-${product.name}`}>
                  <div className="reports-product-rank">{index + 1}</div>
                  <div className="reports-product-main">
                    <div className="reports-product-heading">
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.sku || 'No SKU'} · {number(product.unitsSold)} units</span>
                      </div>
                      <strong className="reports-product-sales">{money(product.salesPaisa)}</strong>
                    </div>
                    <div className="reports-product-track">
                      <div
                        className="reports-product-bar"
                        style={{
                          width: `${Math.max(0, (Number(product.salesPaisa) || 0) / maxProduct * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="reports-empty">
              <ShoppingBag size={23} />
              <strong>No product sales yet</strong>
              <p>Product rankings will appear after completed sales.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Payment methods</h3>
              <p className="muted">Sales grouped by payment type</p>
            </div>
            <CreditCard size={19} className="heading-icon" />
          </div>

          {loading && !report ? (
            <div className="reports-empty"><RefreshCw size={21} className="reports-spinning" /><strong>Loading payments…</strong></div>
          ) : paymentMethods.length ? (
            <div className="reports-payment-list">
              {paymentMethods.map(method => {
                const share = summary.grossSalesPaisa > 0
                  ? (Number(method.salesPaisa) || 0) / summary.grossSalesPaisa * 100
                  : 0;

                return (
                  <div className="reports-payment" key={method.method || 'unknown'}>
                    <div className="reports-payment-heading">
                      <span className="reports-payment-icon"><CreditCard size={16} /></span>
                      <div className="reports-payment-name">
                        <strong>{String(method.method || 'Unknown').replace(/_/g, ' ').toUpperCase()}</strong>
                        <span>{number(method.transactions)} transactions</span>
                      </div>
                      <strong>{money(method.salesPaisa)}</strong>
                    </div>
                    <div className="reports-product-track">
                      <div
                        className="reports-payment-bar"
                        style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                      />
                    </div>
                    <div className="reports-payment-share">{share.toFixed(1)}% of gross sales</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="reports-empty">
              <CreditCard size={23} />
              <strong>No payment data available</strong>
              <p>Payment breakdowns will appear after completed sales.</p>
            </div>
          )}
        </section>
      </div>

      <p className="reports-disclaimer">
        Figures reflect completed sales returned by the reporting API. Gross sales are not adjusted for product returns.
        Sales and average values are displayed in PKR.
      </p>
    </div>
  );
}
