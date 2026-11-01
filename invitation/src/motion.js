const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const temporaryLayers = new Set();
let welcomeCelebrated = false;

function removeLayer(layer) {
  layer.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  layer.remove();
  temporaryLayers.delete(layer);
}

// Decorative only: navigation happens immediately and the clone never receives input.
export function animateCoverOpening() {
  const cover = document.querySelector('.landing-portrait');
  if (reducedMotion.matches || !cover?.animate) return;
  const rect = cover.getBoundingClientRect();
  const clone = cover.cloneNode(true);
  clone.classList.add('opening-cover');
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, {
    top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`,
    height: `${rect.height}px`, minHeight: '0', margin: '0'
  });
  document.body.append(clone);
  temporaryLayers.add(clone);
  const animation = clone.animate([
    { transform: 'perspective(1200px) rotateY(0deg)', opacity: 1 },
    { transform: 'perspective(1200px) rotateY(-78deg) translateX(-12px)', opacity: 0 }
  ], { duration: 680, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
  animation.finished.catch(() => {}).then(() => removeLayer(clone));
}

export function celebrateWelcome() {
  if (welcomeCelebrated || reducedMotion.matches || !Element.prototype.animate) return;
  welcomeCelebrated = true;
  const layer = document.createElement('div');
  layer.className = 'wedding-petals';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  temporaryLayers.add(layer);
  const animations = Array.from({ length: 18 }, (_, index) => {
    const petal = document.createElement('i');
    petal.style.left = `${(index * 37 + 9) % 100}%`;
    petal.style.width = `${5 + index % 4}px`;
    petal.style.height = `${10 + index % 6}px`;
    layer.append(petal);
    const drift = index % 2 ? 40 : -40;
    return petal.animate([
      { transform: `translate(0, -20px) rotate(${index * 31}deg)`, opacity: 0 },
      { opacity: .75, offset: .14 },
      { transform: `translate(${drift}px, 105vh) rotate(${index * 31 + 240}deg)`, opacity: 0 }
    ], { duration: 1900 + (index % 5) * 140, delay: (index % 4) * 65, easing: 'cubic-bezier(.22,.45,.62,1)', fill: 'both' });
  });
  Promise.allSettled(animations.map(animation => animation.finished)).then(() => removeLayer(layer));
}

export function initializeMotion() {
  const cover = document.querySelector('#screen-language .landing-portrait');
  if (!cover) return;
  const reset = () => {
    cover.style.removeProperty('--tilt-x');
    cover.style.removeProperty('--tilt-y');
  };
  let frame;
  cover.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = cover.getBoundingClientRect();
      cover.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -5}deg`);
      cover.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 5}deg`);
    });
  });
  cover.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); reset(); });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    cancelAnimationFrame(frame);
    reset();
    [...temporaryLayers].forEach(removeLayer);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) [...temporaryLayers].forEach(removeLayer);
  });
}
