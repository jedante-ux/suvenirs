import XLSX from 'xlsx';
const wb = XLSX.readFile('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/promoimport_catalogo.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

// Find the CAJAS category and show its hex encoding
for (const r of data) {
  const cat = r['Categorías'] || '';
  if (cat.includes('CAJAS') && cat.includes('PACKING')) {
    console.log('Found:', JSON.stringify(cat));
    console.log('Hex:', Buffer.from(cat).toString('hex'));
    console.log('Length:', cat.length);
    // Compare with our mapping key
    const mapKey = 'CAJAS AUTO-ARMABLES Y PACKING';
    console.log('Map key:', JSON.stringify(mapKey));
    console.log('Map hex:', Buffer.from(mapKey).toString('hex'));
    console.log('Map length:', mapKey.length);
    console.log('Equal:', cat === mapKey);
    // Check char by char
    for (let i = 0; i < Math.max(cat.length, mapKey.length); i++) {
      if (cat[i] !== mapKey[i]) {
        console.log(`Diff at pos ${i}: Excel="${cat[i]}" (${cat.charCodeAt(i)}) vs Map="${mapKey[i]}" (${mapKey.charCodeAt(i)})`);
      }
    }
    break;
  }
}
