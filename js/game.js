import { prepararJanelas, abrirTodas } from './windows.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const { dataset, ...resto } = props;
  const e = Object.assign(document.createElement(tag), resto);
  if (dataset) Object.assign(e.dataset, dataset);
  e.append(...kids.filter((k) => k !== null && k !== undefined && k !== false));
  return e;
};

// ---- conquistas (guardadas só neste navegador) ----
const CONQUISTAS = {
  inicio: 'Player 1 pronto',
  skills: 'Atributos conferidos',
  missoes: 'Missões lidas',
  formacao: 'Estudante nível máx.',
  projetos: 'Chegou nos projetos',
  contato: 'Chegou ao final',
  plataforma: 'Abriu a plataforma Flyover',
  mobile: 'Testou o app mobile',
};
const TOTAL = Object.keys(CONQUISTAS).length;
let ganhas = new Set();
try { ganhas = new Set(JSON.parse(localStorage.getItem('le-conquistas') || '[]')); } catch { /* sem storage */ }

function pintarXp() {
  const pct = Math.round((ganhas.size / TOTAL) * 100);
  $('xpTxt').textContent = `${ganhas.size}/${TOTAL}`;
  $('xpFill').style.width = `${pct}%`;
  $('cXp').style.width = `${pct}%`;
}
let toastTimer;
function conquista(id) {
  if (ganhas.has(id) || !CONQUISTAS[id]) return;
  ganhas.add(id);
  try { localStorage.setItem('le-conquistas', JSON.stringify([...ganhas])); } catch { /* ignora */ }
  pintarXp();
  const t = $('toast');
  t.replaceChildren('★ CONQUISTA DESBLOQUEADA', el('b', { textContent: CONQUISTAS[id] }));
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3200);
}

// ---- sprite do personagem ----
function desenharSprite() {
  const cores = { h: '#5d275d', s: '#f2b48c', e: '#1a1c2c', b: '#41a6f6', w: '#f4f4f4', p: '#333c57', k: '#000', m: '#b13e53' };
  const mapa = [
    '...hhhhhh...', '..hhhhhhhh..', '..hssssssh..', '..sesssses..', '..ssssssss..', '....smms....',
    '..bbbbbbbb..', '.sbbbwwbbbs.', '.sbbbwwbbbs.', '..bbbbbbbb..', '..pppppppp..', '..pp....pp..', '..kk....kk..',
  ];
  const svg = $('sprite');
  const ns = 'http://www.w3.org/2000/svg';
  mapa.forEach((linha, y) => [...linha].forEach((c, x) => {
    if (c === '.') return;
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', 1); r.setAttribute('height', 1);
    r.setAttribute('fill', cores[c]);
    svg.append(r);
  }));
}

// ---- conteúdo vindo do CMS ----
function renderSite(d) {
  const p = d.perfil;
  document.title = `${p.nome} | Portfólio`;
  $('hNome').textContent = p.nome;
  $('hTitulo').textContent = p.titulo;
  $('cNome').textContent = p.nome;
  $('cNivel').textContent = p.nivel;
  $('cLocal').textContent = p.local;
  $('cSobre').replaceChildren(...p.sobre.split(/\n\s*\n/).map((t) => el('p', { textContent: t })));

  $('skillsList').replaceChildren(...d.skills.map((s) =>
    el('div', { className: 'skill' },
      el('div', { className: 'skill__top' }, el('span', { textContent: s.nome }), el('span', { className: 'skill__lv', textContent: `LV ${Math.round(s.nivel / 10)}` })),
      el('span', { className: 'bar' }, el('span', { className: 'bar__fill', style: 'width:0%', dataset: { w: `${s.nivel}%` } })))));

  $('questList').replaceChildren(...d.experiencia.map((x, i) => {
    const atual = /atual/i.test(x.periodo);
    return el('li', { className: 'quest' + (atual ? '' : ' quest--done') },
      el('span', { className: 'quest__tag', textContent: `MISSÃO ${String(i + 1).padStart(2, '0')} · ${atual ? 'EM ANDAMENTO' : 'CONCLUÍDA'}` }),
      el('h3', { textContent: x.cargo }),
      el('p', { className: 'quest__meta', textContent: `${x.empresa} · ${x.periodo}` }),
      x.descricao ? el('p', { className: 'quest__desc', textContent: x.descricao }) : null);
  }));

  $('badgeList').replaceChildren(...d.formacao.map((f, i) =>
    el('div', { className: 'badge' },
      el('div', { className: 'badge__ico', textContent: String(i + 1) }),
      el('div', {}, el('h3', { textContent: f.curso }), el('p', { textContent: [f.instituicao, f.periodo].filter(Boolean).join(' · ') })))));

  const fl = d.projetos.flyover;
  $('fTitulo').textContent = fl.titulo;
  $('fDesc').textContent = fl.descricao;
  $('fStack').textContent = `STACK: ${fl.stack}`;
  prepararJanelas(fl.perfis);

  const oc = d.projetos.orcamentos;
  $('oTitulo').textContent = oc.titulo;
  $('oDesc').textContent = oc.descricao;
  $('oStack').textContent = `STACK: ${oc.stack}`;
  prepararCelular(oc.prints || []);

  const url = `https://wa.me/${d.whatsapp.numero}?text=${encodeURIComponent(d.whatsapp.mensagem)}`;
  $('waBig').href = url;
  $('waFloat').href = url;
  $('mail').href = `mailto:${p.email}`;
  $('mail').textContent = p.email;
}

