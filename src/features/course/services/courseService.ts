import { api } from '@/services/api'; // Correct import path and named import

export const courseService = {
  // Example: Fetch all courses (relevant for admin overview)
  getAllCourses: async () => {
    try {
      const response = await api.get('/courses');
      return response;
    } catch (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
  },

  // Example: Fetch a single course by ID (relevant for admin to inspect)
  getCourseById: async (id: string) => {
    try {
      const response = await api.get(`/courses/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching course with ID ${id}:`, error);
      throw error;
    }
  },

  // (Optional, but admin-centric) Example: Create a new course
  // createCourse: async (courseData: any) => {
  //   try {
  //     const response = await api.post('/courses', courseData);
  //     return response;
  //   } catch (error) {
  //     console.error('Error creating course:', error);
  //     throw error;
  //   }
  // },

  // (Optional, but admin-centric) Example: Update a course
  // updateCourse: async (id: string, courseData: any) => {
  //   try {
  //     const response = await api.put(`/courses/${id}`, courseData);
  //     return response;
  //   } catch (error) => {
  //     console.error(`Error updating course with ID ${id}:`, error);
  //     throw error;
  //   }
  // },

  // (Optional, but admin-centric) Example: Delete a course
  // deleteCourse: async (id: string) => {
  //   try {
  //     const response = await api.delete(`/courses/${id}`);
  //     return response;
  //   } catch (error) => {
  //     console.error(`Error deleting course with ID ${id}:`, error);
  //     throw error;
  //   }
  // },
};