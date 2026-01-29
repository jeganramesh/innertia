<template>
  <Card class="p-6">
    <form @submit.prevent="handleSubmit(submitClass)">
      <div class="space-y-4">
        <Input
          label="Class Name"
          v-model="values.name"
          :error="errors.name"
          @update:modelValue="handleChange('name', $event)"
        />
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <div class="mt-1 relative rounded-md">
          <textarea
            id="description"
            v-model="values.description"
            @input="handleChange('description', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            :class="[
              'block w-full rounded-md border-gray-300 transition-all focus:border-primary focus:ring-primary sm:text-sm',
              { 'border-error focus:ring-error focus:border-error': errors.description },
              { 'bg-gray-50 cursor-not-allowed': false } // Assuming textarea won't be disabled separately
            ]"
          ></textarea>
        </div>
        <p v-if="errors.description" class="mt-2 text-sm text-error">{{ errors.description }}</p>
        <Input
          label="Subject"
          v-model="values.subject"
          :error="errors.subject"
          @update:modelValue="handleChange('subject', $event)"
        />
        <Input
          label="Join Code (optional)"
          v-model="values.joinCode"
          :error="errors.joinCode"
          @update:modelValue="handleChange('joinCode', $event)"
          placeholder="Leave empty to auto-generate"
        />

        <div class="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" @click="emit('cancel')">Cancel</Button>
          <Button type="submit" :loading="isSubmitting" :disabled="!isValid" variant="primary">
            {{ isEditMode ? 'Update Class' : 'Create Class' }}
          </Button>
        </div>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, withDefaults, defineProps } from 'vue';
import { useForm } from '@/composables/useForm';
import { useNotification } from '@/composables/useNotification';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Card from '@/components/common/Card.vue';

interface ClassFormValues {
  name: string;
  description: string;
  subject: string;
  joinCode: string;
}

const props = withDefaults(defineProps<{
  initialData?: Partial<ClassFormValues>;
  isEditMode?: boolean;
}>(), {
  isEditMode: false,
});

const emit = defineEmits(['submit', 'cancel']);
const notification = useNotification();

const initialFormValues: ClassFormValues = {
  name: props.initialData?.name || '',
  description: props.initialData?.description || '',
  subject: props.initialData?.subject || '',
  joinCode: props.initialData?.joinCode || '',
};

const validationRules = {
  name: [(val: string) => (val && val.length > 0 ? null : 'Class name is required')],
  description: [(val: string) => (val && val.length > 0 ? null : 'Description is required')],
  subject: [(val: string) => (val && val.length > 0 ? null : 'Subject is required')],
};

const { values, errors, isSubmitting, handleChange, handleSubmit, isValid, resetForm } = useForm(initialFormValues, validationRules);

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    Object.assign(values, newVal);
  }
}, { deep: true });

const submitClass = async (formData: ClassFormValues) => {
  console.log(props.isEditMode ? 'Updating Class:' : 'Creating Class:', formData);
  notification.success(props.isEditMode ? 'Class updated successfully!' : 'Class created successfully!');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  emit('submit', formData);
  if (!props.isEditMode) {
    resetForm();
  }
};
</script>