import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, Search, PackageCheck, ReceiptText, RefreshCw, Printer, X } from 'lucide-react';
import './returns.css';

const money = paisa => new Intl.NumberFormat('en-PK', {
  style: 'currency', currency: 'PKR', minimumFractionDigits: 2
}).format((paisa || 0) / 100);

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error?.message || `Request failed (${response.status})`);
  return result.data;
}

export default function ReturnsPage() {
  const [receipt, setReceipt] = useState('');
  const [barcode, setBarcode] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeMatches, setBarcodeMatches] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  const [sale, setSale] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [recent, setRecent] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRecent = useCallback(async () => {
    try {
      const result = await api('/api/v1/returns?limit=8&page=1');
      setRecent(Array.isArray(result) ? result : result?.data || []);
    } catch (err) {
      setError(current => current || `Could not load recent returns: ${err.message}`);
    }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  async function findReceipt(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    setSale(null);
    setQuantities({});
    try {
      const result = await api(`/api/v1/returns/receipt/${encodeURIComponent(receipt.trim())}`);
      setSale(result);
    } catch (err) {
      setError(err.message || 'Receipt not found. Check the receipt number and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function findBarcode(event) {
    event.preventDefault();
    const value = barcode.trim();
    if (!value) return;

    setBarcodeLoading(true);
    setError('');
    setNotice('');
    setBarcodeMatches(null);
    setBarcodeProduct(null);

    try {
      const result = await api(
        `/api/v1/returns/barcode/${encodeURIComponent(value)}`
      );
      setBarcodeProduct(result.product);
      setBarcodeMatches(result.candidates || []);

      if (!result.candidates?.length) {
        setNotice('No unreturned sales were found for this product barcode.');
      }
    } catch (err) {
      setError(err.message || 'Barcode lookup failed.');
    } finally {
      setBarcodeLoading(false);
    }
  }

  async function useBarcodeReceipt(receiptNumber) {
    setReceipt(receiptNumber);
    setLoading(true);
    setError('');
    setNotice('');
    setSale(null);
    setQuantities({});

    try {
      const result = await api(
        `/api/v1/returns/receipt/${encodeURIComponent(receiptNumber)}`
      );
      setSale(result);
      setBarcodeMatches(null);
    } catch (err) {
      setError(err.message || 'Could not load the original receipt.');
    } finally {
      setLoading(false);
    }
  }

  function setQuantity(productId, value, maximum) {
    const parsed = value === '' ? '' : Math.max(0, Math.min(maximum, Number(value) || 0));
    setQuantities(current => ({ ...current, [productId]: parsed }));
  }

  const selectedItems = (sale?.items || []).map(item => ({
    productId: typeof item.product === 'object' ? item.product._id : item.product,
    quantity: Number(quantities[typeof item.product === 'object' ? item.product._id : item.product] || 0),
    unitPricePaisa: item.unitPricePaisa
  })).filter(item => item.quantity > 0);

  const refundPaisa = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPricePaisa, 0);
  const canSubmit = !!sale && selectedItems.length > 0 && reason.trim().length > 0 && !sale.fullyReturned;

  async function submitReturn(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/api/v1/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptNumber: sale.receiptNumber, items: selectedItems.map(({ productId, quantity }) => ({ productId, quantity })), reason: reason.trim() })
      });
      setSelectedReturn(result);
      setNotice(`Return recorded successfully. Refund recorded: ${money(result.totalRefundPaisa)}. No real payment was processed.`);
      setReason('');
      setQuantities({});
      const updated = await api(`/api/v1/returns/receipt/${encodeURIComponent(sale.receiptNumber)}`);
      setSale(updated);
      await loadRecent();
    } catch (err) {
      setError(err.message || 'Return could not be recorded.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="returns-page">
      <div className="returns-heading">
        <div>
          <p className="returns-eyebrow">SALES OPERATIONS</p>
          <h1>Returns management</h1>
          <p>Find a receipt, select items to return, and record the refund.</p>
        </div>
        <div className="returns-heading-icon"><RotateCcw size={25} /></div>
      </div>

      {error && <div className="returns-alert returns-alert-error" role="alert">{error}</div>}
      {notice && <div className="returns-alert returns-alert-success" role="status">{notice}</div>}

      <div className="returns-workspace">
        <section className="returns-panel">
          <div className="returns-panel-title"><ReceiptText size={19} /><div><h2>Find original sale</h2><p>Enter the receipt number printed on the sale.</p></div></div>
          <form className="returns-search" onSubmit={findReceipt}>
            <input value={receipt} onChange={e => setReceipt(e.target.value)} placeholder="e.g. HZ-20261014-029E0B28" required aria-label="Receipt number" />
            <button type="submit" disabled={loading}>{loading ? <RefreshCw size={17} className="returns-spin" /> : <Search size={17} />}{loading ? 'Searching' : 'Find receipt'}</button>
          </form>

          <form className="returns-search returns-barcode-search" onSubmit={findBarcode}>
            <input
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan product barcode or enter it"
              aria-label="Product barcode"
              autoComplete="off"
              required
            />
            <button type="submit" disabled={barcodeLoading}>
              {barcodeLoading
                ? <RefreshCw size={17} className="returns-spin" />
                : <Search size={17} />}
              {barcodeLoading ? 'Searching' : 'Find sales by barcode'}
            </button>
          </form>

          {barcodeProduct && barcodeMatches !== null && (
            <div className="returns-barcode-results" role="status">
              <h3>{barcodeProduct.name} <span>({barcodeProduct.sku})</span></h3>
              <p>Barcode: {barcodeProduct.barcode}</p>
              {barcodeMatches.length === 0
                ? <p>No matching sales have any quantity left to return.</p>
                : barcodeMatches.map(candidate => (
                  <div className="returns-barcode-candidate" key={String(candidate.saleId)}>
                    <div>
                      <strong>{candidate.receiptNumber}</strong>
                      <span>
                        {candidate.createdAt
                          ? new Date(candidate.createdAt).toLocaleString('en-PK')
                          : 'Sale date unavailable'}
                      </span>
                      <span>
                        Returnable: {candidate.product.returnableQuantity}
                        {' '}of {candidate.product.soldQuantity}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => useBarcodeReceipt(candidate.receiptNumber)}
                    >
                      Use receipt
                    </button>
                  </div>
                ))}
            </div>
          )}

          {!sale && <div className="returns-empty"><div><Search size={24} /></div><strong>Receipt details will appear here</strong><span>Search a completed sale to see its returnable items.</span></div>}

          {sale && <>
            <div className="returns-sale-meta">
              <div><span>Receipt number</span><strong>{sale.receiptNumber}</strong></div>
              <div><span>Sale total</span><strong>{money(sale.totalPaisa)}</strong></div>
              <div><span>Payment method</span><strong>{String(sale.paymentMethod || '—').toUpperCase()}</strong></div>
              <div><span>Sale date</span><strong>{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-PK') : '—'}</strong></div>
            </div>
            <form onSubmit={submitReturn}>
              <div className="returns-items-heading"><h3>Purchased items</h3><span>{sale.fullyReturned ? 'Fully returned' : 'Select quantities'}</span></div>
              <div className="returns-table-wrap">
                <table className="returns-table">
                  <thead><tr><th>Product</th><th>Sold</th><th>Returned</th><th>Remaining</th><th>Return qty</th></tr></thead>
                  <tbody>{(sale.items || []).map((item, index) => {
                    const id = typeof item.product === 'object' ? item.product._id : item.product;
                    const max = item.returnableQuantity ?? Math.max(0, item.quantity - (item.returnedQuantity || 0));
                    return <tr key={`${id}-${index}`}>
                      <td><strong>{item.name}</strong><span>{item.sku}</span></td>
                      <td>{item.quantity}</td><td>{item.returnedQuantity || 0}</td><td>{max}</td>
                      <td><input aria-label={`Return quantity for ${item.name}`} type="number" min="0" max={max} step="1" disabled={max === 0 || sale.fullyReturned} value={quantities[id] ?? 0} onChange={e => setQuantity(id, e.target.value, max)} /></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
              <label className="returns-reason">Reason for return
                <textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={300} rows={3} placeholder="Describe why the customer is returning these items…" required disabled={sale.fullyReturned} />
                <span>{reason.length}/300 characters</span>
              </label>
              <div className="returns-submit-row">
                <div><span>Refund to record</span><strong>{money(refundPaisa)}</strong><small>Demo record only · no payment is processed</small></div>
                <button type="submit" disabled={!canSubmit || submitting}>{submitting ? 'Recording return…' : <><PackageCheck size={17} /> Record return</>}</button>
              </div>
            </form>
          </>}
        </section>

        <aside className="returns-side-panel">
          <div className="returns-panel-title"><RotateCcw size={19} /><div><h2>Return guidelines</h2><p>Keep every stock change traceable.</p></div></div>
          <ul className="returns-guidelines">
            <li><span>01</span><div><strong>Use the original receipt</strong><p>Returns are linked to a completed sale.</p></div></li>
            <li><span>02</span><div><strong>Return only eligible quantities</strong><p>Previously returned units cannot be returned again.</p></div></li>
            <li><span>03</span><div><strong>Stock is restored automatically</strong><p>Successful returns create an inventory movement.</p></div></li>
          </ul>
          <div className="returns-demo-note">Demo mode: refunds are recorded for tracking. Cash or card payments are not actually refunded.</div>
        </aside>
      </div>

      {selectedReturn && (
        <div className="returns-print-overlay">
          <section className="returns-print-dialog" role="dialog" aria-modal="true" aria-label="Return confirmation">
            <div className="returns-print-actions">
              <button type="button" onClick={() => window.print()}><Printer size={16} /> Print return receipt</button>
              <button type="button" onClick={() => setSelectedReturn(null)} aria-label="Close return confirmation"><X size={17} /> Close</button>
            </div>
            <article className="printable-return-receipt">
              <h2>RETURN CONFIRMATION</h2>
              <p className="return-receipt-subtitle">HZ Retail POS</p>
              <hr />
              <p><strong>Return reference:</strong> {String(selectedReturn._id || '—')}</p>
              <p><strong>Original receipt:</strong> {selectedReturn.receiptNumber}</p>
              <p><strong>Date:</strong> {selectedReturn.createdAt ? new Date(selectedReturn.createdAt).toLocaleString('en-PK') : new Date().toLocaleString('en-PK')}</p>
              <hr />
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Refund</th></tr></thead>
                <tbody>{(selectedReturn.items || []).map((line, index) => (
                  <tr key={`${line.sku || line.name}-${index}`}>
                    <td>{line.name}<small>{line.sku}</small></td>
                    <td>{line.quantity}</td>
                    <td>{money(line.refundPaisa ?? line.unitPricePaisa * line.quantity)}</td>
                  </tr>
                ))}</tbody>
              </table>
              <hr />
              <p><strong>Reason:</strong> {selectedReturn.reason || '—'}</p>
              <p className="return-receipt-total"><strong>Refund recorded: {money(selectedReturn.totalRefundPaisa)}</strong></p>
              <p className="return-receipt-notice">DEMO RECORD ONLY — NO PAYMENT WAS PROCESSED.</p>
              <p className="return-receipt-subtitle">Please retain this confirmation for your records.</p>
            </article>
          </section>
        </div>
      )}

      <section className="returns-panel returns-recent">
        <div className="returns-recent-heading"><div><h2>Recent returns</h2><p>Latest recorded return activity</p></div><button type="button" onClick={loadRecent}><RefreshCw size={15} /> Refresh</button></div>
        {recent.length === 0 ? <div className="returns-recent-empty">No returns recorded yet.</div> : <div className="returns-table-wrap"><table className="returns-table">
          <thead><tr><th>Receipt</th><th>Items</th><th>Refund recorded</th><th>Reason</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>{recent.map(item => <tr key={item._id}><td><strong>{item.receiptNumber}</strong></td><td>{(item.items || []).reduce((sum, line) => sum + line.quantity, 0)}</td><td><strong>{money(item.totalRefundPaisa)}</strong></td><td>{item.reason}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-PK') : '—'}</td><td><button type="button" className="returns-view-button" onClick={() => setSelectedReturn(item)}><Printer size={14} /> View / Print</button></td></tr>)}</tbody>
        </table></div>}
      </section>
    </section>
  );
}
