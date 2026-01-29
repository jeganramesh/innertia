<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Manage Classes</h1>

    <!-- Create New Class Section -->
    <Card class="mb-6 p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">{{ isEditMode ? 'Edit Class' : 'Create New Class' }}</h2>
      <ClassForm
        @submit="handleClassFormSubmit"
        @cancel="closeClassForm"
        :initial-data="selectedClass"
        :is-edit-mode="isEditMode"
      />
    </Card>

    <!-- Existing Classes List -->
    <Card class="p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Your Classes</h2>
      <div v-if="classes.length > 0" class="space-y-4">
        <div v-for="cls in classes" :key="cls.id" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm">
          <div>
            <h3 class="font-bold text-lg text-gray-800">{{ cls.name }}</h3>
            <p class="text-gray-600 text-sm">{{ cls.subject }} - {{ cls.students.length }} Students</p>
            <p v-if="cls.joinCode" class="text-sm text-gray-500">Join Code: <span class="font-mono bg-gray-200 px-1 rounded">{{ cls.joinCode }}</span></p>
          </div>
          <div class="flex space-x-2">
            <Button size="sm" variant="secondary" @click="editClass(cls)">Edit</Button>
            <Button size="sm" variant="danger" @click="confirmDeleteClass(cls)">Delete</Button>
            <Button size="sm" variant="info" @click="manageStudents(cls)">Manage Students</Button>
            <Button size="sm" variant="info" @click="viewAnalytics(cls)">Analytics</Button>
          </div>
        </div>
      </div>
      <EmptyState v-else title="No Classes Yet" message="Start by creating your first class above!" icon="🏫" />
    </Card>

    <!-- Confirmation Dialog for Delete -->
    <ConfirmDialog
      :is-open="isConfirmDeleteOpen"
      title="Delete Class"
      :message="`Are you sure you want to delete class '${classToDelete?.name}'? This action cannot be undone.`"
      @confirm="deleteClass"
      @cancel="cancelDeleteClass"
    />

    <!-- Manage Students Modal -->
    <Modal :is-open="isManageStudentsModalOpen" :title="`Manage Students for ${classToManage?.name}`" @close="closeManageStudentsModal">
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-3">Enrolled Students</h3>
        <ul v-if="classToManage?.students && classToManage.students.length > 0" class="space-y-2 mb-4">
          <li v-for="student in classToManage.students" :key="student.id" class="flex justify-between items-center bg-gray-50 p-2 rounded-md">
            <span>{{ student.name }} ({{ student.email }})</span>
            <Button size="sm" variant="danger" @click="removeStudent(classToManage.id, student.id)">Remove</Button>
          </li>
        </ul>
        <EmptyState v-else title="No Students" message="No students enrolled in this class yet." class="mb-4" />

        <h3 class="font-semibold text-lg mb-3">Add Student</h3>
        <div class="flex space-x-2">
          <Input v-model="studentEmailToAdd" placeholder="Student email" class="flex-grow" />
          <Button @click="addStudent(classToManage?.id, studentEmailToAdd)">Add</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import ClassForm from '@/components/forms/ClassForm.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  description: string;
  subject: string;
  joinCode?: string;
  students: Student[];
  progress: number;
  quizzes: number;
}

const router = useRouter();
const notification = useNotification();

const classes = ref<Class[]>([
  { id: 'cls-1', name: 'Mathematics 101', description: 'Intro to Algebra', subject: 'Math', joinCode: 'MATH101', students: [{id: 's1', name: 'Alice', email: 'alice@example.com'}], progress: 70, quizzes: 5 },
  { id: 'cls-2', name: 'Physics Basics', description: 'Fundamental principles', subject: 'Science', students: [], progress: 30, quizzes: 2 },
]);

const isEditMode = ref(false);
const selectedClass = ref<Partial<Class> | null>(null);

const isConfirmDeleteOpen = ref(false);
const classToDelete = ref<Class | null>(null);

const isManageStudentsModalOpen = ref(false);
const classToManage = ref<Class | null>(null);
const studentEmailToAdd = ref('');

const handleClassFormSubmit = (formData: any) => {
  if (isEditMode.value && selectedClass.value) {
    const index = classes.value.findIndex(cls => cls.id === selectedClass.value!.id);
    if (index !== -1) {
      Object.assign(classes.value[index], formData);
    }
    notification.success('Class updated successfully!');
  } else {
    const newClass: Class = {
      id: `cls-${Date.now()}`,
      students: [],
      progress: 0,
      quizzes: 0,
      ...formData
    };
    classes.value.push(newClass);
    notification.success('Class created successfully!');
  }
  closeClassForm();
};

const closeClassForm = () => {
  isEditMode.value = false;
  selectedClass.value = null;
};

const editClass = (cls: Class) => {
  isEditMode.value = true;
  selectedClass.value = { ...cls }; // Deep copy
};

const confirmDeleteClass = (cls: Class) => {
  classToDelete.value = cls;
  isConfirmDeleteOpen.value = true;
};

const deleteClass = () => {
  if (classToDelete.value) {
    classes.value = classes.value.filter(cls => cls.id !== classToDelete.value!.id);
    notification.success(`Class '${classToDelete.value.name}' deleted.`);
  }
  isConfirmDeleteOpen.value = false;
  classToDelete.value = null;
};

const cancelDeleteClass = () => {
  isConfirmDeleteOpen.value = false;
  classToDelete.value = null;
};

const manageStudents = (cls: Class) => {
  classToManage.value = cls;
  isManageStudentsModalOpen.value = true;
};

const closeManageStudentsModal = () => {
  isManageStudentsModalOpen.value = false;
  classToManage.value = null;
  studentEmailToAdd.value = '';
};

const addStudent = (classId: string | undefined, email: string) => {
  if (!classId || !email) {
    notification.error('Class ID or email is missing.');
    return;
  }
  // Simulate API call to find student by email and enroll
  const targetClass = classes.value.find(cls => cls.id === classId);
  if (targetClass && !targetClass.students.some(s => s.email === email)) {
    const newStudent: Student = { id: `s-${Date.now()}`, name: email.split('@')[0], email };
    targetClass.students.push(newStudent);
    notification.success(`Student ${email} added to ${targetClass.name}.`);
    studentEmailToAdd.value = '';
  } else if (targetClass?.students.some(s => s.email === email)) {
    notification.warning('Student already in this class.');
  } else {
    notification.error('Class not found or student email invalid.');
  }
};

const removeStudent = (classId: string, studentId: string) => {
  const targetClass = classes.value.find(cls => cls.id === classId);
  if (targetClass) {
    targetClass.students = targetClass.students.filter(s => s.id !== studentId);
    notification.success('Student removed from class.');
  }
};

const viewAnalytics = (cls: Class) => {
  router.push({ name: 'class-analytics', params: { classId: cls.id } });
};

onMounted(() => {
  // Fetch classes from API on mount
});
</script>