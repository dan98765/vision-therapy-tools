// Draws a Hart chart (the letter grid, with optional row and column numbers) into a box. Shared by the Hart
// chart and the matched pair, so the two cannot drift. `layout` comes from gridLayout (shared/hart-grid.js).

function cell(className, text) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  return el;
}

// `numbers` adds a row-number column on each side; `colNumbers` adds a row of column numbers above and below.
export function drawChart(container, grid, layout, { numbers, colNumbers }) {
  const cols = grid[0].length;
  const mm = value => value.toFixed(3) + 'mm';
  container.style.fontSize = mm(layout.fontMm);
  container.style.gridAutoRows = mm(layout.cellH);
  container.style.gridTemplateColumns =
    (numbers ? mm(layout.numW) + ' ' : '') +
    `repeat(${cols}, ${mm(layout.cellW)})` +
    (numbers ? ' ' + mm(layout.numW) : '');

  container.textContent = '';
  // A row of column numbers, with an empty corner on each side when row numbers are shown too
  const appendColumnNumbers = () => {
    if (numbers) container.append(cell('cell row-num', ''));
    for (let c = 1; c <= cols; c++) container.append(cell('cell row-num', c));
    if (numbers) container.append(cell('cell row-num', ''));
  };

  if (colNumbers) appendColumnNumbers();
  grid.forEach((row, r) => {
    if (numbers) container.append(cell('cell row-num', r + 1));
    for (const letter of row) container.append(cell('cell', letter));
    if (numbers) container.append(cell('cell row-num', r + 1));
  });
  if (colNumbers) appendColumnNumbers();
}
