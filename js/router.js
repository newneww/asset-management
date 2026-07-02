// router.js — Minimal hash-based router. Routes map to render(container) functions.
const routes = {};
let notFound = null;
let onNavigate = null;

export function register(path, renderFn) { routes[path] = renderFn; }
export function setNotFound(fn) { notFound = fn; }
export function setOnNavigate(fn) { onNavigate = fn; }

export function current() {
  return (location.hash || '#/').replace(/^#/, '');
}

export function navigate(path) {
  if (location.hash === '#' + path) render(); // same route → force re-render
  else location.hash = path;
}

function render() {
  const path = current();
  const view = document.getElementById('view');
  if (!view) return;
  const fn = routes[path] || notFound;
  view.innerHTML = '';
  view.scrollTop = 0;
  if (fn) fn(view);
  if (onNavigate) onNavigate(path);
}

export function start() {
  window.addEventListener('hashchange', render);
  render();
}

export default { register, setNotFound, setOnNavigate, current, navigate, start };
