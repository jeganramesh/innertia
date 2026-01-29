<template>
  <transition name="fade-scale">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black opacity-50"></div>
      <Card class="relative z-10 p-8 text-center bg-white rounded-lg shadow-soft-xl max-w-sm w-full" role="dialog" aria-modal="true">
        <div class="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 class="text-3xl font-bold text-primary mb-2">Achievement Unlocked!</h2>
        <p class="text-xl text-gray-800">{{ achievementName }}</p>
        <p v-if="achievementIcon" class="text-5xl mt-2">{{ achievementIcon }}</p>
        <Button class="mt-6" @click="close">Awesome!</Button>
      </Card>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';

const props = withDefaults(defineProps<{
  achievementName: string;
  achievementIcon?: string;
  modelValue: boolean; // Use modelValue for v-model binding
}>(), {
  achievementIcon: '🏅',
});

const emit = defineEmits(['update:modelValue', 'close']);

const show = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  show.value = newVal;
});

watch(show, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false);
    emit('close');
  }
});

const close = () => {
  show.value = false;
};
</script>

<style scoped>
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>