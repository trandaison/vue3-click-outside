interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: (e: Event) => void,
};

interface ClickOutsideBindingArgs {
  handler: (e: Event) => void
  condition?: (e: Event) => boolean
  include?: () => HTMLElement[]
};

interface ClickOutsideDirective {
  value?: ((e: Event) => void) | ClickOutsideBindingArgs;
};

const defaultCondition = () => true;

const directive = (e: PointerEvent, el: HTMLElement, binding: ClickOutsideDirective) => {
  const handler = typeof binding.value === 'function' ? binding.value : binding.value!.handler;
  const isActive = (typeof binding.value === 'object' && binding.value.condition) || defaultCondition;

  // The include element callbacks below can be expensive
  // so we should avoid calling them when we're not active.
  // Explicitly check for false to allow fallback compatibility
  // with non-toggleable components
  if (!e || isActive(e) === false) return;
  const elements = ((typeof binding.value === 'object' && binding.value.include) || (() => []))();
  elements.push(el);

  // Check if it's a click outside our elements, and then if our callback returns true.
  // Non-toggleable components should take action in their callback and return falsy.
  // Toggleable can return true if it wants to deactivate.
  // Note that, because we're in the capture phase, this callback will occur before
  // the bubbling click event on any outside elements.
  !elements.some(el => el.contains(e.target as Node)) && setTimeout(() => {
    isActive(e) && handler && handler(e)
  }, 0);
};

export const ClickOutside = {
  inserted: (el: HTMLElement, binding: ClickOutsideDirective) => {
    const onClick = (e: Event) => directive(e as PointerEvent, el, binding);
    document.body.addEventListener('click', onClick, true);
    (el as ClickOutsideElement)._clickOutside = onClick;
  },

  unbind: (el: ClickOutsideElement) => {
    if (!el._clickOutside) return
    document.body.removeEventListener('click', el._clickOutside, true)
    delete el._clickOutside
  },
};

export default ClickOutside;
