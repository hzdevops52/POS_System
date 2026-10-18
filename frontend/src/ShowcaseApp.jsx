
import React, { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, ReceiptText,
  ChartNoAxesCombined, Settings, Users, SlidersHorizontal,
  Store, Bell, Search, Menu, X, CircleDollarSign,
  ShoppingBag, TrendingUp, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Download, Eye, ShieldCheck, LockKeyhole
} from 'lucide-react';
import './showcase.css';

const sections = [
  { title: 'WORKSPACE', items: [['Dashboard', LayoutDashboard], ['Point of Sale', ShoppingCart]] },
  { title: 'INVENTORY', items: [['Products', Package], ['Stock Management', Boxes], ['Categories', SlidersHorizontal]] },
  { title: 'SALES', items: [['Transactions', ReceiptText], ['Returns', ArrowDownRight], ['Reports', ChartNoAxesCombined]] },
  { title: 'ADMINISTRATION', items: [['Users & Roles', Users], ['Settings', Settings]] }
];

const products = [
  { name: 'Wireless Mouse', sku: 'ACC-001', category: 'Accessories', price: 2499, stock: 42 },
  { name: 'USB-C Hub', sku: 'ELC-014', category: 'Electronics', price: 5499, stock: 8 },
  { name: 'Notebook Set', sku: 'STA-008', category: 'Stationery', price: 899, stock: 64 },
  { name: 'Desk Organizer', sku: 'HOM-022', category: 'Home & Living', price: 1799, stock: 4 },
  { name: 'Mechanical Keyboard', sku: 'ELC-031', category: 'Electronics', price: 8499, stock: 17 },
  { name: 'Laptop Stand', sku: 'ACC-016', category: 'Accessories', price: 3299, stock: 12 }
];

const sales = [
  { receipt: 'POS-1048', customer: 'Walk-in customer', date: '18 Oct 2026', amount: 12450, method: 'Cash', status: 'Completed' },
  { receipt: 'POS-1047', customer: 'Walk-in customer', date: '18 Oct 2026', amount: 8299, method: 'Card', status: 'Completed' },
  { receipt: 'POS-1046', customer: 'Retail customer', date: '18 Oct 2026', amount: 3750, method: 'Cash', status: 'Completed' },
  { receipt: 'POS-1045', customer: 'Walk-in customer', date: '17 Oct 2026', amount: 15990, method: 'Cash', status: 'Completed' },
  { receipt: 'POS-1044', customer: 'Retail customer', date: '17 Oct 2026', amount: 2199, method: 'Card', status: 'Completed' }
];

const money = value => `Rs ${Number(value).toLocaleString('en-PK')}`;

function Badge({ children, tone = 'green' }) {
  return <span className={`showcase-badge ${tone}`}>{children}</span>;
}

