import type { Directive } from 'vue';

const vLazyLoad: Directive<HTMLImageElement> = {
  mounted(el) {
    function loadImage() {
      if (el.dataset.src) {
        el.src = el.dataset.src;
        el.removeAttribute('data-src');
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage();
            observer.unobserve(el);
          }
        });
      });
      observer.observe(el);
    } else {
      // Fallback for browsers that don't support Intersection Observer
      loadImage();
    }
  },
};

export default vLazyLoad;
