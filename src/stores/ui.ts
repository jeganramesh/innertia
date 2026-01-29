import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const isSidebarOpen = ref(true);
  const activeModal = ref<string | null>(null);
  const notifications = ref<any[]>([]);
  
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };
  
  const openModal = (modalName: string) => {
    activeModal.value = modalName;
  };
  
  const closeModal = () => {
    activeModal.value = null;
  };
  
  const addNotification = (notification: any) => {
    notifications.value.push(notification);
  };
  
  const removeNotification = (id: string) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  };
  
  return {
    isSidebarOpen,
    activeModal,
    notifications,
    toggleSidebar,
    openModal,
    closeModal,
    addNotification,
    removeNotification,
  };
});