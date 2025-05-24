import * as Yup from 'yup';

export const createActivitySchema = Yup.object({
  title: Yup.string()
    .required('Activity title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),

  description: Yup.string()
    .optional()
    .max(500, 'Description must not exceed 500 characters'),

  dueDate: Yup.date()
    .nullable()
    .transform((curr, orig) => orig === '' ? null : curr)
    .test('is-future', 'Due date must be in the future', value => {
      if (!value) return true;
      return value > new Date();
    }),

  type: Yup.string()
    .oneOf(['personal', 'meta'], 'Invalid activity type')
    .required('Activity type is required'),

  assignedStudents: Yup.array()
    .of(Yup.string().required('Student ID is required'))
    .when('type', {
      is: 'meta',
      then: schema => schema,
      otherwise: schema => schema.test(
        'empty-if-personal',
        'Personal activities cannot have assigned students',
        value => !value || value.length === 0
      )
    })
});

export const createActivityInitialValues = {
  title: '',
  description: '',
  dueDate: '',
  type: 'personal',
  assignedStudents: []
}; 