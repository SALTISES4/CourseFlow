/**
 * Fixed discipline catalogue per FR-PROJ-FORM-001 / FR-EXP-003 — ordered A to Z.
 * Shared by explore disciplineFilter and projectDisciplineField calibration tests.
 */
export const DISCIPLINE_CATALOGUE_OPTIONS = [
  { id: 10, label: 'Anthropology' },
  { id: 3, label: 'Biology' },
  { id: 27, label: 'Business' },
  { id: 2, label: 'Chemistry' },
  { id: 8, label: 'Computer Science' },
  { id: 31, label: 'Design' },
  { id: 11, label: 'Economics' },
  { id: 9, label: 'Engineering' },
  { id: 28, label: 'English' },
  { id: 4, label: 'Environmental Science' },
  { id: 29, label: 'French' },
  { id: 12, label: 'Geography' },
  { id: 20, label: 'History' },
  { id: 24, label: 'Humanities (General)' },
  { id: 30, label: 'Languages' },
  { id: 22, label: 'Law' },
  { id: 21, label: 'Literature' },
  { id: 6, label: 'Mathematics' },
  { id: 25, label: 'Medicine' },
  { id: 26, label: 'Nursing' },
  { id: 32, label: 'Other' },
  { id: 18, label: 'Performing Arts' },
  { id: 7, label: 'Philosophy' },
  { id: 1, label: 'Physics' },
  { id: 13, label: 'Political Science' },
  { id: 14, label: 'Psychology' },
  { id: 5, label: 'Science (General)' },
  { id: 17, label: 'Social Sciences (General)' },
  { id: 16, label: 'Social Work' },
  { id: 15, label: 'Sociology' },
  { id: 23, label: 'Theology' },
  { id: 19, label: 'Visual Arts' },
] as const;

export const DISCIPLINE_CATALOGUE_AZ = DISCIPLINE_CATALOGUE_OPTIONS.map(
  (option) => option.label,
);