function DemoDashboard({ navigate }) {
  const bars = [35, 48, 41, 63, 51, 76, 59, 84, 67, 92, 72, 100];
  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">STORE OVERVIEW</p>
          <h2>Good morning, Admin <span>👋</span></h2>
          <p className="muted">Here is a snapshot of your store's performance.</p>
        </div>
        <Badge>DEMO ENVIRONMENT</Badge>
      </div>

      <div className="notice">
        <span className="notice-icon"><ShieldCheck size={20} /></span>
        <div><strong>Welcome to the HZ Retail POS demo</strong>
          <p>Explore the interface using sample data. No real transactions or inventory changes are processed.</p>
        </div>
      </div>

      <div className="metrics-grid">
        {[
          ["Today's Sales", money(48750), '+12.8% vs. yesterday', CircleDollarSign, 'green'],
          ['Transactions', '24', 'Sample completed sales', ShoppingBag, 'sage'],
          ['Average Sale', money(2031), 'Average transaction value', TrendingUp, 'amber'],
          ['Low Stock Items', '2', 'Items need replenishment', AlertTriangle, 'red']
        ].map(([title, value, foot, Icon, tone]) => (
          <article className="metric-card" key={title}>
            <div className="metric-top">{title}<span className={`metric-icon ${tone}`}><Icon size={18} /></span></div>
            <div className="metric-value">{value}</div>
            <div className="metric-foot">{foot}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading"><div><h3>Sales performance</h3><p className="muted">Illustrative activity across the day</p></div><Badge>Sample</Badge></div>
          <div className="showcase-chart">
            {bars.map((height, index) => <div className="showcase-bar-column" key={index}>
              <span className="showcase-bar" style={{ height: `${height}%` }} />
              <small>{index % 3 === 0 ? `${index + 8}:00` : ''}</small>
            </div>)}
          </div>
          <div className="showcase-chart-legend"><span><i /> Sales activity</span><strong>{money(48750)}</strong></div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h3>Inventory overview</h3><p className="muted">Example stock distribution</p></div><Boxes size={19} className="heading-icon" /></div>
          <div className="showcase-inventory">
            <div><span>Healthy stock</span><strong>78%</strong><i><b style={{ width: '78%' }} /></i></div>
            <div><span>Low stock</span><strong>15%</strong><i><b className="amber-fill" style={{ width: '15%' }} /></i></div>
            <div><span>Out of stock</span><strong>7%</strong><i><b className="red-fill" style={{ width: '7%' }} /></i></div>
          </div>
          <button className="outline-button" onClick={() => navigate('Stock Management')}>View inventory <ArrowUpRight size={15} /></button>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><h3>Recent transactions</h3><p className="muted">A preview of the sales register</p></div>
          <button className="subtle-button" onClick={() => navigate('Transactions')}>View all <ArrowUpRight size={15} /></button></div>
        <SalesTable limit={4} />
      </section>
      <p className="demo-disclaimer">All figures, products, and transactions shown are fictional demonstration data.</p>
    </div>
  );
}

function SalesTable({ limit = 5 }) {
  return <div className="table-wrap"><table>
    <thead><tr><th>RECEIPT</th><th>CUSTOMER</th><th>PAYMENT</th><th>STATUS</th><th className="align-right">TOTAL</th></tr></thead>
    <tbody>{sales.slice(0, limit).map(sale => <tr key={sale.receipt}>
      <td><strong>{sale.receipt}</strong></td><td>{sale.customer}</td><td>{sale.method}</td>
      <td><Badge>{sale.status}</Badge></td><td className="align-right">{money(sale.amount)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function ProductsView() {
  const [query, setQuery] = useState('');
  const filtered = products.filter(product => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeading eyebrow="INVENTORY" title="Products" description="Browse the example product catalogue." />
    <div className="showcase-toolbar"><label className="showcase-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sample products..." /></label><Badge>{filtered.length} products</Badge></div>
    <section className="panel"><div className="table-wrap"><table>
      <thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th></tr></thead>
      <tbody>{filtered.map(p => <tr key={p.sku}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><Badge tone={p.stock <= 8 ? 'amber' : 'green'}>{p.stock <= 8 ? 'Low stock' : 'In stock'}</Badge></td></tr>)}</tbody>
    </table></div></section>
    <p className="demo-disclaimer">Search is interactive. Product edits and stock changes are disabled in this static demo.</p>
  </>;
}

function TransactionsView() {
  return <><PageHeading eyebrow="SALES" title="Transactions" description="Review example receipts and payment records." />
    <div className="metrics-grid">{[['Sales shown','5'],['Sample revenue',money(sales.reduce((sum, s) => sum + s.amount, 0))],['Payment types','Cash & card'],['Record type','Fictional']].map(([k,v]) => <article className="metric-card" key={k}><div className="metric-top">{k}</div><div className="metric-value">{v}</div></article>)}</div>
    <section className="panel"><div className="panel-heading"><div><h3>Sales register</h3><p className="muted">Example completed transactions</p></div><Download size={18} className="heading-icon" /></div><SalesTable /></section>
  </>;
}

function StockView() {
  return <><PageHeading eyebrow="INVENTORY" title="Stock management" description="See how a stock monitoring workspace is organized." />
    <div className="metrics-grid">{[['Products tracked','6'],['Units in stock','147'],['Low-stock items','2'],['Stock movements','Demo only']].map(([k,v]) => <article className="metric-card" key={k}><div className="metric-top">{k}</div><div className="metric-value">{v}</div></article>)}</div>
    <section className="panel"><div className="panel-heading"><div><h3>Current inventory</h3><p className="muted">Sample quantities and reorder status</p></div></div><div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>ON HAND</th><th>REORDER STATUS</th></tr></thead><tbody>{products.map(p => <tr key={p.sku}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{p.stock}</td><td><Badge tone={p.stock <= 8 ? 'amber' : 'green'}>{p.stock <= 8 ? 'Review stock' : 'Healthy'}</Badge></td></tr>)}</tbody></table></div></section>
  </>;
}

function ReportsView() {
  const [range, setRange] = useState('7 days');
  return <><PageHeading eyebrow="ANALYTICS" title="Reports" description="Explore a sample view of retail performance reporting." />
    <div className="showcase-toolbar"><span className="muted">Reporting period</span><select value={range} onChange={e => setRange(e.target.value)}><option>7 days</option><option>30 days</option><option>90 days</option></select><Badge>Sample report</Badge></div>
    <div className="metrics-grid">{[['Gross sales',money(range === '7 days' ? 184500 : range === '30 days' ? 762300 : 2148900)],['Transactions',range === '7 days' ? '96' : range === '30 days' ? '398' : '1,142'],['Average order',money(1922)],['Return rate','1.8%']].map(([k,v]) => <article className="metric-card" key={k}><div className="metric-top">{k}</div><div className="metric-value">{v}</div></article>)}</div>
    <section className="panel"><div className="panel-heading"><div><h3>Performance summary</h3><p className="muted">Illustrative metrics for {range}</p></div></div><div className="showcase-report"><div><span>Sales target</span><strong>82% achieved</strong><i><b style={{ width: '82%' }} /></i></div><div><span>Inventory availability</span><strong>94%</strong><i><b style={{ width: '94%' }} /></i></div><div><span>Completed transactions</span><strong>98.2%</strong><i><b style={{ width: '98.2%' }} /></i></div></div></section>
    <p className="demo-disclaimer">Changing the period updates illustrative figures only. This report is not connected to a database.</p>
  </>;
}

function PageHeading({ eyebrow, title, description }) {
  return <div className="welcome-row"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="muted">{description}</p></div><Badge>Static showcase</Badge></div>;
}

function PlaceholderView({ title }) {
  const descriptions = {
    'Point of Sale': 'The checkout workspace is represented for demonstration. Payment processing is disabled.',
    Categories: 'Product categories organize the catalogue. Editing and category management require the live application.',
    Returns: 'Return review and refund workflows require the live backend. No refunds are performed in this showcase.',
    'Users & Roles': 'Role-based access controls belong to the live POS installation.',
    Settings: 'Store configuration is managed within the live POS installation.'
  };
  return <><PageHeading eyebrow="WORKSPACE PREVIEW" title={title} description={descriptions[title] || 'Explore this area of the POS interface.'} />
    <section className="panel showcase-placeholder"><span className="showcase-lock"><LockKeyhole size={24} /></span><h3>{title} preview</h3><p>This feature requires the live application and its secured backend.</p><Badge tone="amber">Read-only demo</Badge></section>
  </>;
}

export default function ShowcaseApp() {
  const [active, setActive] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = page => { setActive(page); setSidebarOpen(false); };
  const initials = 'HZ';
  return <div className="app-layout showcase-app">
    <div className="showcase-banner"><ShieldCheck size={15} /> PORTFOLIO DEMO <span>Sample data only · No real transactions</span></div>
    {sidebarOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><ShoppingBag size={22} /></div><div><strong>HZ Retail</strong><span>POS MANAGEMENT</span></div><button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="store-switcher"><span className="store-avatar">HZ</span><span className="store-copy"><strong>Demo Store</strong><span>Sample workspace</span></span><Store size={16} /></div>
      <nav className="navigation">{sections.map(section => <div className="nav-group" key={section.title}><p className="nav-heading">{section.title}</p>{section.items.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? 'nav-active' : ''}`} onClick={() => navigate(label)}><Icon size={18} /><span>{label}</span></button>)}</div>)}</nav>
      <div className="sidebar-footer"><span className="help-icon"><ShieldCheck size={16} /></span><div><strong>Showcase mode</strong><span>Read-only sample data</span></div></div><div className="sidebar-version">HZ Retail POS <span>•</span> Demo</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div></div>
        <div className="topbar-actions"><label className="showcase-search top-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const page = sections.flatMap(s => s.items.map(i => i[0])).find(p => p.toLowerCase().includes(search.toLowerCase())); if (page) navigate(page); } }} placeholder="Find a workspace..." /></label><span className="topbar-date">18 Oct 2026</span><span className="showcase-user"><span className="user-avatar">{initials}</span><span><strong>Demo Admin</strong><small>Administrator</small></span></span></div>
      </header>
      <div className="page-container">
        {active === 'Dashboard' ? <DemoDashboard navigate={navigate} />
          : active === 'Products' ? <ProductsView />
          : active === 'Transactions' ? <TransactionsView />
          : active === 'Stock Management' ? <StockView />
          : active === 'Reports' ? <ReportsView />
          : <PlaceholderView title={active} />}
      </div>
      <footer className="app-footer"><span>HZ Retail POS · Portfolio demonstration</span><span>Sample data only · Backend disconnected</span></footer>
    </main>
  </div>;
}
