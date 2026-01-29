import { ref, reactive, computed } from 'vue';

type ValidationRules = Record<string, ((value: any) => string | null)[]>;
type Errors = Record<string, string | null>;

export function useForm<T extends Record<string, any>>(initialValues: T, validationRules: ValidationRules = {}) {
  const values = reactive<T>({ ...initialValues });
  const errors = ref<Errors>({});
  const isSubmitting = ref(false);

  const validateField = (field: string) => {
    const rules = validationRules[field];
    if (rules) {
      for (const rule of rules) {
        const error = rule(values[field]);
        if (error) {
          errors.value[field] = error;
          return false;
        }
      }
    }
    errors.value[field] = null;
    return true;
  };

  const validateAll = () => {
    let isValid = true;
    for (const field in validationRules) {
      if (!validateField(field)) {
        isValid = false;
      }
    }
    return isValid;
  };

  const handleChange = (field: keyof T, value: any) => {
    values[field] = value;
    validateField(field as string); // Validate field on change
  };

  const handleSubmit = async (submitFunction: (values: T) => Promise<any>) => {
    if (!validateAll()) {
      return;
    }
    isSubmitting.value = true;
    try {
      await submitFunction(values);
      // Optionally reset form values here
      // Object.assign(values, initialValues);
    } catch (err) {
      console.error('Form submission error:', err);
      // Handle submission error, e.g., set a global form error
    } finally {
      isSubmitting.value = false;
    }
  };

  const resetForm = () => {
    Object.assign(values, initialValues);
    errors.value = {};
    isSubmitting.value = false;
  };

  const isValid = computed(() => {
    // Check if all fields with rules are valid
    for (const field in validationRules) {
      if (errors.value[field]) {
        return false;
      }
    }
    // Also consider if all fields are touched, but for simplicity, we'll just check validation
    return true;
  });

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    isValid,
    validateField,
    validateAll,
  };
}
