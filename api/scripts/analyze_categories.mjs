import XLSX from 'xlsx';

const wb = XLSX.readFile('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/promoimport_catalogo.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

// Group products by category
const byCat = {};
for (const r of data) {
  const cat = r['Categorías'] || 'SIN CATEGORÍA';
  if (!byCat[cat]) byCat[cat] = [];
  byCat[cat].push(r.SKU);
}

// Sort by count descending
const sorted = Object.entries(byCat).sort((a, b) => b[1].length - a[1].length);
for (const [cat, skus] of sorted) {
  console.log(String(skus.length).padStart(4), cat);
}
