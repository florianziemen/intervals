// Small DOM helpers shared by the views.

/**
 * Element by id. Throws early when the markup and code disagree.
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} id
 * @returns {T}
 */
export function byId(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return /** @type {T} */ (node);
}

/**
 * Create an element. Text goes in via textContent, never as HTML.
 * @param {string} tag
 * @param {{className?: string, text?: string|number, attrs?: Record<string, string>}} [props]
 * @param {Node[]} [children]
 */
export function el(tag, { className, text, attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  for (const [k, v] of Object.entries(attrs ?? {})) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export const ARM_MS = 3000;

/**
 * Two-tap confirmation for destructive buttons: the first tap arms the button
 * for ARM_MS and changes its label, the second runs onConfirm.
 * @param {HTMLButtonElement} button
 * @param {string} armedText
 * @param {() => void} onConfirm
 * @returns {() => void} disarm, e.g. when the surrounding UI resets
 */
export function twoTap(button, armedText, onConfirm) {
  const idleText = button.textContent;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timer;
  const disarm = () => {
    clearTimeout(timer);
    button.classList.remove('armed');
    button.textContent = idleText;
  };
  button.addEventListener('click', () => {
    if (button.classList.contains('armed')) {
      disarm();
      onConfirm();
      return;
    }
    button.classList.add('armed');
    button.textContent = armedText;
    timer = setTimeout(disarm, ARM_MS);
  });
  return disarm;
}

/**
 * Shows Wally, or zombie Wally, in the box's image, with an outfit on top.
 * @param {HTMLElement} box  element holding the .wb-fig with both images
 * @param {boolean} zombie
 * @param {string} [outfit]  name of a file in outfits/, without .svg
 */
export function showWally(box, zombie, outfit) {
  box.classList.toggle('zombie', zombie);
  const img = /** @type {HTMLImageElement} */ (box.querySelector('img'));
  img.src = zombie ? 'zombie.svg' : 'wallaby.svg';
  img.width = zombie ? 244 : 220;
  const over = /** @type {HTMLImageElement} */ (box.querySelector('img.outfit'));
  over.hidden = !outfit;
  if (outfit) over.src = `outfits/${outfit}.svg`;
  else over.removeAttribute('src');
}
