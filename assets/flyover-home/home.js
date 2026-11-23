// Cópia estática da home do Flyover (portfólio): os links "Acessar plataforma" avisam a página pai.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-acessar]');
  if (!a) return;
  e.preventDefault();
  parent.postMessage({ tipo: 'flyover-acessar' }, location.origin);
});
// Slider simples do hero
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.slider-dots button');
let i = 0;
const ir = (n) => {
  i = (n + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
  dots.forEach((d, k) => d.classList.toggle('active', k === i));
};
dots.forEach((d, k) => d.addEventListener('click', () => ir(k)));
const bt = document.querySelectorAll('.slider-controls > button');
if (bt[0]) bt[0].addEventListener('click', () => ir(i - 1));
if (bt[1]) bt[1].addEventListener('click', () => ir(i + 1));
setInterval(() => ir(i + 1), 6000);
