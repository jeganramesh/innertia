<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol role="list" class="flex items-center space-x-2">
      <li v-for="(item, index) in items" :key="item.to || item.label" class="flex items-center">
        <router-link
          v-if="item.to"
          :to="item.to"
          :class="['text-sm font-medium', index === items.length - 1 ? 'text-gray-800' : 'text-gray-500 hover:text-gray-700']"
        >
          {{ item.label }}
        </router-link>
        <span
          v-else
          :class="['text-sm font-medium', index === items.length - 1 ? 'text-gray-800' : 'text-gray-500']"
        >
          {{ item.label }}
        </span>
        <svg
          v-if="index < items.length - 1"
          class="flex-shrink-0 h-5 w-5 text-gray-300 ml-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M5.555 17.776l8-16 .224.224-8 16-.224-.224z" />
        </svg>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from 'vue';
import { RouteLocationRaw } from 'vue-router';

interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;
}

const props = withDefaults(defineProps<{
  items: BreadcrumbItem[];
}>(), {
  items: () => [],
});
</script>