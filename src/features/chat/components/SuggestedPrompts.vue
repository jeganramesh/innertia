<template>
  <div class="p-4 bg-gray-100 shadow-soft-sm">
    <h3 class="text-sm font-semibold text-gray-700 mb-2">Suggestions:</h3>
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="(prompt, index) in prompts"
        :key="index"
        variant="secondary"
        size="sm"
        @click="emit('select-prompt', prompt)"
      >
        {{ prompt }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, defineEmits } from 'vue';
import Button from '@/components/common/Button.vue';

const props = withDefaults(defineProps<{
  prompts?: string[];
}>(), {
  prompts: () => [
    'Explain this concept',
    'Give me a practice question',
    'Summarize this lesson',
    'What is...?',
  ],
});

const emit = defineEmits(['select-prompt']);
</script>