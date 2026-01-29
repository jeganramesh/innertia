<template>
  <div
    :class="[
      'rounded-xl border bg-white transition-all duration-300 hover:shadow-lg',
      { 'p-6': !noPadding },
      { 'cursor-pointer': clickable },
      { 'hover:border-blue-300': clickable },
      { 'shadow-sm': !noShadow },
      className
    ]"
    @click="handleClick"
  >
    <div v-if="$slots.header || title" class="mb-4">
      <div v-if="$slots.header" class="flex items-center justify-between">
        <slot name="header" />
      </div>
      <div v-else-if="title" class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <slot name="header-right" />
      </div>
    </div>
    
    <div :class="{ 'opacity-60': disabled }">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="mt-6 pt-4 border-t">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  clickable?: boolean;
  disabled?: boolean;
  noPadding?: boolean;
  noShadow?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  disabled: false,
  noPadding: false,
  noShadow: false,
  className: '',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled) {
    emit('click', event);
  }
};
</script>