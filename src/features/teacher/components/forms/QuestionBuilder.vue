<template>
  <Card class="p-6">
    <h3 class="text-xl font-bold text-gray-800 mb-4">Questions</h3>

    <div v-if="questions.length === 0" class="mb-4">
      <EmptyState title="No Questions Yet" message="Start by adding your first question!" icon="❓" />
    </div>

    <div v-for="(question, qIndex) in questions" :key="question.id" class="mb-6 p-4 shadow-soft-sm rounded-lg bg-gray-50">
      <div class="flex justify-between items-center mb-3">
        <h4 class="font-semibold text-lg text-gray-800">Question {{ qIndex + 1 }}</h4>
        <Button variant="ghost" size="sm" @click="removeQuestion(qIndex)">Remove Question</Button>
      </div>

      <div>
        <label :for="`question-text-${question.id}`" class="block text-sm font-medium text-gray-700">Question {{ qIndex + 1 }} Text</label>
        <div class="mt-1 relative rounded-md">
          <textarea
            :id="`question-text-${question.id}`"
            v-model="question.text"
            @input="updateQuestionField(qIndex, 'text', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            :class="[
              'block w-full rounded-md border-gray-300 transition-all focus:border-primary focus:ring-primary sm:text-sm',
              { 'border-error focus:ring-error focus:border-error': errors[`questions[${qIndex}].text`] }
            ]"
            class="mb-3"
          ></textarea>
        </div>
        <p v-if="errors[`questions[${qIndex}].text`]" class="mt-2 text-sm text-error">{{ errors[`questions[${qIndex}].text`] }}</p>
      </div>

      <Dropdown
        :options="questionTypeOptions"
        :label="`Question Type for Question ${qIndex + 1}`"
        v-model="question.type"
        @update:modelValue="updateQuestionField(qIndex, 'type', $event)"
        class="mb-3"
      />

      <!-- Options for Multiple Choice / True-False -->
      <div v-if="question.type === 'multiple-choice' || question.type === 'true-false'" class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-2">Options</label>
        <div v-for="(option, oIndex) in question.options" :key="option.value" class="flex items-center space-x-2 mb-2">
          <Input
            :id="`option-${question.id}-${option.value}`"
            :placeholder="`Option ${oIndex + 1}`"
            v-model="option.label"
            class="flex-grow"
            @update:modelValue="updateOptionField(qIndex, oIndex, 'label', $event)"
          />
          <input
            type="radio"
            :id="`correct-answer-${question.id}-${option.value}`"
            :name="`correct-answer-${question.id}`"
            :value="option.value"
            v-model="question.correctAnswer"
            @change="updateQuestionField(qIndex, 'correctAnswer', option.value)"
            class="form-radio h-4 w-4 text-primary"
          />
          <label :for="`correct-answer-${question.id}-${option.value}`" class="text-sm text-gray-700">Correct</label>
          <Button type="button" variant="ghost" size="sm" @click="removeOption(qIndex, oIndex)">Remove</Button>
        </div>
        <Button type="button" variant="secondary" @click="addOption(qIndex)">Add Option</Button>
      </div>

      <!-- Input for Short Answer (if applicable) -->
      <Input
        v-if="question.type === 'short-answer'"
        label="Correct Answer"
        v-model="question.correctAnswer"
        @update:modelValue="updateQuestionField(qIndex, 'correctAnswer', $event)"
        class="mb-3"
      />
      
      <Input
        label="Points for this Question"
        type="number"
        v-model="question.points"
        @update:modelValue="updateQuestionField(qIndex, 'points', $event)"
        class="mb-3"
      />

      <div>
        <label :for="`explanation-${question.id}`" class="block text-sm font-medium text-gray-700">Explanation (optional)</label>
        <div class="mt-1 relative rounded-md">
          <textarea
            :id="`explanation-${question.id}`"
            v-model="question.explanation"
            @input="updateQuestionField(qIndex, 'explanation', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            :class="[
              'block w-full rounded-md border-gray-300 transition-all focus:border-primary focus:ring-primary sm:text-sm'
            ]"
            class="mb-3"
          ></textarea>
        </div>
      </div>
    </div>

    <Button type="button" @click="addQuestion" variant="primary" class="mt-4">Add New Question</Button>
    <Button type="button" variant="secondary" class="mt-4 ml-3">Import from CSV (Coming Soon)</Button>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, computed, withDefaults, defineProps, defineEmits } from 'vue';
import Card from '@/components/common/Card.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Dropdown from '@/components/common/Dropdown.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

// Mock Data Types
interface QuestionOption {
  label: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

const props = withDefaults(defineProps<{
  modelValue: QuizQuestion[];
}>(), {
  modelValue: () => [],
});

const emit = defineEmits(['update:modelValue']);

const questions = ref<QuizQuestion[]>(props.modelValue);
const errors = ref<Record<string, string | null>>({}); // Simple local error handling for builder

const questionTypeOptions = [
  { label: 'Multiple Choice', value: 'multiple-choice' },
  { label: 'True/False', value: 'true-false' },
  { label: 'Short Answer', value: 'short-answer' },
];

watch(() => props.modelValue, (newVal) => {
  questions.value = newVal;
}, { deep: true });

const addQuestion = () => {
  questions.value.push({
    id: uuidv4(),
    text: '',
    type: 'multiple-choice',
    options: [{ label: '', value: uuidv4() }],
    correctAnswer: '',
    points: 1,
    explanation: '',
  });
  updateModelValue();
};

const removeQuestion = (index: number) => {
  questions.value.splice(index, 1);
  updateModelValue();
};

const updateQuestionField = (qIndex: number, field: keyof QuizQuestion, value: any) => {
  (questions.value[qIndex] as any)[field] = value;
  // Basic validation here if needed
  updateModelValue();
};

const addOption = (qIndex: number) => {
  if (questions.value[qIndex].options) {
    questions.value[qIndex].options!.push({ label: '', value: uuidv4() });
  } else {
    questions.value[qIndex].options = [{ label: '', value: uuidv4() }];
  }
  updateModelValue();
};

const removeOption = (qIndex: number, oIndex: number) => {
  questions.value[qIndex].options!.splice(oIndex, 1);
  // If removed option was correct answer, clear correctAnswer
  if (questions.value[qIndex].correctAnswer === questions.value[qIndex].options![oIndex].value) {
    questions.value[qIndex].correctAnswer = '';
  }
  updateModelValue();
};

const updateOptionField = (qIndex: number, oIndex: number, field: keyof QuestionOption, value: any) => {
  (questions.value[qIndex].options![oIndex] as any)[field] = value;
  updateModelValue();
};

const updateModelValue = () => {
  emit('update:modelValue', questions.value);
};
</script>