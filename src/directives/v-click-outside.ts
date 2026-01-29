import type { Directive } from 'vue'

interface ClickOutsideElement extends HTMLElement {
  _clickOutsideHandler?: (event: MouseEvent) => void;
}

const vClickOutside: Directive<ClickOutsideElement, () => void> = {
  mounted(el, binding) {
    el._clickOutsideHandler = (event: MouseEvent) => {
      // Check if the click is outside the element and not on a child element
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value();
      }
    };
    document.addEventListener('click', el._clickOutsideHandler);
  },
  unmounted(el) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('click', el._clickOutsideHandler);
    }
  },
};

export default vClickOutside;
