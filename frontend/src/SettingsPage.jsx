import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Save, Settings2, ShieldCheck, Store } from 'lucide-react';
import './settings.css';

const defaults = {
  storeName: 'HZ Retail',
  address: '',
  phone: '',
  email: '',
  currency: 'PKR',
  receiptFooter: 'Thank you for shopping with us!',
  showAddressOnReceipt: true,
  showContactOnReceipt: true,
  showFooterOnReceipt: true,
  taxEnabled: false,
  taxRate: 0
};

export default function SettingsPage({ currentUser, onSaved }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await fetch('/api/v1/settings', {
          credentials: 'same-origin'
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error?.message || 'Could not load store settings.');
        }
        if (mounted) setSettings({ ...defaults, ...result.data });
      } catch (err) {
        if (mounted) setError(err.message || 'Could not load store settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => { mounted = false; };
  }, []);

  function update(field, value) {
    setSettings(previous => ({ ...previous, [field]: value }));
    setNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        storeName: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        receiptFooter: settings.receiptFooter,
        showAddressOnReceipt: settings.showAddressOnReceipt,
        showContactOnReceipt: settings.showContactOnReceipt,
        showFooterOnReceipt: settings.showFooterOnReceipt,
        taxEnabled: settings.taxEnabled,
        taxRate: Number(settings.taxRate)
      };

      const response = await fetch('/api/v1/settings', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message || 'Could not save settings.');
      }

      setSettings({ ...defaults, ...result.data });
      onSaved?.(result.data);
      setNotice('Your store settings have been saved.');
    } catch (err) {
      setError(err.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="settings-state" role="status">
      <LoaderCircle size={20} className="settings-spinner" /> Loading store settings…
    </div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION / CONFIGURATION</p>
          <h2>Store settings</h2>
          <p className="settings-intro">Manage your store identity, receipt preferences and tax configuration.</p>
        </div>
        <div className="settings-heading-icon"><Settings2 size={23} /></div>
      </div>

      {!isAdmin && <div className="settings-banner">
        <ShieldCheck size={18} />
        <span>You have read-only access. Contact an administrator to change these settings.</span>
      </div>}

      {error && <div className="settings-alert settings-alert-error" role="alert">{error}</div>}
      {notice && <div className="settings-alert settings-alert-success" role="status">
        <CheckCircle2 size={17} /> {notice}
      </div>}

      <form onSubmit={handleSubmit}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><Store size={19} /></div>
            <div><h3>Store identity</h3><p>Business details used to identify your store.</p></div>
          </div>
          <div className="settings-fields">
            <label className="settings-field settings-field-wide">
              <span>Store name <i>*</i></span>
              <input required minLength={2} maxLength={100} value={settings.storeName}
                disabled={!isAdmin} onChange={e => update('storeName', e.target.value)} />
            </label>
            <label className="settings-field settings-field-wide">
              <span>Store address</span>
              <textarea rows={2} maxLength={300} value={settings.address}
                disabled={!isAdmin} onChange={e => update('address', e.target.value)} />
            </label>
            <label className="settings-field">
              <span>Contact phone</span>
              <input maxLength={40} value={settings.phone} disabled={!isAdmin}
                onChange={e => update('phone', e.target.value)} />
            </label>
            <label className="settings-field">
              <span>Contact email</span>
              <input type="email" maxLength={254} value={settings.email} disabled={!isAdmin}
                onChange={e => update('email', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><Settings2 size={19} /></div>
            <div><h3>Regional preferences</h3><p>Currency supported by the current POS checkout.</p></div>
          </div>
          <div className="settings-fields">
            <label className="settings-field">
              <span>Store currency</span>
              <select value={settings.currency} disabled={!isAdmin}
                onChange={e => update('currency', e.target.value)}>
                <option value="PKR">PKR — Pakistani Rupee</option>
              </select>
            </label>
            <div className="settings-info">
              <strong>Currency support</strong>
              <span>PKR is currently supported. Other currencies require checkout and reporting integration.</span>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><CheckCircle2 size={19} /></div>
            <div><h3>Receipt preferences</h3><p>Choose which store details should appear on receipts.</p></div>
          </div>
          <div className="settings-options">
            <label className="settings-toggle">
              <span><strong>Show store address</strong><small>Include the business address on receipts.</small></span>
              <input type="checkbox" checked={settings.showAddressOnReceipt} disabled={!isAdmin}
                onChange={e => update('showAddressOnReceipt', e.target.checked)} />
            </label>
            <label className="settings-toggle">
              <span><strong>Show contact details</strong><small>Include the store phone and email on receipts.</small></span>
              <input type="checkbox" checked={settings.showContactOnReceipt} disabled={!isAdmin}
                onChange={e => update('showContactOnReceipt', e.target.checked)} />
            </label>
            <label className="settings-toggle">
              <span><strong>Show receipt footer</strong><small>Include a closing message on receipts.</small></span>
              <input type="checkbox" checked={settings.showFooterOnReceipt} disabled={!isAdmin}
                onChange={e => update('showFooterOnReceipt', e.target.checked)} />
            </label>
          </div>
          <label className="settings-field settings-footer-field">
            <span>Receipt footer message</span>
            <input maxLength={300} value={settings.receiptFooter} disabled={!isAdmin}
              onChange={e => update('receiptFooter', e.target.value)} />
          </label>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><ShieldCheck size={19} /></div>
            <div><h3>Tax configuration</h3><p>Saved configuration only; this does not yet affect checkout totals.</p></div>
          </div>
          <div className="settings-options">
            <label className="settings-toggle">
              <span><strong>Tax enabled</strong><small>Record whether tax should be enabled for a future checkout integration.</small></span>
              <input type="checkbox" checked={settings.taxEnabled} disabled={!isAdmin}
                onChange={e => update('taxEnabled', e.target.checked)} />
            </label>
          </div>
          <label className="settings-field settings-tax-field">
            <span>Tax rate (%)</span>
            <input type="number" min="0" max="100" step="0.01" value={settings.taxRate}
              disabled={!isAdmin} onChange={e => update('taxRate', e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <p className="settings-note">No tax is added to sales until checkout, receipt and report calculations are explicitly updated and tested.</p>
        </section>

        {isAdmin && <div className="settings-actions">
          <span>Changes are stored in the POS database.</span>
          <button className="primary-button" type="submit" disabled={saving || !settings.storeName.trim()}>
            {saving ? <LoaderCircle size={16} className="settings-spinner" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>}
      </form>
    </div>
  );
}
