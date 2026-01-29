<template>
  <div class="w-full">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="selectTab(tab.value)"
          :class="[
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
            {
              'border-primary text-primary': activeTab === tab.value,
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': activeTab !== tab.value,
            },
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>
    <div class="py-4">
      <slot :name="activeTab"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, withDefaults } from 'vue';

interface TabItem {
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{
  tabs: TabItem[];
  defaultTab?: string;
}>(), {
  defaultTab: '',
});

const emit = defineEmits(['update:modelValue']);

const activeTab = ref(props.defaultTab || (props.tabs.length > 0 ? props.tabs[0].value : ''));

watch(() => props.defaultTab, (newVal) => {
  if (newVal && newVal !== activeTab.value) {
    activeTab.value = newVal;
  }
});

function selectTab(tabValue: string) {
  activeTab.value = tabValue;
  emit('update:modelValue', tabValue);
}
</script>

<style scoped>
/* No specific styles needed beyond Tailwind for now */
</style>