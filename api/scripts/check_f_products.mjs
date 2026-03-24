import XLSX from 'xlsx';
const wb = XLSX.readFile('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/promoimport_catalogo.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);
const fProducts = data.filter(r => r.SKU && r.SKU.startsWith('F'));
for (const r of fProducts) {
  const cat = r['Categorías'] || 'NONE';
  // Show hex of the category for debugging encoding issues
  console.log(r.SKU.padEnd(6), cat);
}
