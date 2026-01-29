<template>
  <div class="relative" v-click-outside="() => isOpen = false">
    <button
      @click="isOpen = !isOpen"
      class="flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-soft-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-DEFAULT"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      aria-controls="dropdown-options"
    >
      <span>{{ selectedLabel || placeholder }}</span>
      <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>

    <transition name="dropdown-fade-scale">
      <div v-if="isOpen" id="dropdown-options" class="absolute z-10 mt-2 w-full rounded-md bg-white shadow-soft-lg ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" tabindex="-1">
        <div class="p-1">
          <input
            v-if="filterable"
            type="text"
            v-model="searchTerm"
            placeholder="Filter options..."
            class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm mb-1 transition-all duration-DEFAULT"
          />
          <ul class="max-h-60 overflow-auto" role="listbox" aria-labelledby="dropdown-button">
            <li
              v-for="option in filteredOptions"
              :key="option.value"
              @click="selectOption(option)"
              class="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary hover:text-white rounded-md transition-colors duration-DEFAULT"
              :class="{ 'bg-primary text-white': modelValue === option.value }"
              role="option"
              :aria-selected="modelValue === option.value"
            >
              {{ option.label }}
            </li>
            <li v-if="filteredOptions.length === 0" class="text-gray-500 py-2 pl-3 pr-9" role="option" aria-disabled="true">No options found.</li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, withDefaults } from 'vue';
import vClickOutside from '@/directives/v-click-outside';

interface DropdownOption {
  label: string;
  value: string | number;
}

const props = withDefaults(defineProps<{
  options: DropdownOption[];
  modelValue: string | number | null;
  placeholder?: string;
  filterable?: boolean;
}>(), {
  placeholder: 'Select an option',
  filterable: false,
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchTerm = ref('');

const selectedLabel = computed(() => {
  const selected = props.options.find(option => option.value === props.modelValue);
  return selected ? selected.label : '';
});

const filteredOptions = computed(() => {
  if (!props.filterable || !searchTerm.value) {
    return props.options;
  }
  const lowerCaseSearchTerm = searchTerm.value.toLowerCase();
  return props.options.filter(option =>
    option.label.toLowerCase().includes(lowerCaseSearchTerm)
  );
});

function selectOption(option: DropdownOption) {
  emit('update:modelValue', option.value);
  isOpen.value = false;
  searchTerm.value = '';
}
</script>

<style scoped>
.dropdown-fade-scale-enter-active,
.dropdown-fade-scale-leave-active {
  transition: opacity var(--transition-duration, 0.2s) ease-out, transform var(--transition-duration, 0.2s) ease-out;
}

.dropdown-fade-scale-enter-from,
.dropdown-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>