<template>
  <Card class="p-6">
    <form @submit.prevent="handleSubmit(submitQuiz)">
      <div class="space-y-4">
        <Input
          label="Quiz Title"
          v-model="values.title"
          :error="errors.title"
          @update:modelValue="handleChange('title', $event)"
        />
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <div class="mt-1 relative rounded-md">
            <textarea
              id="description"
              v-model="values.description"
              @input="handleChange('description', ($event.target as HTMLTextAreaElement).value)"
              rows="3"
              :class="[
                'block w-full rounded-md border-gray-300 transition-all focus:border-primary focus:ring-primary sm:text-sm',
                { 'border-error focus:ring-error focus:border-error': errors.description }
              ]"
            ></textarea>
          </div>
          <p v-if="errors.description" class="mt-2 text-sm text-error">{{ errors.description }}</p>
        </div>
        <Input
          label="Duration (minutes)"
          type="number"
          v-model="values.duration"
          :error="errors.duration"
          @update:modelValue="handleChange('duration', $event)"
        />
        <Input
          label="Passing Score (%)"
          type="number"
          v-model="values.passingScore"
          :error="errors.passingScore"
          @update:modelValue="handleChange('passingScore', $event)"
        />
        <div class="flex items-center">
          <input type="checkbox" id="allowRetakes" v-model="values.allowRetakes" @change="handleChange('allowRetakes', $event.target.checked)" class="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />
          <label for="allowRetakes" class="ml-2 block text-sm font-medium text-gray-700">Allow Retakes</label>
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="shuffleQuestions" v-model="values.shuffleQuestions" @change="handleChange('shuffleQuestions', $event.target.checked)" class="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />
          <label for="shuffleQuestions" class="ml-2 block text-sm font-medium text-gray-700">Shuffle Questions</label>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Publish Status</label>
          <Dropdown
            :options="publishStatusOptions"
            v-model="values.status"
            :error="errors.status"
            @update:modelValue="handleChange('status', $event)"
          />
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" @click="emit('cancel')">Cancel</Button>
          <Button type="submit" :loading="isSubmitting" :disabled="!isValid" variant="primary">
            Save Quiz Settings
          </Button>
        </div>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from '@/composables/useForm';
import { useNotification } from '@/composables/useNotification';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Card from '@/components/common/Card.vue';
import Dropdown from '@/components/common/Dropdown.vue';

interface QuizFormValues {
  title: string;
  description: string;
  duration: number | null;
  passingScore: number | null;
  allowRetakes: boolean;
  shuffleQuestions: boolean;
  status: 'draft' | 'scheduled' | 'published';
}

const emit = defineEmits(['submit', 'cancel']);
const notification = useNotification();

const publishStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
];

const initialFormValues: QuizFormValues = {
  title: '',
  description: '',
  duration: null,
  passingScore: 70,
  allowRetakes: true,
  shuffleQuestions: true,
  status: 'draft',
};

const validationRules = {
  title: [(val: string) => (val && val.length > 0 ? null : 'Title is required')],
  description: [(val: string) => (val && val.length > 0 ? null : 'Description is required')],
  duration: [
    (val: number | null) => (val !== null && val > 0 ? null : 'Duration must be a positive number')
  ],
  passingScore: [
    (val: number | null) => (val !== null && val >= 0 && val <= 100 ? null : 'Passing score must be between 0 and 100')
  ],
  status: [(val: string) => (val ? null : 'Publish status is required')],
};

const { values, errors, isSubmitting, handleChange, handleSubmit, isValid, resetForm } = useForm(initialFormValues, validationRules);

const submitQuiz = async (formData: QuizFormValues) => {
  console.log('Submitting Quiz Settings:', formData);
  notification.success('Quiz settings saved successfully!');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  emit('submit', formData);
  // resetForm(); // Maybe not reset if user continues to add questions
};
</script>