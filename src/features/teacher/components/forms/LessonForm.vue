<template>
  <Card class="p-6">
    <form @submit.prevent="handleSubmit(submitLesson)">
      <div class="space-y-4">
        <Input
          label="Lesson Title"
          v-model="values.title"
          :error="errors.title"
          @update:modelValue="handleChange('title', $event)"
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
              { 'bg-gray-50 cursor-not-allowed': false }
            ]"
          ></textarea>
        </div>
        <p v-if="errors.description" class="mt-2 text-sm text-error">{{ errors.description }}</p>

        <Input
          label="Duration (minutes)"
          type="number"
          v-model="values.duration"
          :error="errors.duration"
          @update:modelValue="handleChange('duration', $event)"
        />

        <!-- Placeholder for Content Upload (e.g., File Input) -->
        <div>
          <label for="content-file" class="block text-sm font-medium text-gray-700">Content File</label>
          <input type="file" id="content-file" @change="handleFileUpload" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          <p v-if="errors.contentFile" class="mt-2 text-sm text-error">{{ errors.contentFile }}</p>
        </div>

        <!-- Learning Objectives (Array Input Example) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
          <div v-for="(objective, index) in values.objectives" :key="index" class="flex items-center space-x-2 mb-2">
            <Input
              :id="`objective-${index}`"
              placeholder="e.g., Understand Vue.js lifecycle hooks"
              v-model="values.objectives[index]"
              class="flex-grow"
              @update:modelValue="updateObjective(index, $event)"
            />
            <Button type="button" variant="ghost" @click="removeObjective(index)">Remove</Button>
          </div>
          <Button type="button" variant="secondary" @click="addObjective">Add Objective</Button>
        </div>

        <!-- Cover Image Upload -->
        <div>
          <label for="cover-image" class="block text-sm font-medium text-gray-700">Cover Image</label>
          <input type="file" id="cover-image" @change="handleCoverImageUpload" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          <p v-if="errors.coverImage" class="mt-2 text-sm text-error">{{ errors.coverImage }}</p>
        </div>

        <!-- Publish Settings -->
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
            Save Lesson
          </Button>
        </div>
      </div>
    </form>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useForm } from '@/composables/useForm';
import { useNotification } from '@/composables/useNotification';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Card from '@/components/common/Card.vue';
import Dropdown from '@/components/common/Dropdown.vue';

interface LessonFormValues {
  title: string;
  description: string;
  duration: number | null;
  contentFile: File | null;
  objectives: string[];
  coverImage: File | null;
  status: 'draft' | 'scheduled' | 'published';
}

const emit = defineEmits(['submit', 'cancel']);
const notification = useNotification();

const publishStatusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
];

const initialFormValues: LessonFormValues = {
  title: '',
  description: '',
  duration: null,
  contentFile: null,
  objectives: [''],
  coverImage: null,
  status: 'draft',
};

const validationRules = {
  title: [(val: string) => (val && val.length > 0 ? null : 'Title is required')],
  description: [(val: string) => (val && val.length > 0 ? null : 'Description is required')],
  duration: [
    (val: number | null) => (val !== null && val > 0 ? null : 'Duration must be a positive number')
  ],
  contentFile: [
    (val: File | null) => (val ? null : 'Content file is required')
    // More robust file validation (type, size) would go here
  ],
  status: [(val: string) => (val ? null : 'Publish status is required')],
};

const { values, errors, isSubmitting, handleChange, handleSubmit, isValid, resetForm } = useForm(initialFormValues, validationRules);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleChange('contentFile', target.files[0]);
  } else {
    handleChange('contentFile', null);
  }
};

const handleCoverImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleChange('coverImage', target.files[0]);
  } else {
    handleChange('coverImage', null);
  }
};

const addObjective = () => {
  values.objectives.push('');
};

const removeObjective = (index: number) => {
  values.objectives.splice(index, 1);
};

const updateObjective = (index: number, value: string) => {
  values.objectives[index] = value;
};

const submitLesson = async (formData: LessonFormValues) => {
  console.log('Submitting Lesson:', formData);
  notification.success('Lesson saved successfully!');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  emit('submit', formData);
  resetForm();
};
</script>