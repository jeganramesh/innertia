<template>
  <div class="relative inline-block" @mouseenter="show = true" @mouseleave="show = false">
    <slot></slot>
    <transition name="tooltip-fade">
      <div
        v-if="show"
        :class="[
          'absolute z-20 px-3 py-1 text-sm text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap',
          positionClasses
        ]"
      >
        {{ content }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, withDefaults, defineProps } from 'vue';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const props = withDefaults(defineProps<{
  content: string;
  position?: TooltipPosition;
}>(), {
  position: 'top',
});

const show = ref(false);

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    case 'bottom':
      return 'top-full left-1/2 -translate-x-1/2 mt-2';
    case 'left':
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    case 'right':
      return 'left-full top-1/2 -translate-y-1/2 ml-2';
    default:
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  }
});
</script>

<style scoped>
.tooltip-fade-enter-active, .tooltip-fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.tooltip-fade-enter-from, .tooltip-fade-leave-to {
  opacity: 0;
}
</style>