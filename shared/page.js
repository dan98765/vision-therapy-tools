// Small DOM helpers shared by the exercise pages.

export function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

// Set the note under the buttons; `warn` turns it amber.
export function setNote(el, text, warn = false) {
  el.classList.toggle('warn', warn);
  el.textContent = text;
}

export function bindPrint(button) {
  button.addEventListener('click', () => window.print());
}
