import UsersPage from './UsersPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import { useState as useCategoryState, useEffect as useCategoryEffect } from 'react';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, ReceiptText,
  ChartNoAxesCombined, Settings, Users, Search, Bell, Menu, X, Store,
  ChevronDown, ArrowUpRight, BookOpen, ArrowDownRight, AlertTriangle,
  CircleDollarSign, ShoppingBag, TrendingUp, Clock3, Plus,
  ScanBarcode, CreditCard, RotateCcw, SlidersHorizontal,
  RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import './app.css';
import ProductsCsvImport from './ProductsCsvImport.jsx';

import ReturnsPage from './ReturnsPage.jsx';
import ReportsPage from './ReportsPage.jsx';
import LoginPage from './LoginPage.jsx';

const navigation = [
  { section: 'WORKSPACE', items: [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Point of Sale', icon: ShoppingCart },
  ]},
  { section: 'INVENTORY', items: [
    { label: 'Products', icon: Package },
    { label: 'Stock Management', icon: Boxes },
    { label: 'Categories', icon: SlidersHorizontal },
  ]},
  { section: 'SALES', items: [
    { label: 'Transactions', icon: ReceiptText },
    { label: 'Returns', icon: RotateCcw },
    { label: 'Reports', icon: ChartNoAxesCombined },
  ]},
  { section: 'ADMINISTRATION', items: [
    { label: 'Users & Roles', icon: Users },
    { label: 'Settings', icon: Settings },
  ]},
];

const pageDescriptions = {
  Dashboard: 'Here is what is happening at your store today.',
  'Point of Sale': 'Create a sale and process a simulated payment.',
  Products: 'Manage your product catalogue and pricing.',
  'Stock Management': 'Track stock levels and inventory movements.',
  Categories: 'Organize products into manageable groups.',
  Transactions: 'Review sales and access receipt details.',
  Returns: 'Review and record product returns.',
  Reports: 'Explore sales and inventory performance.',
  'Users & Roles': 'Manage staff access and permissions.',
  Settings: 'Configure your store preferences.',
};

const metrics = [
  { title: "Today's Sales", value: 'Rs 0.00', change: 'No sales recorded', icon: CircleDollarSign, tone: 'green' },
  { title: 'Transactions', value: '0', change: 'Today so far', icon: ShoppingBag, tone: 'sage' },
  { title: 'Average Sale', value: 'Rs 0.00', change: 'Today so far', icon: TrendingUp, tone: 'amber' },
  { title: 'Low Stock Items', value: '0', change: 'Awaiting inventory data', icon: AlertTriangle, tone: 'red' },
];