// ---- celular com prints do sistema de orçamentos ----
function prepararCelular(prints) {
  const lista = $('orcLista');
  const img = $('orcImg');
  lista.replaceChildren();
  if (!prints.length) { img.removeAttribute('src'); $('orcCap').textContent = 'Prints em breve.'; return; }
  let timer;
  const mostrar = (i, auto = false) => {
    img.src = prints[i].url;
    img.alt = `Orçamentos: ${prints[i].legenda}`;
    $('orcCap').textContent = prints[i].legenda;
    [...lista.children].forEach((b, k) => b.classList.toggle('on', k === i));
    if (!auto) { clearInterval(timer); } // se a pessoa escolheu, para o automático
  };
  prints.forEach((p, i) => {
    const b = el('button', { className: 'btn', type: 'button', textContent: `${i + 1}. ${p.legenda}` });
    b.addEventListener('click', () => mostrar(i));
    lista.append(b);
  });
  let atual = 0;
  mostrar(0, true);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timer = setInterval(() => { atual = (atual + 1) % prints.length; mostrar(atual, true); }, 3500);
  }
}

// barras animam ao aparecer
const barras = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.querySelectorAll('.bar__fill[data-w]').forEach((b) => (b.style.width = b.dataset.w));
  barras.unobserve(e.target);
}), { threshold: 0.2 });

// conquista por seção + menu ativo
const secs = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  conquista(e.target.dataset.ach);
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('is-on', a.getAttribute('href') === `#${e.target.id}`));
}), { threshold: 0.35 });

// ---- abas de projeto ----
function abrirAba(nome) {
  document.querySelectorAll('.tab').forEach((t) => {
    const on = t.dataset.tab === nome;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', String(on));
  });
  $('panelFlyover').hidden = nome !== 'flyover';
  $('panelOrc').hidden = nome !== 'orcamentos';
  if (nome === 'orcamentos') conquista('mobile');
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => abrirAba(t.dataset.tab)));

function acessarPlataforma() { conquista('plataforma'); abrirTodas(); }
$('btnPlataforma').addEventListener('click', acessarPlataforma);
window.addEventListener('message', (e) => {
  if (e.origin === location.origin && e.data?.tipo === 'flyover-acessar') acessarPlataforma();
});

// ---- início ----
$('ano').textContent = new Date().getFullYear();
desenharSprite();
pintarXp();
try {
  const r = await fetch('data/site.json', { cache: 'no-cache' });
  const site = await r.json();
  // caminhos de imagem relativos: o site funciona em qualquer subpasta (ex.: GitHub Pages)
  const rel = (p) => { if (p && p.url) p.url = p.url.replace(/^\/+/, ''); };
  site.projetos.flyover.perfis.forEach((pf) => (pf.prints || []).forEach(rel));
  (site.projetos.orcamentos.prints || []).forEach(rel);
  renderSite(site);
} catch {
  $('hTitulo').textContent = 'Não foi possível carregar o conteúdo.';
}
document.querySelectorAll('[data-ach]').forEach((s) => { secs.observe(s); barras.observe(s); });
if (location.hash === '#orcamentos') { location.hash = '#projetos'; abrirAba('orcamentos'); }
