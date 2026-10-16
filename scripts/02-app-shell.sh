#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building HZ Retail POS application shell..."

mkdir -p frontend/src/components frontend/src/pages

cat > frontend/src/App.jsx <<'EOF'
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, ReceiptText,
  ChartNoAxesCombined, Settings, Users, Search, Bell, Menu, X,
  ChevronDown, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CircleDollarSign, ShoppingBag, TrendingUp, Clock3, Plus,
  ScanBarcode, CreditCard, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import './app.css';

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

function Sidebar({ active, onNavigate, open, onClose }) {
  return (
    <>
      {open && <button className="mobile-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><ShoppingBag size={23} strokeWidth={2.2} /></div>
          <div><strong>HZ Retail</strong><span>POS MANAGEMENT</span></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={onClose}><X size={19} /></button>
        </div>

        <div className="store-switcher">
          <div className="store-avatar">HZ</div>
          <div className="store-copy"><strong>My Store</strong><span>Retail workspace</span></div>
          <ChevronDown size={16} className="store-chevron" />
        </div>

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

        <div className="sidebar-footer">
          <div className="help-icon">?</div>
          <div><strong>Need a hand?</strong><span>Help & documentation</span></div>
          <ArrowUpRight size={15} />
        </div>
        <div className="sidebar-version">HZ Retail POS <span>•</span> Development</div>
      </aside>
    </>
  );
}

function Dashboard() {
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">WEDNESDAY · STORE OVERVIEW</p>
          <h2>Good morning <span>👋</span></h2>
          <p className="muted">Here is what is happening at your store today.</p>
        </div>
        <button className="primary-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Point of Sale' }))}>
          <Plus size={17} /> New sale
        </button>
      </div>

      <div className="notice">
        <div className="notice-icon"><Clock3 size={18} /></div>
        <div><strong>Your store is ready for setup</strong><p>Connect your catalogue and record opening stock to begin using your POS.</p></div>
      </div>

      <div className="section-heading">
        <div><h3>Business overview</h3><p className="muted">A snapshot of your store's performance</p></div>
        <button className="date-filter"><Clock3 size={15} /> Today <ChevronDown size={15} /></button>
      </div>

      <div className="metrics-grid">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <article className="metric-card" key={metric.title}>
              <div className="metric-top"><span>{metric.title}</span><span className={`metric-icon ${metric.tone}`}><Icon size={19} /></span></div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-foot"><span>{metric.change}</span></div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel sales-panel">
          <div className="panel-heading"><div><h3>Sales activity</h3><p className="muted">Your sales throughout the day</p></div><button className="subtle-button">View reports <ArrowUpRight size={15} /></button></div>
          <div className="chart-empty">
            <div className="chart-symbol"><ChartNoAxesCombined size={25} /></div>
            <strong>No sales activity yet</strong>
            <p>Completed sales will appear here once transactions are recorded.</p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h3>Inventory health</h3><p className="muted">Stock status at a glance</p></div><Boxes size={19} className="heading-icon" /></div>
          <div className="inventory-empty">
            <div className="inventory-icon"><Package size={22} /></div>
            <strong>No inventory data yet</strong>
            <p>Add products and stock quantities to see inventory health.</p>
          </div>
          <button className="outline-button full-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Products' }))}><Plus size={16} /> Add your first product</button>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><h3>Recent transactions</h3><p className="muted">Your latest completed sales</p></div><button className="subtle-button" onClick={() => window.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'Transactions' }))}>View all <ArrowUpRight size={15} /></button></div>
        <div className="table-wrap">
          <table><thead><tr><th>TRANSACTION</th><th>TIME</th><th>ITEMS</th><th>PAYMENT</th><th className="align-right">TOTAL</th></tr></thead>
            <tbody><tr><td colSpan="5"><div className="table-empty"><ReceiptText size={21} /><span>No transactions to display</span><small>Sales receipts will appear here.</small></div></td></tr></tbody>
          </table>
        </div>
      </section>
      <p className="demo-disclaimer">Development preview · Dashboard figures are placeholders until connected to live application data.</p>
    </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  function navigate(page) { setActive(page); }
  useState(() => {
    const handler = event => setActive(event.detail);
    window.addEventListener('pos:navigate', handler);
    return () => window.removeEventListener('pos:navigate', handler);
  });

  const dateLabel = new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  return (
    <div className="app-layout">
      <Sidebar active={active} onNavigate={navigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div>
          </div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workspace..." aria-label="Search workspace" /> <kbd>⌘ K</kbd></label>
            <span className="topbar-date">{dateLabel}</span>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="user-profile"><div className="user-avatar">HZ</div><div className="user-info"><strong>Store Admin</strong><span>Administrator</span></div><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="page-container">
          {active === 'Dashboard' ? <Dashboard /> : <PlaceholderPage title={active} onNavigate={navigate} />}
        </div>
        <footer className="app-footer"><span>© {new Date().getFullYear()} HZ Tech Cloud</span><span>Retail operations, made simpler.</span></footer>
      </main>
    </div>
  );
}
EOF

cat > frontend/src/app.css <<'EOF'
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #252A27;
  background: #F7F7F2;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  font-size: 14px;
  font-weight: 400;
  --canvas: #F7F7F2;
  --forest: #244C3A;
  --deep-forest: #1B3B2C;
  --surface: #FFFFFF;
  --charcoal: #252A27;
  --muted: #66716A;
  --border: #DADDD5;
  --sage: #DCE8DE;
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; min-height: 100vh; }
button, input { font: inherit; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible { outline: 2px solid #557D64; outline-offset: 2px; }
.app-layout { min-height: 100vh; }
.sidebar { width: 236px; background: var(--surface); border-right: 1px solid var(--border); position: fixed; inset: 0 auto 0 0; z-index: 20; display: flex; flex-direction: column; padding: 22px 14px 13px; }
.brand { display: flex; align-items: center; gap: 11px; padding: 0 7px 23px; }
.brand-mark { width: 39px; height: 39px; border-radius: 11px; background: var(--forest); color: white; display: grid; place-items: center; }
.brand strong { display: block; font-size: 16px; letter-spacing: -.5px; }
.brand span { display: block; margin-top: 3px; color: var(--muted); font-size: 9px; font-weight: 750; letter-spacing: 1.1px; }
.store-switcher { display: flex; align-items: center; gap: 10px; background: #F7F8F5; border: 1px solid #E8EAE4; border-radius: 9px; padding: 10px; margin-bottom: 23px; }
.store-avatar, .user-avatar { display: grid; place-items: center; background: var(--sage); color: var(--forest); font-weight: 800; border-radius: 8px; }
.store-avatar { width: 34px; height: 34px; font-size: 12px; }
.store-copy { flex: 1; min-width: 0; }
.store-copy strong, .store-copy span { display: block; }
.store-copy strong { font-size: 12px; }
.store-copy span { color: var(--muted); font-size: 11px; margin-top: 3px; }
.store-chevron { color: var(--muted); }
.navigation { flex: 1; overflow-y: auto; }
.nav-group { margin-bottom: 21px; }
.nav-heading { color: #879087; font-size: 9px; letter-spacing: 1.15px; font-weight: 800; padding: 0 11px; margin: 0 0 8px; }
.nav-item { border: 0; background: transparent; width: 100%; min-height: 39px; border-radius: 7px; padding: 0 11px; display: flex; align-items: center; gap: 11px; color: #59635C; text-align: left; margin: 2px 0; font-size: 12px; font-weight: 550; }
.nav-item:hover { background: #F5F7F3; color: var(--forest); }
.nav-active, .nav-active:hover { background: #EAF0E9; color: var(--forest); font-weight: 750; }
.nav-active::before { content: ""; position: absolute; left: 0; width: 3px; height: 28px; background: var(--forest); border-radius: 0 4px 4px 0; }
.nav-item span:nth-child(2) { flex: 1; }
.nav-shortcut { font-size: 9px; color: var(--forest); background: #DCE8DE; padding: 3px 5px; border-radius: 4px; }
.sidebar-footer { display: flex; align-items: center; gap: 9px; padding: 13px 7px; border-top: 1px solid #ECEEE8; color: var(--muted); }
.help-icon { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 50%; display: grid; place-items: center; font-weight: 750; color: var(--forest); }
.sidebar-footer div:nth-child(2) { flex: 1; }
.sidebar-footer strong, .sidebar-footer span { display: block; }
.sidebar-footer strong { font-size: 11px; color: var(--charcoal); }
.sidebar-footer span { font-size: 10px; margin-top: 3px; }
.sidebar-version { font-size: 10px; color: #8A938C; padding: 8px 7px 0; }
.sidebar-version span { padding: 0 4px; color: #A8B5A9; }
.main-area { margin-left: 236px; min-height: 100vh; display: flex; flex-direction: column; }
.topbar { height: 64px; flex-shrink: 0; background: rgba(255,255,255,.92); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 29px; gap: 20px; }
.topbar-left, .topbar-actions { display: flex; align-items: center; gap: 17px; min-width: 0; }
.breadcrumb { font-size: 12px; color: var(--muted); white-space: nowrap; }
.breadcrumb span { padding: 0 8px; color: #A4ABA4; }
.breadcrumb strong { color: var(--charcoal); font-weight: 700; }
.topbar-actions { gap: 19px; }
.search-box { width: 222px; height: 35px; border: 1px solid #E2E5DE; border-radius: 7px; display: flex; align-items: center; gap: 8px; padding: 0 9px; color: #879087; background: #FCFCFA; }
.search-box input { border: 0; outline: none; min-width: 0; width: 100%; background: transparent; color: var(--charcoal); font-size: 11px; }
.search-box input:focus-visible { outline: none; }
.search-box kbd { font-size: 9px; white-space: nowrap; background: #F0F1EC; border: 1px solid #E2E5DE; border-radius: 4px; padding: 2px 4px; }
.topbar-date { font-size: 11px; color: var(--muted); white-space: nowrap; }
.icon-button { border: 0; background: transparent; color: #59635C; display: grid; place-items: center; padding: 6px; border-radius: 7px; position: relative; }
.icon-button:hover { background: #F1F4EF; }
.notification-button i { position: absolute; top: 5px; right: 5px; width: 6px; height: 6px; background: #C47B2A; border: 1px solid white; border-radius: 50%; }
.user-profile { display: flex; align-items: center; gap: 9px; border-left: 1px solid #E5E7E1; padding-left: 17px; }
.user-avatar { width: 33px; height: 33px; font-size: 11px; }
.user-info strong, .user-info span { display: block; white-space: nowrap; }
.user-info strong { font-size: 11px; }
.user-info span { font-size: 10px; color: var(--muted); margin-top: 3px; }
.user-profile > svg { color: var(--muted); }
.page-container { width: 100%; max-width: 1600px; padding: 31px 30px 25px; margin: 0 auto; flex: 1; }
.dashboard-content { max-width: 1250px; margin: 0 auto; }
.welcome-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 25px; }
.eyebrow { font-size: 9px; letter-spacing: 1.2px; color: #748076; font-weight: 800; margin: 0 0 10px; }
h2, h3, p { margin-top: 0; }
.welcome-row h2 { font-size: clamp(23px, 2vw, 29px); letter-spacing: -1px; margin: 0 0 8px; font-weight: 750; }
.welcome-row h2 span { font-size: 21px; }
.muted { color: var(--muted); }
.welcome-row .muted, .section-heading .muted, .panel-heading .muted { font-size: 11px; margin: 0; line-height: 1.5; }
.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: var(--forest); color: white; border: 1px solid var(--forest); padding: 10px 15px; border-radius: 7px; font-weight: 650; font-size: 11px; white-space: nowrap; }
.primary-button:hover { background: var(--deep-forest); }
.notice { display: flex; align-items: center; gap: 13px; border: 1px solid #DCE5D8; background: #F0F4EC; border-radius: 9px; padding: 14px 16px; margin-bottom: 27px; }
.notice-icon { display: grid; place-items: center; width: 35px; height: 35px; border-radius: 8px; background: white; color: var(--forest); flex-shrink: 0; }
.notice strong { font-size: 12px; display: block; margin-bottom: 4px; }
.notice p { color: #647067; font-size: 11px; margin: 0; line-height: 1.5; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-heading h3, .panel-heading h3 { font-size: 14px; letter-spacing: -.25px; margin: 0 0 5px; }
.date-filter, .subtle-button { display: inline-flex; align-items: center; gap: 7px; color: #4F5B52; background: white; border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 10px; white-space: nowrap; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 24px; }
.metric-card { background: white; border: 1px solid var(--border); border-radius: 9px; padding: 16px; min-width: 0; }
.metric-top { display: flex; align-items: center; justify-content: space-between; gap: 7px; color: #5D675F; font-size: 11px; font-weight: 600; }
.metric-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; }
.metric-icon.green { color: var(--forest); background: #E8F0E7; }
.metric-icon.sage { color: #557760; background: #EAF0E9; }
.metric-icon.amber { color: #9A641C; background: #F8EFDF; }
.metric-icon.red { color: #B5473C; background: #F8E9E6; }
.metric-value { font-size: clamp(20px, 2vw, 27px); font-weight: 760; letter-spacing: -.8px; margin: 15px 0 10px; overflow-wrap: anywhere; }
.metric-foot { display: flex; align-items: center; gap: 5px; color: #818B82; font-size: 10px; }
.dashboard-grid { display: grid; grid-template-columns: 1.45fr 1fr; gap: 16px; margin-bottom: 19px; }
.panel { background: white; border: 1px solid var(--border); border-radius: 9px; min-width: 0; overflow: hidden; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 17px 17px 13px; }
.subtle-button { border: 0; padding: 6px; font-weight: 650; }
.subtle-button:hover { color: var(--forest); background: #F4F6F1; }
.heading-icon { color: #738174; }
.chart-empty { min-height: 205px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; padding: 22px; }
.chart-symbol { width: 45px; height: 45px; display: grid; place-items: center; border-radius: 12px; background: #F1F4EF; color: var(--forest); margin-bottom: 12px; }
.chart-empty strong, .inventory-empty strong { font-size: 12px; margin-bottom: 6px; }
.chart-empty p, .inventory-empty p { font-size: 10px; line-height: 1.6; color: #7A847C; max-width: 270px; margin: 0; }
.inventory-empty { min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 18px; }
.inventory-icon { display: grid; place-items: center; width: 43px; height: 43px; border-radius: 12px; color: var(--forest); background: #F0F4EC; margin-bottom: 12px; }
.outline-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 12px; color: var(--forest); border: 1px solid #CAD6C9; background: white; border-radius: 6px; font-size: 10px; font-weight: 700; }
.outline-button:hover { background: #F3F6F1; }
.full-button { margin: 0 16px 16px; width: calc(100% - 32px); }
.recent-panel { margin-bottom: 12px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; text-align: left; white-space: nowrap; }
thead { background: #F8F9F6; }
th { font-size: 9px; letter-spacing: .7px; color: #7C867D; font-weight: 750; padding: 11px 16px; border-top: 1px solid #ECEEE8; border-bottom: 1px solid #ECEEE8; }
td { padding: 0 16px; font-size: 11px; }
.align-right { text-align: right; }
.table-empty { min-height: 112px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: #7C867D; }
.table-empty svg { color: #8C9A8D; margin-bottom: 2px; }
.table-empty span { color: #5D675F; font-size: 11px; font-weight: 650; }
.table-empty small { font-size: 10px; }
.demo-disclaimer { color: #7D877E; font-size: 10px; text-align: center; margin: 17px 0 0; }
.app-footer { display: flex; justify-content: space-between; gap: 12px; padding: 15px 30px; border-top: 1px solid var(--border); color: #818B82; font-size: 10px; background: rgba(255,255,255,.45); }
.placeholder-page { min-height: 65vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 35px 15px; }
.placeholder-icon { width: 57px; height: 57px; border-radius: 15px; display: grid; place-items: center; background: #E6EEE4; color: var(--forest); margin-bottom: 23px; }
.placeholder-page .eyebrow { margin-bottom: 8px; }
.placeholder-page h2 { font-size: 28px; letter-spacing: -.7px; margin-bottom: 10px; }
.placeholder-page > p:not(.eyebrow) { color: var(--muted); max-width: 390px; font-size: 12px; line-height: 1.7; margin-bottom: 17px; }
.coming-soon { display: flex; align-items: center; gap: 7px; background: white; border: 1px solid var(--border); border-radius: 30px; padding: 8px 12px; color: #5C695F; font-size: 10px; margin-bottom: 23px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #C28A36; }
.pos-preview { width: min(100%, 360px); border: 1px solid var(--border); border-radius: 9px; background: white; padding: 7px 15px; margin: 0 0 22px; text-align: left; }
.pos-preview div { display: flex; align-items: center; gap: 12px; padding: 12px 0; font-size: 11px; color: #536055; }
.pos-preview div + div { border-top: 1px solid #ECEEE8; }
.pos-preview svg { color: var(--forest); }
.menu-button, .sidebar-close, .mobile-backdrop { display: none; }

@media (min-width: 1500px) {
  .page-container { padding-left: 42px; padding-right: 42px; }
  .metrics-grid { gap: 18px; }
  .metric-card { padding: 19px; }
}
@media (max-width: 1200px) {
  .topbar { padding: 0 20px; }
  .page-container { padding: 26px 20px; }
  .topbar-actions { gap: 12px; }
  .search-box { width: 185px; }
  .topbar-date { display: none; }
  .metrics-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform .22s ease; box-shadow: none; }
  .sidebar.sidebar-open { transform: translateX(0); box-shadow: 12px 0 40px rgba(20,40,25,.12); }
  .sidebar-close { display: grid; margin-left: auto; }
  .mobile-backdrop { display: block; position: fixed; inset: 0; z-index: 19; background: rgba(22,35,26,.35); border: 0; }
  .main-area { margin-left: 0; }
  .menu-button { display: grid; }
  .topbar { padding: 0 18px; }
  .dashboard-grid { grid-template-columns: 1fr; }
  .chart-empty { min-height: 175px; }
}
@media (max-width: 600px) {
  .topbar { height: 58px; padding: 0 12px; }
  .topbar-left, .topbar-actions { gap: 8px; }
  .breadcrumb { font-size: 11px; }
  .breadcrumb span { padding: 0 4px; }
  .search-box { width: 35px; padding: 0 8px; border-color: transparent; background: transparent; }
  .search-box input, .search-box kbd { display: none; }
  .user-profile { padding-left: 9px; gap: 0; border-left: 0; }
  .user-info, .user-profile > svg { display: none; }
  .user-avatar { width: 31px; height: 31px; }
  .topbar-actions { gap: 5px; }
  .page-container { padding: 23px 13px; }
  .welcome-row { align-items: flex-start; }
  .welcome-row h2 { font-size: 23px; }
  .welcome-row .muted { max-width: 245px; line-height: 1.6; }
  .primary-button { padding: 9px 10px; font-size: 10px; }
  .notice { align-items: flex-start; padding: 12px; }
  .notice p { line-height: 1.6; }
  .metrics-grid { gap: 9px; }
  .metric-card { padding: 12px; }
  .metric-top { align-items: flex-start; font-size: 10px; }
  .metric-icon { width: 29px; height: 29px; }
  .metric-icon svg { width: 16px; }
  .metric-value { font-size: 21px; margin: 12px 0 8px; }
  .metric-foot { font-size: 9px; }
  .section-heading h3 { font-size: 13px; }
  .section-heading .muted { max-width: 225px; line-height: 1.6; }
  .panel-heading { padding: 14px 12px 11px; }
  .panel-heading h3 { font-size: 12px; }
  .app-footer { padding: 13px; font-size: 9px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
}
EOF

cat > frontend/src/main.jsx <<'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "==> Checking frontend build..."
npm --prefix frontend run build
echo "==> Application shell created successfully."
