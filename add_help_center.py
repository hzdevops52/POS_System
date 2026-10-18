
from pathlib import Path

app = Path.home() / "hz-retail-pos/frontend/src/App.jsx"
source = app.read_text()

state_marker = "const [helpOpen, setHelpOpen] = useState(false);"
if state_marker in source:
    print("Help state already exists. No changes made.")
    raise SystemExit(0)

old_state = """function Sidebar({ active, onNavigate, open, onClose, storeName = 'HZ Retail', storeDetails = {} }) {
  const [storeDetailsOpen, setStoreDetailsOpen] = useState(false);"""

new_state = """function Sidebar({ active, onNavigate, open, onClose, storeName = 'HZ Retail', storeDetails = {} }) {
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
  );"""

old_footer = """        <div className="sidebar-footer">
          <div className="help-icon">?</div>
          <div><strong>Need a hand?</strong><span>Help & documentation</span></div>
          <ArrowUpRight size={15} />
        </div>"""

new_footer = """        <button type="button" className="sidebar-footer sidebar-help-button" onClick={() => { setHelpQuery(''); setHelpOpen(true); }} aria-haspopup="dialog">
          <span className="help-icon">?</span>
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
        )}"""

if old_state not in source:
    raise SystemExit("Sidebar state anchor not found. App.jsx was not changed.")

if old_footer not in source:
    raise SystemExit("Sidebar footer anchor not found. App.jsx was not changed.")

updated = source.replace(old_state, new_state, 1)
updated = updated.replace(old_footer, new_footer, 1)
app.write_text(updated)
print("Success: Help & Documentation dialog added to App.jsx.")
