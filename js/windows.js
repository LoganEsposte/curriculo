// Janelas arrastáveis com os prints de cada perfil do Flyover.
const layer = document.getElementById('winLayer');
const dock = document.getElementById('dock');

const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids.filter(Boolean));
  return e;
};

let z = 10;
const wins = [];

function abrirLightbox(url) {
  const lb = el('div', { className: 'lightbox' }, el('img', { src: url, alt: 'Print ampliado' }));
  const fechar = () => { lb.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => e.key === 'Escape' && fechar();
  lb.addEventListener('click', fechar);
  document.addEventListener('keydown', onKey);
  document.body.append(lb);
}

function trazerFrente(w) {
  wins.forEach((x) => x.node.classList.remove('is-front'));
  w.node.classList.add('is-front');
  w.node.style.zIndex = ++z;
}

function atualizarDock() {
  dock.replaceChildren(
    el('span', { textContent: 'Janelas:' }),
    ...wins.map((w) => {
      const b = el('button', { className: 'btn' + (w.aberta ? ' on' : ''), type: 'button', textContent: w.perfil.titulo });
      b.addEventListener('click', () => (w.aberta ? (w.node.classList.contains('is-min') ? alternarMin(w) : fechar(w)) : abrir(w)));
      return b;
    }),
    (() => {
      const b = el('button', { className: 'btn', type: 'button', textContent: 'Fechar todas' });
      b.addEventListener('click', () => wins.forEach(fechar));
      return b;
    })(),
  );
  dock.hidden = !wins.some((w) => w.aberta) && !dock.dataset.sempre;
}

function alternarMin(w) {
  w.node.classList.toggle('is-min');
  trazerFrente(w);
}
function fechar(w) {
  w.aberta = false;
  w.node.hidden = true;
  atualizarDock();
}
function abrir(w) {
  w.aberta = true;
  w.node.hidden = false;
  w.node.classList.remove('is-min');
  trazerFrente(w);
  atualizarDock();
}

function criarJanela(perfil, idx) {
  const prints = perfil.prints || [];
  let i = 0;
  const img = el('img', { className: 'win__img', alt: '' });
  const cap = el('span', { className: 'win__cap' });
  const mostrar = () => {
    const p = prints[i];
    img.src = p.url;
    img.alt = `${perfil.titulo}: ${p.legenda}`;
    cap.textContent = `${p.legenda} (${i + 1}/${prints.length})`;
  };
  const ant = el('button', { className: 'btn btn--sm', type: 'button', textContent: '◀', ariaLabel: 'Anterior' });
  const prox = el('button', { className: 'btn btn--sm', type: 'button', textContent: '▶', ariaLabel: 'Próximo' });
  ant.addEventListener('click', () => { i = (i - 1 + prints.length) % prints.length; mostrar(); });
  prox.addEventListener('click', () => { i = (i + 1) % prints.length; mostrar(); });
  img.addEventListener('click', () => abrirLightbox(prints[i].url));

  const corpo = prints.length
    ? el('div', { className: 'win__body' }, img, el('div', { className: 'win__nav' }, ant, cap, prox))
    : el('div', { className: 'win__body' }, el('p', { className: 'win__empty', textContent: 'Prints em breve.' }));
  if (prints.length) mostrar();

  const bMin = el('button', { className: 'win__btn', type: 'button', textContent: '_', ariaLabel: 'Minimizar' });
  const bFechar = el('button', { className: 'win__btn', type: 'button', textContent: 'X', ariaLabel: 'Fechar' });
  const bar = el('div', { className: 'win__bar' }, el('span', { className: 'win__title', textContent: `PERFIL: ${perfil.titulo.toUpperCase()}` }), bMin, bFechar);
  const node = el('div', { className: 'win', role: 'dialog', ariaLabel: `Janela do perfil ${perfil.titulo}` }, bar, corpo);
  const w = { perfil, node, aberta: false };

  // posição inicial: grade 2x2 em telas largas, cascata nas estreitas
  const W = Math.min(520, innerWidth - 24);
  const largo = innerWidth >= 1150;
  const x = largo ? Math.max(8, (innerWidth - W * 2 - 24) / 2) + (idx % 2) * (W + 24) : Math.max(8, 12 + idx * 14);
  const y = largo ? 84 + Math.floor(idx / 2) * 300 : 80 + idx * 34;
  node.style.left = `${Math.min(x, innerWidth - W - 8)}px`;
  node.style.top = `${y}px`;
  node.style.width = `${W}px`;

  // arrastar
  bar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    trazerFrente(w);
    const r = node.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId);
    const mover = (ev) => {
      node.style.left = `${Math.max(0, Math.min(innerWidth - 60, ev.clientX - dx))}px`;
      node.style.top = `${Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy))}px`;
    };
    const soltar = () => { bar.removeEventListener('pointermove', mover); bar.removeEventListener('pointerup', soltar); };
    bar.addEventListener('pointermove', mover);
    bar.addEventListener('pointerup', soltar);
  });
  node.addEventListener('pointerdown', () => trazerFrente(w));
  bMin.addEventListener('click', () => alternarMin(w));
  bFechar.addEventListener('click', () => fechar(w));
  node.hidden = true;
  layer.append(node);
  return w;
}

export function prepararJanelas(perfis) {
  layer.replaceChildren();
  wins.length = 0;
  perfis.forEach((p, i) => wins.push(criarJanela(p, i)));
  dock.dataset.sempre = '';
}

export function abrirTodas() {
  wins.forEach((w, i) => setTimeout(() => abrir(w), i * 140));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const topo = wins.filter((w) => w.aberta).sort((a, b) => b.node.style.zIndex - a.node.style.zIndex)[0];
    if (topo && !document.querySelector('.lightbox')) fechar(topo);
  }
});
