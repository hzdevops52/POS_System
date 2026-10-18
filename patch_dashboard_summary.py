
from pathlib import Path
from datetime import datetime

path = Path("frontend/src/App.jsx")
source = path.read_text()

start = source.find("function Dashboard() {")
end = source.find("function ProductsPage(", start)

if start < 0 or end < 0:
    raise SystemExit("STOP: Dashboard boundaries not found.")

dashboard = source[start:end]

replacements = [
    (
        "  const [sales, setSales] = useState([]);\n",
        "  const [sales, setSales] = useState([]);\n"
        "  const [dailySummary, setDailySummary] = useState({ "
        "totalPaisa: 0, transactions: 0, averageSalePaisa: 0, hourlySales: [] });\n"
    ),
    (
        """      const [salesResponse, inventoryResponse] = await Promise.all([
        fetch('/api/v1/sales?limit=100&page=1'),
        fetch('/api/v1/inventory/summary'),
      ]);
      const [salesResult, inventoryResult] = await Promise.all([
        salesResponse.json(),
        inventoryResponse.json(),
      ]);""",
        """      const [salesResponse, inventoryResponse, summaryResponse] = await Promise.all([
        fetch('/api/v1/sales?limit=100&page=1'),
        fetch('/api/v1/inventory/summary'),
        fetch('/api/v1/dashboard/summary'),
      ]);
      const [salesResult, inventoryResult, summaryResult] = await Promise.all([
        salesResponse.json(),
        inventoryResponse.json(),
        summaryResponse.json(),
      ]);"""
    ),
    (
        """      setSales(Array.isArray(salesResult.data) ? salesResult.data : []);
      setInventory(inventoryResult.data || null);""",
        """      if (!summaryResponse.ok) {
        throw new Error(summaryResult.error?.message || summaryResult.message || 'Could not load daily sales summary.');
      }
      setSales(Array.isArray(salesResult.data) ? salesResult.data : []);
      setDailySummary(summaryResult.data || { totalPaisa: 0, transactions: 0, averageSalePaisa: 0, hourlySales: [] });
      setInventory(inventoryResult.data || null);"""
    ),
    (
        """  const now = new Date();
  const todaySales = sales.filter(sale => {
    const date = new Date(sale.createdAt);
    return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
  });
  const todayTotal = todaySales.reduce((sum, sale) => sum + (Number(sale.totalPaisa) || 0), 0);
  const averageSale = todaySales.length ? Math.round(todayTotal / todaySales.length) : 0;
  const lowStock = Number(inventory?.lowStock) || 0;
  const hourlySales = Array.from({ length: 12 }, (_, index) => {
    const hour = index * 2;
    const total = todaySales.reduce((sum, sale) => {
      const date = new Date(sale.createdAt);
      return date.getHours() >= hour && date.getHours() < hour + 2
        ? sum + (Number(sale.totalPaisa) || 0) : sum;
    }, 0);
    return { label: `${String(hour).padStart(2, '0')}:00`, total };
  });""",
        """  const now = new Date();
  const todayTotal = Number(dailySummary.totalPaisa) || 0;
  const todayTransactions = Number(dailySummary.transactions) || 0;
  const averageSale = Number(dailySummary.averageSalePaisa) || 0;
  const lowStock = Number(inventory?.lowStock) || 0;
  const hourlySales = (dailySummary.hourlySales || []).map(item => ({
    label: `${String(item.startHour).padStart(2, '0')}:00`,
    total: Number(item.totalPaisa) || 0,
  }));"""
    ),
    (
        "`${todaySales.length} completed sales today`",
        "`${todayTransactions} completed sales today`"
    ),
    (
        "value: String(todaySales.length)",
        "value: String(todayTransactions)"
    ),
    (
        '{!todaySales.length && <p className="chart-note">No sales recorded today yet.</p>}',
        '{!todayTransactions && <p className="chart-note">No sales recorded today yet.</p>}'
    ),
]

for old, new in replacements:
    count = dashboard.count(old)
    if count != 1:
        raise SystemExit(
            f"STOP: Expected one Dashboard match, found {count}:\n{old[:100]}"
        )
    dashboard = dashboard.replace(old, new, 1)

backup = path.with_name(
    path.name + ".pre-summary-" + datetime.now().strftime("%Y%m%d-%H%M%S")
)
backup.write_text(source)
path.write_text(source[:start] + dashboard + source[end:])

print(f"Dashboard updated. Backup created: {backup}")
