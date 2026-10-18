
import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';

const TEMPLATE = [
  'name,sku,category,price,barcode,description,lowStockThreshold',
  'Arabica Coffee,COFFEE-001,Beverages,450.00,890100000001,Premium coffee,5'
].join('\n');

export default function ProductsCsvImport({ onImported }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  function downloadTemplate() {
    const url = URL.createObjectURL(
      new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file || busy) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setResult({ error: 'Please select a .csv file.' });
      return;
    }

    if (file.size > 80 * 1024) {
      setResult({ error: 'The CSV file must not exceed 80 KB.' });
      return;
    }

    if (file.size === 0) {
      setResult({ error: 'The selected CSV file is empty.' });
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const csv = await file.text();
      const response = await fetch('/api/v1/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        credentials: 'same-origin',
        body: csv
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const details = body.error?.details;
        throw new Error(
          [
            body.error?.message || body.message || 'Import failed.',
            ...(Array.isArray(details) ? details : [])
          ].join('\n')
        );
      }

      setResult({
        success: `${body.data.imported} product(s) imported successfully.`
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onImported?.();
    } catch (error) {
      setResult({ error: error.message || 'Unable to import CSV.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="csv-import-panel" aria-labelledby="csv-import-title">
      <div className="csv-import-heading">
        <div className="csv-import-title">
          <FileSpreadsheet size={20} />
          <div>
            <h3 id="csv-import-title">Bulk product import</h3>
            <p>Import up to 1,000 products per batch. Maximum file size: 80 KB.</p>
          </div>
        </div>
        <button
          type="button"
          className="outline-button"
          onClick={downloadTemplate}
          disabled={busy}
        >
          <Download size={15} /> Download template
        </button>
      </div>

      <div className="csv-import-controls">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose product CSV file"
          disabled={busy}
          onChange={event => {
            setFile(event.target.files?.[0] || null);
            setResult(null);
          }}
        />
        <button
          type="button"
          className="primary-button"
          disabled={!file || busy}
          onClick={handleImport}
        >
          <Upload size={15} />
          {busy ? 'Importing…' : 'Import products'}
        </button>
        {file && (
          <button
            type="button"
            className="outline-button"
            disabled={busy}
            aria-label="Clear selected file"
            onClick={() => {
              setFile(null);
              setResult(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
          >
            <X size={15} /> Clear
          </button>
        )}
      </div>

      <p className="csv-import-help">
        Required columns: name, sku, category, price. Categories must already
        exist and be active. Prices use PKR with up to two decimal places.
        Imported products start with zero stock.
      </p>

      {result?.error && (
        <div className="csv-import-message csv-import-error" role="alert">
          <AlertTriangle size={17} />
          <div>{result.error.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}</div>
        </div>
      )}

      {result?.success && (
        <div className="csv-import-message csv-import-success" role="status">
          <CheckCircle size={17} />
          <p>{result.success}</p>
        </div>
      )}
    </section>
  );
}