function Sidebar({ active, onNavigate, open, onClose, storeName = 'HZ Retail', storeDetails = {} }) {
  const [storeDetailsOpen, setStoreDetailsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState('');
  const helpTopics = [
    { title: 'Getting started', text: 'Configure store details, create categories, add products, and verify stock before your first sale.' },
    { title: 'Products and CSV import', text: 'Use unique SKUs and existing active categories. Follow the CSV template. Imported products start with zero stock; receive stock through Stock Management.' },
    { title: 'Point of Sale', text: 'Find products, add them to the cart, review quantities and totals, and complete the sale using the payment options available in your installation.' },
    { title: 'Stock management', text: 'Record received stock through the inventory workflow. Review low-stock alerts and verify quantities after adjustments.' },
    { title: 'Returns and refunds', text: 'Locate the original transaction, verify returned items and quantities, and check the refund and inventory changes before finishing.' },
    { title: 'Reports and troubleshooting', text: 'Use reports to review recorded activity. If a page fails, refresh once. If the issue persists, contact your POS administrator.' }
  ];
  const filteredHelpTopics = helpTopics.filter(topic =>
    (topic.title + ' ' + topic.text).toLowerCase().includes(helpQuery.trim().toLowerCase())
  );
  return (
    <>
      {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><ShoppingBag size={23} strokeWidth={2.2} /></div>
          <div><strong>{storeName}</strong><span>POS MANAGEMENT</span></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={onClose}><X size={19} /></button>
        </div>

        <button
          type="button"
          className="store-switcher"
          aria-expanded={storeDetailsOpen}
          aria-controls="store-details-panel"
          onClick={() => setStoreDetailsOpen(value => !value)}
        >
          <span className="store-avatar">{storeName.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()}</span>
          <span className="store-copy"><strong>{storeName}</strong><span>Store details</span></span>
          <ChevronDown size={16} className={`store-chevron ${storeDetailsOpen ? 'store-chevron-open' : ''}`} />
        </button>
        {storeDetailsOpen && (
          <section className="store-details-panel" id="store-details-panel" aria-label="Store contact details">
            <div className="store-detail-heading">STORE INFORMATION</div>
            <div className="store-detail-item"><strong>Address</strong><span>{storeDetails.address?.trim() || 'Not configured'}</span></div>
            <div className="store-detail-item"><strong>Phone</strong><span>{storeDetails.phone?.trim() || 'Not configured'}</span></div>
            <div className="store-detail-item"><strong>Email</strong><span>{storeDetails.email?.trim() || 'Not configured'}</span></div>
          </section>
        )}

        <nav className="navigation">
          {navigation.map(group => (
            <div className="nav-group" key={group.section}>
              <p className="nav-heading">{group.section}</p>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active === item.label ? 'nav-active' : ''}`}
                    onClick={() => { onNavigate(item.label); onClose(); }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {item.label === 'Point of Sale' && <span className="nav-shortcut">POS</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <button type="button" className="sidebar-footer sidebar-help-button" onClick={() => { setHelpQuery(''); setHelpOpen(true); }} aria-haspopup="dialog">
          <span className="help-icon"><BookOpen size={18} strokeWidth={1.8} /></span>
          <span className="sidebar-help-copy"><strong>Need a hand?</strong><span>Help & documentation</span></span>
          <ArrowUpRight size={15} />
        </button>
        {helpOpen && (
          <div className="help-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setHelpOpen(false); }}>
            <section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
              <header className="help-dialog-header">
                <div><p className="eyebrow">HZ RETAIL POS</p><h2 id="help-dialog-title">Help & documentation</h2><p>Quick guidance for everyday shop operations.</p></div>
                <button type="button" className="icon-button" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={19} /></button>
              </header>
              <label className="help-search-label" htmlFor="help-topic-search">Search help topics</label>
              <input id="help-topic-search" className="help-topic-search" type="search" placeholder="Try products, stock, sales..." value={helpQuery} onChange={event => setHelpQuery(event.target.value)} />
              <div className="help-topic-list">
                {filteredHelpTopics.length ? filteredHelpTopics.map(topic => (
                  <article className="help-topic" key={topic.title}><h3>{topic.title}</h3><p>{topic.text}</p></article>
                )) : <p className="help-no-results">No matching topics. Try another search.</p>}
              </div>
              <footer className="help-dialog-footer"><span>Need more assistance? Contact your POS administrator.</span><button type="button" className="primary-button" onClick={() => setHelpOpen(false)}>Got it</button></footer>
            </section>
          </div>
        )}
        <div className="sidebar-version">{storeName} POS <span>•</span> Development</div>
      </aside>
    </>
  );
}

function Dashboard() {
  const [sales, setSales] = useState([]);
  const [dailySummary, setDailySummary] = useState({ totalPaisa: 0, transactions: 0, averageSalePaisa: 0, hourlySales: [] });
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const money = amount => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(amount) || 0) / 100);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [salesResponse, inventoryResponse, summaryResponse] = await Promise.all([
        fetch('/api/v1/sales?limit=100&page=1'),
        fetch('/api/v1/inventory/summary'),
        fetch('/api/v1/dashboard/summary'),
      ]);
      const [salesResult, inventoryResult, summaryResult] = await Promise.all([
        salesResponse.json(),
        inventoryResponse.json(),
        summaryResponse.json(),
      ]);
      if (!salesResponse.ok) {
        throw new Error(salesResult.error?.message || salesResult.message || 'Could not load sales.');
      }
      if (!inventoryResponse.ok) {
        throw new Error(inventoryResult.error?.message || inventoryResult.message || 'Could not load inventory.');
      }
      if (!summaryResponse.ok) {
        throw new Error(summaryResult.error?.message || summaryResult.message || 'Could not load daily sales summary.');
      }
      setSales(Array.isArray(salesResult.data) ? salesResult.data : []);
      setDailySummary(summaryResult.data || { totalPaisa: 0, transactions: 0, averageSalePaisa: 0, hourlySales: [] });
      setInventory(inventoryResult.data || null);
    } catch (err) {
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  const now = new Date();
  const todayTotal = Number(dailySummary.totalPaisa) || 0;
  const todayTransactions = Number(dailySummary.transactions) || 0;
  const averageSale = Number(dailySummary.averageSalePaisa) || 0;
  const lowStock = Number(inventory?.lowStock) || 0;
  const hourlySales = (dailySummary.hourlySales || []).map(item => ({
    label: `${String(item.startHour).padStart(2, '0')}:00`,
    total: Number(item.totalPaisa) || 0,
  }));
  const maxHourlySales = Math.max(...hourlySales.map(item => item.total), 1);
  const recentSales = [...sales].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase();

  const metrics = [
    { title: "Today's Sales", value: money(todayTotal), change: `${todayTransactions} completed sales today`, icon: CircleDollarSign, tone: 'green' },
    { title: 'Transactions', value: String(todayTransactions), change: 'Completed today', icon: ShoppingBag, tone: 'sage' },
    { title: 'Average Sale', value: money(averageSale), change: 'Average transaction today', icon: TrendingUp, tone: 'amber' },
    { title: 'Low Stock Items', value: String(lowStock), change: `${Number(inventory?.outOfStock) || 0} out of stock`, icon: AlertTriangle, tone: 'red' },
  ];

  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{dateLabel} · STORE OVERVIEW</p>
          <h2>{greeting} <span>👋</span></h2>
          <p className="muted">Here is what is happening at your store today.</p>
        </div>
        <button className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Point of Sale' }))}>
          <Plus size={17} /> New sale
        </button>
      </div>

      {error && (
        <div className="notice" role="alert">
          <div className="notice-icon"><AlertTriangle size={18} /></div>
          <div><strong>Some dashboard data could not be loaded</strong><p>{error}</p>
            <button className="subtle-button" onClick={loadDashboard}><RefreshCw size={14} /> Retry</button>
          </div>
        </div>
      )}

      <div className="section-heading">
        <div><h3>Business overview</h3><p className="muted">Live figures for today</p></div>
        <button className="date-filter" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="metrics-grid">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <article className="metric-card" key={metric.title}>
              <div className="metric-top"><span>{metric.title}</span><span className={`metric-icon ${metric.tone}`}><Icon size={19} /></span></div>
              <div className="metric-value">{loading ? '—' : metric.value}</div>
              <div className="metric-foot"><span>{loading ? 'Loading live data…' : metric.change}</span></div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-heading">
            <div><h3>Sales activity</h3><p className="muted">Sales totals in two-hour intervals</p></div>
            <button className="subtle-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Reports' }))}>View reports <ArrowUpRight size={15} /></button>
          </div>
          {loading ? <div className="chart-empty"><strong>Loading sales activity…</strong></div> : (
            <div className="dashboard-chart">
              {hourlySales.map(item => (
                <div className="chart-column" key={item.label} title={`${item.label} — ${money(item.total)}`}>
                  <span className="chart-bar-value">{item.total ? money(item.total) : ''}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar" style={{ height: `${item.total ? Math.max(6, item.total / maxHourlySales * 100) : 0}%` }} />
                  </div>
                  <span className="chart-hour">{item.label}</span>
                </div>
              ))}
              {!todayTransactions && <p className="chart-note">No sales recorded today yet.</p>}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h3>Inventory health</h3><p className="muted">Current stock status</p></div><Boxes size={19} className="heading-icon" /></div>
          {loading ? <div className="inventory-empty"><strong>Loading inventory…</strong></div> : inventory ? (
            <div className="inventory-health">
              <div className="health-stat"><span>Products</span><strong>{Number(inventory.totalProducts) || 0}</strong></div>
              <div className="health-stat"><span>Units in stock</span><strong>{Number(inventory.totalUnits) || 0}</strong></div>
              <div className="health-stat"><span>Low stock</span><strong className={lowStock ? 'health-warning' : ''}>{lowStock}</strong></div>
              <div className="health-stat"><span>Out of stock</span><strong className={inventory.outOfStock ? 'health-danger' : ''}>{Number(inventory.outOfStock) || 0}</strong></div>
              <button className="outline-button full-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Stock Management' }))}><Boxes size={16} /> Manage stock</button>
            </div>
          ) : (
            <div className="inventory-empty"><Package size={22} /><strong>Inventory unavailable</strong><p>Refresh to try loading stock information.</p></div>
          )}
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><h3>Recent transactions</h3><p className="muted">Your latest recorded sales</p></div><button className="subtle-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Transactions' }))}>View all <ArrowUpRight size={15} /></button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>TRANSACTION</th><th>TIME</th><th>ITEMS</th><th>PAYMENT</th><th className="align-right">TOTAL</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5"><div className="table-empty">Loading transactions…</div></td></tr> :
                recentSales.length ? recentSales.map(sale => (
                  <tr key={sale._id || sale.receiptNumber}>
                    <td><strong>{sale.receiptNumber}</strong></td>
                    <td>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '—'}</td>
                    <td>{(sale.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</td>
                    <td><span className="status-pill">{sale.paymentMethod || '—'}</span></td>
                    <td className="align-right">{money(sale.totalPaisa)}</td>
                  </tr>
                )) : <tr><td colSpan="5"><div className="table-empty"><ReceiptText size={21} /><span>No transactions recorded yet</span><small>Completed sales will appear here.</small></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <p className="demo-disclaimer">Live data · Figures reflect recorded sales and current inventory. Sales totals are based on the latest 100 transactions returned by the API.</p>
    </div>
  );
}

function ProductsPage({ initialSearch = '' }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 0
  });

  useEffect(() => {
    if (initialSearch) {
      setQuery(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formValues, setFormValues] = useState({
    name: '', sku: '', barcode: '', category: '', description: '',
    price: '', stockQty: '0', lowStockThreshold: '5', status: 'active'
  });

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError('');
      try {
        const response = await fetch('/api/v1/categories?limit=100');
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error?.message || 'Could not load categories.');
        }
        if (!cancelled) setCategories(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        if (!cancelled) setCategoriesError(error.message || 'Could not load categories.');
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    loadCategories();
    return () => { cancelled = true; };
  }, []);

  function updateForm(field, value) {
    setFormValues(current => ({ ...current, [field]: value }));
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    if (saving) return;

    setFormError('');
    const name = formValues.name.trim();
    const sku = formValues.sku.trim().toUpperCase();
    const category = formValues.category.trim();
    const price = Number(formValues.price);
    const stockQty = Number(formValues.stockQty);
    const lowStockThreshold = Number(formValues.lowStockThreshold);

    if (name.length < 2 || name.length > 120) {
      setFormError('Product name must contain 2–120 characters.');
      return;
    }
    if (!/^[A-Z0-9_-]{2,40}$/.test(sku)) {
      setFormError('SKU must be 2–40 characters using letters, numbers, underscores or hyphens.');
      return;
    }
    if (!category || category.length > 80) {
      setFormError('Category is required and must not exceed 80 characters.');
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !/^\d+(?:\.\d{1,2})?$/.test(formValues.price.trim())) {
      setFormError('Enter a valid non-negative price with up to two decimal places.');
      return;
    }
    if (!Number.isSafeInteger(Math.round(price * 100))) {
      setFormError('Price is too large.');
      return;
    }
    if (!Number.isSafeInteger(stockQty) || stockQty < 0 ||
        !Number.isSafeInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setFormError('Stock quantity and low-stock threshold must be non-negative whole numbers.');
      return;
    }
    if (formValues.barcode.trim().length > 80) {
      setFormError('Barcode cannot exceed 80 characters.');
      return;
    }
    if (formValues.description.trim().length > 1000) {
      setFormError('Description cannot exceed 1000 characters.');
      return;
    }

    const payload = {
      name, sku, category,
      pricePaisa: Math.round(price * 100),
      status: formValues.status,
      description: formValues.description.trim()
    };

    // Stock changes must go through the inventory receive/adjust endpoints.
    // Initial stock is accepted only when creating a new product.
    if (!editingProduct) {
      payload.stockQty = stockQty;
      payload.lowStockThreshold = lowStockThreshold;
    }
    if (formValues.barcode.trim()) payload.barcode = formValues.barcode.trim();

    setSaving(true);
    try {
      const response = await fetch(
        editingProduct
          ? `/api/v1/products/${encodeURIComponent(editingProduct._id)}`
          : '/api/v1/products',
        {
          method: editingProduct ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const details = result.error?.details;
        if (response.status === 409) {
          throw new Error('This SKU or barcode already exists. Use a unique value.');
        }
        throw new Error(
          Array.isArray(details) && details.length
            ? details.join(' ')
            : result.error?.message || result.message || 'Unable to save product.'
        );
      }

      setShowAddForm(false);
      setEditingProduct(null);
      setFormValues({
        name: '', sku: '', barcode: '', category: '', description: '',
        price: '', stockQty: '0', lowStockThreshold: '5', status: 'active'
      });
      setQuery('');
      setPage(1);
      setReloadKey(value => value + 1);
    } catch (error) {
      setFormError(error.message || 'Unable to connect to the API.');
    } finally {
      setSaving(false);
    }
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setFormError('');
    setFormValues({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || '',
      description: product.description || '',
      price: (product.pricePaisa / 100).toFixed(2),
      stockQty: String(product.stockQty ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 0),
      status: product.status || 'active'
    });
    setShowAddForm(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        });
        if (query.trim()) params.set('search', query.trim());

        const response = await fetch(
          `/api/v1/products?${params.toString()}`,
          { signal: controller.signal }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || result.error?.message ||
            'Unable to load products.');
        }

        if (!Array.isArray(result.data) || !result.pagination) {
          throw new Error('The products API returned an unexpected response.');
        }

        setProducts(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setProducts([]);
          setError(err.message || 'Unable to connect to the products API.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, page, reloadKey]);

  const money = amount => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);

  function stockLabel(product) {
    if (product.stockQty === 0) return 'Out of stock';
    if (product.stockQty <= product.lowStockThreshold) return 'Low stock';
    return 'In stock';
  }

  return (
    <section className="products-page">
      <div className="products-heading">
        <div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h2>Products</h2>
          <p className="muted">Manage your catalogue, prices and stock levels.</p>
        </div>
        <div className="products-heading-actions">
          <button
            className="outline-button"
            onClick={() => setReloadKey(value => value + 1)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'refresh-spinning' : ''} />
            Refresh
          </button>
          <button
            className="primary-button"
            onClick={() => {
              setEditingProduct(null);
              setFormError('');
              setFormValues({
                name: '', sku: '', barcode: '', category: '', description: '',
                price: '', stockQty: '0', lowStockThreshold: '5', status: 'active'
              });
              setShowAddForm(true);
            }}
          >
            <Plus size={15} /> Add product
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="product-modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget && !saving) setShowAddForm(false);
        }}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
            <div className="product-modal-heading">
              <div>
                <p className="eyebrow">PRODUCT CATALOGUE</p>
                <h3 id="add-product-title">{editingProduct ? 'Edit product' : 'Add product'}</h3>
                <p>{editingProduct
                  ? 'Update the saved product details.'
                  : 'Enter the product details to add it to your inventory.'}</p>
              </div>
              <button type="button" className="modal-close" disabled={saving}
                onClick={() => setShowAddForm(false)} aria-label="Close form">
                <X size={19} />
              </button>
            </div>

            <form className="product-form" onSubmit={handleSaveProduct}>
              {formError && <div className="product-form-error" role="alert">
                <AlertTriangle size={16} /> <span>{formError}</span>
              </div>}

              <div className="product-form-grid">
                <label className="product-field">
                  <span>Product name <b>*</b></span>
                  <input autoFocus required minLength={2} maxLength={120}
                    value={formValues.name} onChange={event => updateForm('name', event.target.value)}
                    placeholder="e.g. Arabica Coffee" />
                </label>
                <label className="product-field">
                  <span>SKU <b>*</b></span>
                  <input required minLength={2} maxLength={40}
                    value={formValues.sku} onChange={event => updateForm('sku', event.target.value.toUpperCase())}
                    pattern="[A-Za-z0-9_-]{2,40}" title="Use 2–40 letters, numbers, underscores or hyphens."
                    placeholder="e.g. COFFEE-001" />
                  <small>Automatically converted to uppercase.</small>
                </label>
                <label className="product-field">
                  <span>Category <b>*</b></span>
                  <select required value={formValues.category}
                    onChange={event => updateForm('category', event.target.value)}
                    disabled={categoriesLoading || categories.length === 0}>
                    <option value="">
                      {categoriesLoading ? 'Loading categories…' :
                        categoriesError ? 'Categories unavailable' : 'Select a category'}
                    </option>
                    {categories
                      .filter(category =>
                        category.status === 'active' ||
                        category.name === formValues.category
                      )
                      .map(category => (
                        <option key={category._id} value={category.name}>
                          {category.name}{category.status === 'inactive' ? ' (Inactive — existing product)' : ''}
                        </option>
                      ))}
                  </select>
                  {categoriesError && <small role="alert">{categoriesError}</small>}
                  {!categoriesLoading && !categoriesError && categories.length === 0 &&
                    <small>Create a category before adding a product.</small>}
                </label>
                <label className="product-field">
                  <span>Barcode <small>(optional)</small></span>
                  <input maxLength={80} value={formValues.barcode}
                    onChange={event => updateForm('barcode', event.target.value)}
                    placeholder="Enter barcode" />
                </label>
                <label className="product-field">
                  <span>Price (PKR) <b>*</b></span>
                  <input required inputMode="decimal" type="number" min="0" step="0.01"
                    value={formValues.price} onChange={event => updateForm('price', event.target.value)}
                    placeholder="0.00" />
                  <small>Stored as integer paisa.</small>
                </label>
                <label className="product-field">
                  <span>Initial stock quantity <b>*</b></span>
                  <input required type="number" min="0" step="1"
                    value={formValues.stockQty} onChange={event => updateForm('stockQty', event.target.value)} />
                </label>
                <label className="product-field">
                  <span>Low-stock threshold <b>*</b></span>
                  <input required type="number" min="0" step="1"
                    value={formValues.lowStockThreshold}
                    onChange={event => updateForm('lowStockThreshold', event.target.value)} />
                </label>
                <label className="product-field">
                  <span>Status <b>*</b></span>
                  <select value={formValues.status} onChange={event => updateForm('status', event.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="product-field product-field-wide">
                  <span>Description <small>(optional, max 1,000 characters)</small></span>
                  <textarea rows={3} maxLength={1000} value={formValues.description}
                    onChange={event => updateForm('description', event.target.value)}
                    placeholder="Add useful product details..." />
                </label>
              </div>

              <div className="product-form-actions">
                <button type="button" className="outline-button" disabled={saving}
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                  }}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? <><RefreshCw size={15} className="refresh-spinning" /> Saving…</>
                    : editingProduct
                      ? 'Save changes'
                      : <><Plus size={15} /> Save product</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="products-summary">
        <div>
          <span className="products-summary-label">Catalogue products</span>
          <strong>{pagination.total}</strong>
        </div>
        <div>
          <span className="products-summary-label">Current page</span>
          <strong>{pagination.totalPages ? `${pagination.page} / ${pagination.totalPages}` : '—'}</strong>
        </div>
      </div>

      <section className="panel products-panel">
        <div className="products-toolbar">
          <label className="products-search">
            <Search size={17} />
            <input
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by product name or SKU..."
              aria-label="Search products by name or SKU"
            />
            {query && (
              <button
                type="button"
                className="clear-search"
                onClick={() => { setQuery(''); setPage(1); }}
                aria-label="Clear product search"
              >
                <X size={15} />
              </button>
            )}
          </label>
          <span className="products-result-count">
            {loading ? 'Loading products…' :
              `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}`}
          </span>
        </div>

        <ProductsCsvImport onImported={() => { setPage(1); setReloadKey(value => value + 1); }} />

      {error ? (
          <div className="products-message products-error" role="alert">
            <AlertTriangle size={22} />
            <strong>Could not load products</strong>
            <p>{error}</p>
            <button className="outline-button" onClick={() => setReloadKey(value => value + 1)}>
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : loading ? (
          <div className="products-message" role="status">
            <RefreshCw size={22} className="refresh-spinning" />
            <strong>Loading catalogue</strong>
            <p>Fetching the latest products from your API.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="products-message">
            <Package size={26} />
            <strong>{query.trim() ? 'No matching products' : 'No products yet'}</strong>
            <p>{query.trim()
              ? 'Try another product name or SKU.'
              : 'Products added to your catalogue will appear here.'}</p>
            {query.trim() && (
              <button className="outline-button" onClick={() => setQuery('')}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const stock = stockLabel(product);
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="product-name">{product.name}</div>
                        {product.description && (
                          <div className="product-description">{product.description}</div>
                        )}
                      </td>
                      <td><span className="product-sku">{product.sku}</span></td>
                      <td>{product.category || '—'}</td>
                      <td className="product-price">{money(product.pricePaisa)}</td>
                      <td>
                        <span className={`stock-label ${
                          stock === 'In stock' ? 'stock-good' :
                          stock === 'Low stock' ? 'stock-low' : 'stock-out'
                        }`}>
                          {product.stockQty} · {stock}
                        </span>
                      </td>
                      <td>
                        <span className={`product-status ${
                          product.status === 'active' ? 'product-active' : 'product-inactive'
                        }`}>
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="outline-button product-edit-button"
                          onClick={() => openEditProduct(product)}
                          disabled={saving}
                          aria-label={`Edit ${product.name}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!error && pagination.totalPages > 1 && (
          <div className="products-pagination">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div>
              <button
                className="pagination-button"
                disabled={loading || page <= 1}
                onClick={() => setPage(value => Math.max(1, value - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                className="pagination-button"
                disabled={loading || page >= pagination.totalPages}
                onClick={() => setPage(value => Math.min(pagination.totalPages, value + 1))}
                aria-label="Next page"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="demo-disclaimer">
        Development preview · Catalogue data is loaded from the HZ Retail POS API.
      </p>
    </section>
  );
}


function CategoriesPage() {
  const [rows, setRows] = useCategoryState([]);
  const [loading, setLoading] = useCategoryState(true);
  const [error, setError] = useCategoryState('');
  const [search, setSearch] = useCategoryState('');
  const [status, setStatus] = useCategoryState('all');
  const [page, setPage] = useCategoryState(1);
  const [pages, setPages] = useCategoryState(1);
  const [total, setTotal] = useCategoryState(0);
  const [modal, setModal] = useCategoryState(false);
  const [editing, setEditing] = useCategoryState(null);
  const [saving, setSaving] = useCategoryState(false);
  const [formError, setFormError] = useCategoryState('');
  const [form, setForm] = useCategoryState({ name: '', description: '', status: 'active' });

  const load = async (requestedPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'all') params.set('status', status);
      const response = await fetch('/api/v1/categories?' + params.toString());
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message || body?.message || 'Could not load categories.');
      const list = Array.isArray(body.data) ? body.data : Array.isArray(body.categories) ? body.categories : [];
      const meta = body.pagination || body.meta?.pagination || {};
      setRows(list);
      setPages(Math.max(1, Number(meta.pages || meta.totalPages || 1)));
      setTotal(Number(meta.total ?? meta.totalItems ?? list.length));
    } catch (e) {
      setError(e.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  };

  useCategoryEffect(() => {
    const timer = setTimeout(() => { setPage(1); load(1); }, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  useCategoryEffect(() => { load(page); }, [page]);

  const startCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', status: 'active' });
    setFormError('');
    setModal(true);
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || '', description: item.description || '', status: item.status || 'active' });
    setFormError('');
    setModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setFormError('');
    const name = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2 || name.length > 80) {
      setFormError('Name must contain 2 to 80 characters.');
      return;
    }
    if (description.length > 500) {
      setFormError('Description must be 500 characters or fewer.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        editing ? '/api/v1/categories/' + editing._id : '/api/v1/categories',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, status: form.status })
        }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message || body?.message || 'Could not save category.');
      setModal(false);
      setPage(1);
      await load(1);
    } catch (e) {
      setFormError(e.message || 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const count = total || rows.length;
  const first = count ? (page - 1) * 10 + 1 : 0;
  const last = Math.min(page * 10, count);

  return (
    <section className="categories-page">
      <div className="categories-heading">
        <div><h1>Categories</h1><p>Organize products into manageable groups.</p></div>
        <button className="categories-primary" type="button" onClick={startCreate}>＋ Add category</button>
      </div>

      <div className="categories-toolbar">
        <input aria-label="Search categories" type="search" placeholder="Search categories..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error ? (
        <div className="categories-error" role="alert">
          <div><strong>Could not load categories</strong><p>{error}</p></div>
          <button type="button" onClick={() => load(page)}>Retry</button>
        </div>
      ) : (
        <div className="categories-table-wrap">
          <table className="categories-table">
            <thead><tr><th>Category</th><th>Description</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="categories-empty">Loading categories…</td></tr>
              : rows.length === 0 ? <tr><td colSpan="5" className="categories-empty">
                  <strong>{search || status !== 'all' ? 'No matching categories' : 'No categories yet'}</strong>
                  <p>{search || status !== 'all' ? 'Try another search or filter.' : 'Add a category to organize products.'}</p>
                  {!search && status === 'all' && <button className="categories-secondary" type="button" onClick={startCreate}>Add your first category</button>}
                </td></tr>
              : rows.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.description || '—'}</td>
                  <td><span className={'categories-status ' + (item.status === 'active' ? 'is-active' : 'is-inactive')}>{item.status}</span></td>
                  <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                  <td><button className="categories-edit" type="button" onClick={() => startEdit(item)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && !loading && rows.length > 0 && (
        <div className="categories-pagination">
          <span>Showing {first}–{last} of {count}</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((v) => Math.min(pages, v + 1))}>Next</button>
          </div>
        </div>
      )}

      {modal && (
        <div className="categories-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModal(false); }}>
          <section className="categories-modal" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title">
            <div className="categories-modal-heading">
              <div><h2 id="category-dialog-title">{editing ? 'Edit category' : 'Add category'}</h2>
                <p>{editing ? 'Update category details.' : 'Create a category for your products.'}</p></div>
              <button className="categories-close" type="button" onClick={() => setModal(false)} disabled={saving} aria-label="Close">×</button>
            </div>
            <form onSubmit={save}>
              <label className="categories-field">Category name *
                <input autoFocus required minLength={2} maxLength={80} value={form.name}
                  onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. Beverages" />
              </label>
              <label className="categories-field">Description
                <textarea rows={3} maxLength={500} value={form.description}
                  onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Optional description" />
                <small>{form.description.length}/500 characters</small>
              </label>
              <label className="categories-field">Status
                <select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </label>
              {formError && <p className="categories-form-error" role="alert">{formError}</p>}
              <div className="categories-modal-actions">
                <button className="categories-secondary" type="button" disabled={saving} onClick={() => setModal(false)}>Cancel</button>
                <button className="categories-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}



function PosPage({ cart, setCart }) {
  const money = amount => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(amount) || 0) / 100);

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMessage, setBarcodeMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/products?status=active&limit=100');
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error?.message || 'Could not load products.');
      }
      setProducts(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Could not connect to the product API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  const visibleProducts = products.filter(product => {
    const term = query.trim().toLowerCase();
    return !term ||
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      (product.barcode || '').toLowerCase().includes(term);
  });

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPaisa = cart.reduce(
    (sum, item) => sum + item.product.pricePaisa * item.quantity, 0
  );
  const cashAmountMatch = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cashReceived.trim());
  const amountReceivedPaisa = cashAmountMatch
    ? Number(cashAmountMatch[1]) * 100 +
      Number((cashAmountMatch[2] || '').padEnd(2, '0'))
    : null;
  const validCashAmount = Number.isSafeInteger(amountReceivedPaisa) &&
    amountReceivedPaisa >= totalPaisa;
  const changePaisa = validCashAmount ? amountReceivedPaisa - totalPaisa : 0;

  function addToCart(product) {
    if (Number(product.stockQty) < 1) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setError('');
    setCart(current => {
      const existing = current.find(item => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= Number(product.stockQty)) return current;
        return current.map(item => item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function handleBarcodeScan(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const scanned = barcodeInput.trim();
    if (!scanned) return;

    const product = products.find(item =>
      String(item.barcode || '').trim() === scanned
    );
    if (!product) {
      setBarcodeMessage({ type: 'error', text: `No active product found for barcode "${scanned}".` });
      setBarcodeInput('');
      return;
    }

    const existing = cart.find(item => item.product._id === product._id);
    if (Number(product.stockQty) < 1) {
      setBarcodeMessage({ type: 'error', text: `${product.name} is out of stock.` });
      setBarcodeInput('');
      return;
    }
    if (existing && existing.quantity >= Number(product.stockQty)) {
      setBarcodeMessage({ type: 'error', text: `Only ${product.stockQty} units of ${product.name} are available.` });
      setBarcodeInput('');
      return;
    }

    addToCart(product);
    setBarcodeMessage({ type: 'success', text: `Added ${product.name} to the cart.` });
    setBarcodeInput('');
  }

  function changeQuantity(productId, nextQuantity) {
    const product = products.find(item => item._id === productId);
    if (!product) return;
    if (nextQuantity < 1) {
      setCart(current => current.filter(item => item.product._id !== productId));
      return;
    }
    if (nextQuantity > product.stockQty) {
      setError(`Only ${product.stockQty} units of ${product.name} are currently available.`);
      return;
    }
    setError('');
    setCart(current => current.map(item => item.product._id === productId
      ? { ...item, quantity: nextQuantity }
      : item));
  }

  async function checkout() {
    if (saving || cart.length === 0 || paymentMethod !== 'cash' || !validCashAmount) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          amountReceivedPaisa,
          items: cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          }))
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error?.message || 'Checkout failed. Please retry.');
      }
      setReceipt(result.data);
      setCart([]);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pos-checkout-page">
      <div className="pos-page-heading">
        <div>
          <p className="eyebrow">SALES WORKSPACE</p>
          <h1>Point of Sale</h1>
          <p className="muted">Select products, build the cart, and complete a demo sale.</p>
        </div>
        <button className="outline-button" type="button" onClick={loadProducts} disabled={loading}>
          <RefreshCw size={15} /> Refresh stock
        </button>
      </div>

      {error && <div className="pos-error" role="alert">
        <AlertTriangle size={17} /><span>{error}</span>
      </div>}

      <div className="pos-workspace">
        <section className="pos-products-panel">
          <div className="pos-panel-heading">
            <div><h2>Products</h2><p>Choose an item to add it to the cart.</p></div>
            <span className="pos-count">{visibleProducts.length} items</span>
          </div>
          <label className="pos-barcode-scan">
            <ScanBarcode size={18} />
            <span className="pos-barcode-copy">
              <strong>Scan barcode</strong>
              <small>Scan with a USB/Bluetooth scanner or type a barcode and press Enter.</small>
            </span>
            <input
              value={barcodeInput}
              onChange={event => {
                setBarcodeInput(event.target.value);
                setBarcodeMessage(null);
              }}
              onKeyDown={handleBarcodeScan}
              placeholder="Scan or type barcode…"
              aria-label="Scan product barcode"
              autoComplete="off"
              inputMode="numeric"
            />
          </label>
          {barcodeMessage && (
            <p className={`pos-barcode-message pos-barcode-${barcodeMessage.type}`}
              role="status" aria-live="polite">
              {barcodeMessage.text}
            </p>
          )}
          <label className="pos-search">
            <Search size={17} />
            <input value={query} onChange={event => setQuery(event.target.value)}
              placeholder="Search name, SKU or barcode…" aria-label="Search products" />
          </label>

          {loading ? <div className="pos-empty">Loading products…</div>
            : visibleProducts.length === 0
            ? <div className="pos-empty">
                <Package size={27} />
                <strong>{products.length ? 'No matching products' : 'No active products found'}</strong>
                <span>{products.length ? 'Try another search.' : 'Add active products with stock before checkout.'}</span>
              </div>
            : <div className="pos-product-grid">
                {visibleProducts.map(product => (
                  <button className="pos-product-card" type="button" key={product._id}
                    onClick={() => addToCart(product)} disabled={product.stockQty < 1}
                    aria-label={`Add ${product.name} to cart`}>
                    <span className="pos-product-category">{product.category || 'General'}</span>
                    <strong>{product.name}</strong>
                    <span className="pos-product-sku">{product.sku}</span>
                    <span className="pos-product-bottom">
                      <b>{money(product.pricePaisa)}</b>
                      <small>{product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}</small>
                    </span>
                  </button>
                ))}
              </div>}
        </section>

        <aside className="pos-cart-panel">
          <div className="pos-panel-heading">
            <div><h2>Current sale</h2><p>{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in cart</p></div>
            <ShoppingCart size={20} />
          </div>

          {cart.length === 0
            ? <div className="pos-cart-empty">
                <ShoppingCart size={28} />
                <strong>Your cart is empty</strong>
                <span>Select a product to get started.</span>
              </div>
            : <div className="pos-cart-items">
                {cart.map(item => (
                  <div className="pos-cart-item" key={item.product._id}>
                    <div className="pos-cart-item-copy">
                      <strong>{item.product.name}</strong>
                      <span>{money(item.product.pricePaisa)} each</span>
                      <b>{money(item.product.pricePaisa * item.quantity)}</b>
                    </div>
                    <div className="pos-quantity-control">
                      <button type="button" aria-label={`Decrease ${item.product.name}`}
                        onClick={() => changeQuantity(item.product._id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={`Increase ${item.product.name}`}
                        disabled={item.quantity >= item.product.stockQty}
                        onClick={() => changeQuantity(item.product._id, item.quantity + 1)}>+</button>
                      <button className="pos-remove-item" type="button"
                        aria-label={`Remove ${item.product.name}`}
                        onClick={() => changeQuantity(item.product._id, 0)}>×</button>
                    </div>
                  </div>
                ))}
              </div>}

          <div className="pos-cart-footer">
            <div className="pos-total-row"><span>Subtotal</span><strong>{money(totalPaisa)}</strong></div>
            <div className="pos-total-row"><span>Tax</span><span>Rs 0.00</span></div>
            <div className="pos-grand-total"><span>Total due</span><strong>{money(totalPaisa)}</strong></div>
            <p className="pos-payment-label">Payment method</p>
            <div className="pos-payment-options">
              <button type="button" className={paymentMethod === 'cash' ? 'selected' : ''}
                onClick={() => setPaymentMethod('cash')}><CircleDollarSign size={17} /> Cash</button>
              <button type="button" className="pos-card-unavailable" disabled title="Card processing is not configured">
                <CreditCard size={17} /> Card unavailable</button>
            </div>
            <label className="pos-cash-label" htmlFor="pos-cash-received">Cash received (PKR)</label>
            <input id="pos-cash-received" className="pos-cash-input" type="number"
              min="0" step="0.01" inputMode="decimal" placeholder="Enter amount received"
              value={cashReceived} onChange={event => setCashReceived(event.target.value)}
              disabled={saving || cart.length === 0} />
            <div className="pos-cash-summary">
              <div><span>Total due</span><strong>{money(totalPaisa)}</strong></div>
              <div><span>Change due</span><strong>{money(changePaisa)}</strong></div>
            </div>
            {cashReceived.trim() !== '' && !validCashAmount &&
              <p className="pos-cash-warning" role="alert">Cash received must cover the total due.</p>}
            <button className="pos-checkout-button" type="button"
              onClick={checkout} disabled={saving || loading || cart.length === 0 || !validCashAmount}>
              {saving ? 'Recording cash sale…' : <>Complete cash sale · {money(totalPaisa)}</>}
            </button>
            <p className="pos-demo-note">Record the cash physically received. Card processing is not configured.</p>
          </div>
        </aside>
      </div>

      {receipt && <div className="pos-receipt-backdrop">
        <section className="pos-receipt-dialog printable-receipt" role="dialog" aria-modal="true" aria-labelledby="pos-receipt-title">
          <div className="pos-receipt-success"><span>✓</span></div>
          <p className="eyebrow">SALE COMPLETED</p>
          <h2 id="pos-receipt-title">Receipt ready</h2>
          <p className="pos-receipt-number">{receipt.receiptNumber}</p>
          <div className="pos-receipt-lines">
            {(receipt.items || []).map((item, index) => (
              <div key={`${item.sku}-${index}`}>
                <span>{item.name} × {item.quantity}</span>
                <strong>{money(item.lineTotalPaisa)}</strong>
              </div>
            ))}
          </div>
          <div className="pos-receipt-total"><span>Sale total</span><strong>{money(receipt.totalPaisa)}</strong></div>
          <div className="pos-receipt-cash">
            <div><span>Cash received</span><strong>{money(receipt.amountReceivedPaisa ?? 0)}</strong></div>
            <div><span>Change returned</span><strong>{money(receipt.changePaisa ?? 0)}</strong></div>
          </div>
          <p className="pos-demo-note">Payment method: Cash</p>
          <button className="pos-checkout-button receipt-print-button" type="button" onClick={() => window.print()}>
            Print Receipt
          </button>
          <button className="pos-checkout-button receipt-print-button" type="button" onClick={() => setReceipt(null)}>
            Start next sale
          </button>
        </section>
      </div>}
    </section>
  );
}




function StockManagementPage() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [movementType, setMovementType] = useState('');
  const [dialog, setDialog] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [direction, setDirection] = useState('increase');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  async function request(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || result.message || 'The request failed.');
    }
    return result;
  }

  async function loadInventory() {
    setLoading(true);
    setError('');
    try {
      const movementUrl = '/api/v1/inventory/movements?limit=100&page=1'
        + (movementType ? `&type=${encodeURIComponent(movementType)}` : '');
      const [productResult, summaryResult, movementResult] = await Promise.all([
        request('/api/v1/products?limit=100&page=1'),
        request('/api/v1/inventory/summary'),
        request(movementUrl),
      ]);
      setProducts(Array.isArray(productResult.data) ? productResult.data : []);
      setSummary(summaryResult.data || null);
      setMovements(Array.isArray(movementResult.data) ? movementResult.data : []);
    } catch (err) {
      setError(err.message || 'Could not load inventory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInventory(); }, [movementType]);

  const filteredProducts = products.filter(product =>
    [product.name, product.sku, product.category, product.barcode]
      .some(value => String(value || '').toLowerCase().includes(query.trim().toLowerCase()))
  );

  function openStockDialog(product, mode) {
    setDialog({ product, mode });
    setQuantity('1');
    setDirection('increase');
    setReason(mode === 'receive' ? 'Stock received' : '');
    setReference('');
    setNotice('');
  }

  async function submitStock(event) {
    event.preventDefault();
    if (!dialog || saving) return;

    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setNotice('Enter a positive whole-number quantity.');
      return;
    }
    if (!reason.trim()) {
      setNotice('A reason is required.');
      return;
    }

    setSaving(true);
    setNotice('');
    try {
      const mode = dialog.mode;
      await request(`/api/v1/inventory/${mode === 'receive' ? 'receive' : 'adjust'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: dialog.product._id,
          quantity: amount,
          ...(mode === 'adjust' ? { direction } : {}),
          reason: reason.trim(),
          ...(reference.trim() ? { reference: reference.trim() } : {}),
        }),
      });
      setDialog(null);
      await loadInventory();
      setNotice('Stock updated successfully.');
    } catch (err) {
      setNotice(err.message || 'Could not update stock.');
    } finally {
      setSaving(false);
    }
  }

  const dateTime = value => value
    ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—';

  return (
    <section className="stock-page">
      <div className="stock-heading">
        <div>
          <p className="eyebrow">INVENTORY OPERATIONS</p>
          <h1>Stock Management</h1>
          <p className="muted">Monitor stock levels and keep a traceable record of every movement.</p>
        </div>
        <button className="outline-button" type="button" onClick={loadInventory} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="stock-summary">
        <div><span>Total products</span><strong>{summary?.totalProducts ?? '—'}</strong><small>In your catalogue</small></div>
        <div><span>Stock units</span><strong>{summary?.totalUnits ?? '—'}</strong><small>Units currently on hand</small></div>
        <div><span>Low stock</span><strong>{summary?.lowStock ?? '—'}</strong><small>At or below threshold</small></div>
        <div><span>Out of stock</span><strong>{summary?.outOfStock ?? '—'}</strong><small>Items with zero units</small></div>
      </div>

      {error && <div className="stock-error" role="alert">{error} <button type="button" onClick={loadInventory}>Try again</button></div>}
      {notice && !dialog && <div className="stock-notice" role="status">{notice}</div>}

      <div className="stock-panel">
        <div className="stock-toolbar">
          <div><h2>Current stock</h2><p className="muted">{filteredProducts.length} matching products</p></div>
          <label className="stock-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search product, SKU or category…" aria-label="Search inventory products" /></label>
        </div>
        {loading ? <div className="stock-empty">Loading inventory…</div> : !error && filteredProducts.length === 0 ? (
          <div className="stock-empty"><Package size={27} /><strong>No matching products</strong><span>Try another search term.</span></div>
        ) : !error && (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>On hand</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{filteredProducts.map(product => {
                const stock = Number(product.stockQty) || 0;
                const threshold = Number(product.lowStockThreshold) || 0;
                const state = stock === 0 ? 'out' : stock <= threshold ? 'low' : 'healthy';
                return <tr key={product._id}>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.sku || '—'}</td>
                  <td>{product.category || 'Uncategorized'}</td>
                  <td><strong>{stock}</strong></td>
                  <td>{threshold}</td>
                  <td><span className={`stock-badge stock-${state}`}>{state === 'out' ? 'Out of stock' : state === 'low' ? 'Low stock' : 'In stock'}</span></td>
                  <td><div className="stock-actions">
                    <button type="button" onClick={() => openStockDialog(product, 'receive')}>Receive</button>
                    <button type="button" className="stock-adjust-button" onClick={() => openStockDialog(product, 'adjust')}>Adjust</button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stock-panel">
        <div className="stock-toolbar">
          <div><h2>Movement history</h2><p className="muted">Latest 100 recorded inventory movements</p></div>
          <select aria-label="Filter movement type" value={movementType} onChange={event => setMovementType(event.target.value)}>
            <option value="">All movements</option><option value="receive">Stock received</option><option value="adjustment">Adjustments</option><option value="sale">POS sales</option>
          </select>
        </div>
        {loading ? <div className="stock-empty">Loading movement history…</div> : !error && movements.length === 0 ? (
          <div className="stock-empty">No movements match this filter yet.</div>
        ) : !error && (
          <div className="stock-table-wrap">
            <table className="stock-table stock-movements-table">
              <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Change</th><th>Previous</th><th>New stock</th><th>Reason / Reference</th></tr></thead>
              <tbody>{movements.map(item => <tr key={item._id}>
                <td>{dateTime(item.createdAt)}</td>
                <td><strong>{item.product?.name || 'Deleted product'}</strong><small>{item.product?.sku || ''}</small></td>
                <td><span className="stock-badge">{item.type === 'receive' ? 'Received' : item.type === 'sale' ? 'POS sale' : 'Adjustment'}</span></td>
                <td className={item.quantityChange > 0 ? 'stock-positive' : 'stock-negative'}>{item.quantityChange > 0 ? '+' : ''}{item.quantityChange}</td>
                <td>{item.previousQty}</td><td>{item.newQty}</td>
                <td><span>{item.reason}</span><small>{item.reference || 'No reference'}</small></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      {dialog && <div className="stock-dialog-backdrop" role="presentation" onClick={() => !saving && setDialog(null)}>
        <section className="stock-dialog" role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title" onClick={event => event.stopPropagation()}>
          <div className="stock-dialog-heading">
            <div><p className="eyebrow">{dialog.mode === 'receive' ? 'INBOUND STOCK' : 'INVENTORY CORRECTION'}</p><h2 id="stock-dialog-title">{dialog.mode === 'receive' ? 'Receive stock' : 'Adjust stock'}</h2><p className="muted">{dialog.product.name} · {dialog.product.sku}</p></div>
            <button type="button" className="icon-button" aria-label="Close dialog" disabled={saving} onClick={() => setDialog(null)}><X size={18} /></button>
          </div>
          <form onSubmit={submitStock}>
            <label className="stock-form-field">Quantity<input type="number" min="1" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
            {dialog.mode === 'adjust' && <label className="stock-form-field">Adjustment direction<select value={direction} onChange={event => setDirection(event.target.value)}><option value="increase">Increase stock</option><option value="decrease">Decrease stock</option></select></label>}
            <label className="stock-form-field">Reason<input maxLength="300" required value={reason} onChange={event => setReason(event.target.value)} placeholder="e.g. Supplier delivery or stock count" /></label>
            <label className="stock-form-field">Reference <span className="stock-optional">(optional)</span><input maxLength="100" value={reference} onChange={event => setReference(event.target.value)} placeholder="Purchase order or internal reference" /></label>
            {notice && <div className="stock-error" role="alert">{notice}</div>}
            <p className="stock-dialog-current">Current stock: <strong>{dialog.product.stockQty}</strong> units</p>
            <div className="stock-dialog-actions"><button type="button" className="outline-button" disabled={saving} onClick={() => setDialog(null)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Confirm stock change'}</button></div>
          </form>
        </section>
      </div>}
    </section>
  );
}

function TransactionsPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const pageSize = 8;

  const money = amount => new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(amount) || 0) / 100);

  async function loadSales() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/v1/sales?limit=100&page=1');
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load transactions.');
      setSales(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Could not load transactions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSales(); }, []);

  const filteredSales = sales.filter(sale => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [
      sale.receiptNumber,
      sale.paymentMethod,
      sale.status,
      ...(sale.items || []).map(item => item.name),
      ...(sale.items || []).map(item => item.sku),
    ].some(value => String(value || '').toLowerCase().includes(term));
  });

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateSearch(value) {
    setQuery(value);
    setPage(1);
  }

  return (
    <section className="transactions-page">
      <div className="transactions-heading">
        <div>
          <p className="eyebrow">SALES MANAGEMENT</p>
          <h1>Transactions</h1>
          <p className="muted">Review completed sales and inspect saved receipts.</p>
        </div>
        <button className="outline-button transactions-refresh" type="button" onClick={loadSales} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="transactions-summary">
        <div><span>Transactions loaded</span><strong>{sales.length}</strong></div>
        <div><span>Completed sales</span><strong>{sales.filter(s => s.status === 'completed').length}</strong></div>
        <div><span>Sales total loaded</span><strong>{money(sales.reduce((sum, sale) => sum + (Number(sale.totalPaisa) || 0), 0))}</strong></div>
      </div>

      <div className="transactions-panel">
        <div className="transactions-toolbar">
          <div>
            <h2>Sales history</h2>
            <p className="muted">{filteredSales.length} matching transaction{filteredSales.length === 1 ? '' : 's'}</p>
          </div>
          <label className="transactions-search">
            <Search size={17} />
            <input value={query} onChange={event => updateSearch(event.target.value)} placeholder="Search receipt, SKU or product…" aria-label="Search transactions" />
          </label>
        </div>

        {error && <div className="transactions-error" role="alert">{error} <button type="button" onClick={loadSales}>Try again</button></div>}
        {loading ? (
          <div className="transactions-empty">Loading transactions…</div>
        ) : !error && visibleSales.length === 0 ? (
          <div className="transactions-empty">
            <ReceiptText size={28} />
            <strong>{query ? 'No matching transactions' : 'No transactions yet'}</strong>
            <span>{query ? 'Try a different receipt number, SKU or product name.' : 'Completed POS sales will appear here.'}</span>
          </div>
        ) : !error && (
          <>
            <div className="transactions-table-wrap">
              <table className="transactions-table">
                <thead><tr>
                  <th>Receipt</th><th>Date & time</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th><th></th>
                </tr></thead>
                <tbody>
                  {visibleSales.map(sale => (
                    <tr key={sale._id}>
                      <td><strong className="transactions-receipt">{sale.receiptNumber}</strong></td>
                      <td>{sale.createdAt ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.createdAt)) : '—'}</td>
                      <td>{(sale.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}</td>
                      <td><span className="transactions-payment">{String(sale.paymentMethod || '—').toUpperCase()}</span></td>
                      <td><span className={`transactions-status ${sale.status === 'completed' ? 'is-completed' : ''}`}>{sale.status || '—'}</span></td>
                      <td><strong>{money(sale.totalPaisa)}</strong></td>
                      <td><button className="transactions-view" type="button" onClick={() => setSelectedSale(sale)}>View receipt</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="transactions-pagination">
              <span>Showing {filteredSales.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length}</span>
              <div>
                <button type="button" className="outline-button" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button type="button" className="outline-button" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedSale && (
        <div className="transactions-modal-backdrop" role="presentation" onClick={() => setSelectedSale(null)}>
          <section className="transactions-modal printable-receipt" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onClick={event => event.stopPropagation()}>
            <div className="transactions-modal-heading">
              <div><p className="eyebrow">SAVED RECEIPT</p><h2 id="transaction-detail-title">Transaction details</h2></div>
              <button type="button" className="icon-button" aria-label="Close receipt details" onClick={() => setSelectedSale(null)}><span aria-hidden="true">×</span></button>
            </div>
            <div className="transactions-receipt-meta">
              <span>Receipt number</span><strong>{selectedSale.receiptNumber}</strong>
              <span>Date</span><strong>{selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString('en-PK') : '—'}</strong>
              <span>Payment</span><strong>{String(selectedSale.paymentMethod || '—').toUpperCase()} · {selectedSale.status || '—'}</strong>
            </div>
            <div className="transactions-detail-lines">
              {(selectedSale.items || []).map((item, index) => (
                <div key={`${item.sku}-${index}`}>
                  <div><strong>{item.name}</strong><span>{item.sku} · Qty {item.quantity} × {money(item.unitPricePaisa)}</span></div>
                  <strong>{money(item.lineTotalPaisa)}</strong>
                </div>
              ))}
            </div>
            <div className="transactions-detail-total"><span>Sale total</span><strong>{money(selectedSale.totalPaisa)}</strong></div>
            {selectedSale.paymentMethod === 'cash' && (
              <div className="transactions-cash-details">
                <div><span>Cash received</span><strong>{money(selectedSale.amountReceivedPaisa ?? 0)}</strong></div>
                <div><span>Change returned</span><strong>{money(selectedSale.changePaisa ?? 0)}</strong></div>
              </div>
            )}
            <p className="transactions-demo-note">
              {selectedSale.paymentMethod === 'cash'
                ? 'Cash sale recorded by the POS.'
                : 'Card processing is not configured.'}
            </p>
            <div className="transactions-receipt-actions">
              <button type="button" className="primary-button receipt-print-button" onClick={() => window.print()}>Print Receipt</button>
              <button type="button" className="outline-button transactions-close receipt-print-button" onClick={() => setSelectedSale(null)}>Close details</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function PlaceholderPage({ title, onNavigate }) {
  const isPos = title === 'Point of Sale';
  const Icon = isPos ? ScanBarcode : title === 'Transactions' ? ReceiptText : title === 'Reports' ? ChartNoAxesCombined : Package;
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon"><Icon size={27} /></div>
      <p className="eyebrow">HZ RETAIL WORKSPACE</p>
      <h2>{title}</h2>
      <p>{pageDescriptions[title]}</p>
      <div className="coming-soon"><span className="status-dot" /> Module foundation pending</div>
      {isPos && <div className="pos-preview"><div><ScanBarcode size={20} /><span>Product search and barcode entry</span></div><div><ShoppingCart size={20} /><span>Cart, quantities and totals</span></div><div><CreditCard size={20} /><span>Simulated payment and receipt</span></div></div>}
      <button className="outline-button" onClick={() => onNavigate('Dashboard')}>Back to dashboard</button>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('Dashboard');
  const [cart, setCart] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [productSearchRequest, setProductSearchRequest] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [storeName, setStoreName] = useState('HZ Retail');
  const [storeDetails, setStoreDetails] = useState({ address: '', phone: '', email: '' });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationProducts, setNotificationProducts] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationError, setNotificationError] = useState('');


  useEffect(() => {
    let mounted = true;
    let refreshing = false;

    async function loadNotificationProducts() {
      if (refreshing) return;

      if (!currentUser) {
        setNotificationProducts([]);
        setNotificationError('');
        setNotificationLoading(false);
        return;
      }

      refreshing = true;
      setNotificationLoading(true);
      setNotificationError('');

      try {
        const allProducts = [];
        let page = 1;
        let totalPages = 1;

        do {
          const response = await fetch(
            `/api/v1/products?page=${page}&limit=100`,
            { credentials: 'same-origin' }
          );
          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result?.error?.message ||
              result?.message ||
              'Unable to load inventory alerts.'
            );
          }

          if (
            !Array.isArray(result?.data) ||
            !result?.pagination ||
            !Number.isSafeInteger(result.pagination.totalPages)
          ) {
            throw new Error('The products API returned an unexpected response.');
          }

          allProducts.push(...result.data);
          totalPages = result.pagination.totalPages;
          page += 1;
        } while (page <= totalPages);

        if (mounted) setNotificationProducts(allProducts);
      } catch (error) {
        if (mounted) {
          setNotificationError(
            error.message || 'Unable to load inventory alerts.'
          );
        }
      } finally {
        refreshing = false;
        if (mounted) setNotificationLoading(false);
      }
    }

    loadNotificationProducts();
    const intervalId = window.setInterval(loadNotificationProducts, 60000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [currentUser]);


  useEffect(() => {
    let mounted = true;

    fetch('/api/v1/auth/me', { credentials: 'same-origin' })
      .then(async response => {
        if (!response.ok) return null;
        const result = await response.json();
        return result?.data?.user || null;
      })
      .then(user => {
        if (mounted) setCurrentUser(user);
      })
      .catch(() => {
        if (mounted) setCurrentUser(null);
      })
      .finally(() => {
        if (mounted) setAuthChecking(false);
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setStoreName('HZ Retail');
      return;
    }

    let mounted = true;
    fetch('/api/v1/settings', { credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error('Could not load store settings.');
        return result?.data || {};
      })
      .then(settings => {
        if (!mounted) return;
        if (typeof settings.storeName === 'string' && settings.storeName.trim()) {
          setStoreName(settings.storeName.trim());
        }
        setStoreDetails({
          address: typeof settings.address === 'string' ? settings.address : '',
          phone: typeof settings.phone === 'string' ? settings.phone : '',
          email: typeof settings.email === 'string' ? settings.email : '',
        });
      })
      .catch(() => {
        if (mounted) {
          setStoreName('HZ Retail');
          setStoreDetails({ address: '', phone: '', email: '' });
        }
      });

    return () => { mounted = false; };
  }, [currentUser]);

  async function handleLogout() {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } finally {
      setCurrentUser(null);
      setActive('Dashboard');
    }
  }

  function navigate(page) { setActive(page); setSidebarOpen(false); }
  useEffect(() => {
    const handler = event => setActive(event.detail);
    window.addEventListener('pos:navigate', handler);
    return () => window.removeEventListener('pos:navigate', handler);
  }, []);

  useEffect(() => {
    function handleSearchShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.global-search input')?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const searchPages = [
    'Dashboard', 'Point of Sale', 'Products', 'Stock Management',
    'Transactions', 'Categories', 'Returns', 'Reports',
    'Users & Roles', 'Settings'
  ];
  const searchTerm = search.trim().toLowerCase();
  const matchingPages = searchTerm
    ? searchPages.filter(page => page.toLowerCase().includes(searchTerm)).slice(0, 5)
    : [];
  const matchingProducts = searchTerm
    ? notificationProducts.filter(product =>
        [product.name, product.sku, product.barcode, product.category]
          .some(value => String(value || '').toLowerCase().includes(searchTerm))
      ).slice(0, 6)
    : [];

  function selectSearchPage(page) {
    setActive(page);
    setSidebarOpen(false);
    setSearch('');
    setSearchOpen(false);
  }

  function selectSearchProduct(product) {
    setProductSearchRequest(String(product.name || product.sku || product.barcode || ''));
    setActive('Products');
    setSearch('');
    setSearchOpen(false);
  }

  useEffect(() => {
    let mounted = true;

    async function checkApi() {
      try {
        const response = await fetch('/api/v1/health');
        const result = response.ok ? await response.json() : null;
        if (mounted) {
          setApiStatus(result?.status === 'ok' ? 'connected' : 'disconnected');
        }
      } catch {
        if (mounted) setApiStatus('disconnected');
      }
    }

    checkApi();
    const intervalId = window.setInterval(checkApi, 30000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const dateLabel = new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  if (authChecking) {
    return (
      <main className="login-screen" role="status">
        <div className="login-brand-mark"><Store size={27} /></div>
        <p className="login-subtitle">Restoring your secure session…</p>
      </main>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const userInitials = currentUser.name
    .split(/\\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar active={active} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} storeName={storeName} storeDetails={storeDetails} />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="global-search" onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
            }}>
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onFocus={() => setSearchOpen(true)}
                  onChange={event => { setSearch(event.target.value); setSearchOpen(true); }}
                  onKeyDown={event => {
                    if (event.key === 'Escape') {
                      setSearch('');
                      setSearchOpen(false);
                    } else if (event.key === 'Enter') {
                      if (matchingPages.length) selectSearchPage(matchingPages[0]);
                      else if (matchingProducts.length) selectSearchProduct(matchingProducts[0]);
                    }
                  }}
                  placeholder="Search workspace..."
                  aria-label="Search workspace"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={searchOpen && Boolean(searchTerm)}
                  aria-controls="global-search-results"
                />
                <kbd>⌘ K</kbd>
              </label>
              {searchOpen && searchTerm && (
                <div className="global-search-results" id="global-search-results" role="listbox" aria-label="Search results">
                  {matchingPages.length > 0 && (
                    <div className="global-search-group">
                      <span className="global-search-heading">Workspace</span>
                      {matchingPages.map(page => (
                        <button type="button" key={page} className="global-search-result"
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => selectSearchPage(page)}>
                          <span>{page}</span><span className="global-search-result-meta">Open page</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchingProducts.length > 0 && (
                    <div className="global-search-group">
                      <span className="global-search-heading">Products</span>
                      {matchingProducts.map((product, index) => (
                        <button type="button"
                          key={product._id || product.id || `${product.sku || product.name}-${index}`}
                          className="global-search-result"
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => selectSearchProduct(product)}>
                          <span className="global-search-product-name">
                            {product.name || 'Unnamed product'}
                            <small>{[product.sku, product.barcode].filter(Boolean).join(' · ')}</small>
                          </span>
                          <span className="global-search-result-meta">View</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!matchingPages.length && !matchingProducts.length && (
                    <p className="global-search-empty">No matching pages or products.</p>
                  )}
                  <p className="global-search-hint">Press Enter to open the first result · Esc to close</p>
                </div>
              )}
            </div>
            <span className="topbar-date">{dateLabel}</span>
            <span className={`api-status api-status-${apiStatus}`} role="status" aria-live="polite">
              <i />
              {apiStatus === 'connected' ? 'API Connected' : apiStatus === 'checking' ? 'Checking API' : 'API Offline'}
            </span>
            <div className="notification-wrapper">
              <button
                type="button"
                className="icon-button notification-button"
                aria-label={`Inventory notifications${notificationProducts.filter(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold))).length ? `, ${notificationProducts.filter(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold))).length} stock alerts` : ''}`}
                aria-expanded={notificationOpen}
                aria-controls="inventory-notification-panel"
                onClick={() => setNotificationOpen(open => !open)}
              >
                <Bell size={19} />
                {!notificationLoading && !notificationError && notificationProducts.some(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold))) && (
                  <span className="notification-count">
                    {notificationProducts.filter(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold))).length > 99 ? '99+' : notificationProducts.filter(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold))).length}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <section
                  className="notification-panel"
                  id="inventory-notification-panel"
                  aria-label="Inventory alerts"
                >
                  <div className="notification-panel-heading">
                    <div>
                      <strong>Inventory alerts</strong>
                      <span>Stock levels that need attention</span>
                    </div>
                    <button type="button" className="notification-close" onClick={() => setNotificationOpen(false)} aria-label="Close notifications">
                      <X size={17} />
                    </button>
                  </div>
                  {notificationLoading ? (
                    <p className="notification-message" role="status">Loading inventory…</p>
                  ) : notificationError ? (
                    <p className="notification-message notification-error" role="alert">{notificationError}</p>
                  ) : (() => {
                    const alerts = notificationProducts
                      .filter(product => Number(product.stockQty) <= 0 || (Number(product.lowStockThreshold) > 0 && Number(product.stockQty) <= Number(product.lowStockThreshold)))
                      .sort((a, b) => Number(a.stockQty) - Number(b.stockQty));

                    return alerts.length ? (
                      <div className="notification-list">
                        {alerts.map(product => {
                          const outOfStock = Number(product.stockQty) <= 0;
                          return (
                            <button
                              type="button"
                              className="notification-item"
                              key={product._id}
                              onClick={() => {
                                setActive('Products');
                                setNotificationOpen(false);
                              }}
                            >
                              <span className={`notification-item-icon ${outOfStock ? 'out-of-stock' : 'low-stock'}`}>
                                <AlertTriangle size={17} />
                              </span>
                              <span className="notification-item-details">
                                <strong>{product.name}</strong>
                                <span>{outOfStock ? 'Out of stock' : 'Low stock'} · {Number(product.stockQty)} units left</span>
                                <small>Threshold: {Number(product.lowStockThreshold)} units · View products</small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="notification-empty">
                        <Package size={25} />
                        <strong>All stock levels look good</strong>
                        <span>No low-stock or out-of-stock products found.</span>
                      </div>
                    );
                  })()}
                  {!notificationLoading && !notificationError && (
                    <button
                      type="button"
                      className="notification-view-all"
                      onClick={() => {
                        setActive('Stock Management');
                        setNotificationOpen(false);
                      }}
                    >
                      View stock management
                    </button>
                  )}
                </section>
              )}
            </div>
            <div className="user-profile">
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <strong>{currentUser.name}</strong>
                <span>{currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>
              </div>
              <button
                type="button"
                className="outline-button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="page-container">
          {active === 'Dashboard'
            ? <Dashboard />
            : active === 'Point of Sale'
            ? <PosPage cart={cart} setCart={setCart} />
            : active === 'Products'
            ? <ProductsPage initialSearch={productSearchRequest} />
            : active === 'Stock Management'
            ? <StockManagementPage />
            : active === 'Transactions'
            ? <TransactionsPage />
            : active === 'Categories'
            ? <CategoriesPage />
            : active === 'Returns'
            ? <ReturnsPage />
            : active === 'Reports'
            ? <ReportsPage />
            : active === 'Users & Roles'
            ? <UsersPage />
            : active === 'Settings'
            ? <SettingsPage currentUser={currentUser} onSaved={savedSettings => {
                if (typeof savedSettings?.storeName === 'string' && savedSettings.storeName.trim()) {
                  setStoreName(savedSettings.storeName.trim());
                }
                setStoreDetails({
                  address: typeof savedSettings?.address === 'string' ? savedSettings.address : '',
                  phone: typeof savedSettings?.phone === 'string' ? savedSettings.phone : '',
                  email: typeof savedSettings?.email === 'string' ? savedSettings.email : '',
                });
              }} />
            : <PlaceholderPage title={active} onNavigate={navigate} />}
        </div>
        <footer className="app-footer"><span>© {new Date().getFullYear()} HZ Tech Cloud</span><span>Retail operations, made simpler.</span></footer>
      </main>
    </div>
  );
}
