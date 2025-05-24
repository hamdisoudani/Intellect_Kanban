import * as Yup from 'yup';

/**
 * Validation schema for creating a new board
 */
export const createBoardSchema = Yup.object({
  name: Yup.string()
    .required('Board name is required')
    .min(3, 'Board name must be at least 3 characters long')
    .max(50, 'Board name must not exceed 50 characters'),
  
  description: Yup.string()
    .optional()
    .max(250, 'Description must not exceed 250 characters'),
  
  classId: Yup.string()
    .required('Class ID is required'),
  
  // Default columns will be added in the component or service
  columns: Yup.array().notRequired()
});

/**
 * Initial values for the create board form
 */
export const createBoardInitialValues = {
  name: '',
  description: '',
  classId: '',
  columns: []
}; 