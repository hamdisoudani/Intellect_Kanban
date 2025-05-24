import * as Yup from 'yup';

/**
 * Validation schema for creating a new class
 */
export const createClassSchema = Yup.object({
  name: Yup.string()
    .required('Class name is required')
    .min(3, 'Class name must be at least 3 characters long')
    .max(50, 'Class name must not exceed 50 characters')
});

/**
 * Initial values for the create class form
 */
export const createClassInitialValues = {
  name: ''
}; 