/**
 * Fixed discipline catalogue per FR-PROJ-FORM-001 / FR-EXP-003 — ordered A to Z.
 * Shared by explore disciplineFilter and projectDisciplineField calibration tests.
 */
export const DISCIPLINE_CATALOGUE_OPTIONS = [
  { code: 'anthropology', label: 'Anthropology' },
  { code: 'biology', label: 'Biology' },
  { code: 'business', label: 'Business' },
  { code: 'chemistry', label: 'Chemistry' },
  { code: 'computer_science', label: 'Computer Science' },
  { code: 'design', label: 'Design' },
  { code: 'economics', label: 'Economics' },
  { code: 'engineering', label: 'Engineering' },
  { code: 'english', label: 'English' },
  { code: 'environmental_science', label: 'Environmental Science' },
  { code: 'french', label: 'French' },
  { code: 'geography', label: 'Geography' },
  { code: 'history', label: 'History' },
  { code: 'humanities_general', label: 'Humanities (General)' },
  { code: 'languages', label: 'Languages' },
  { code: 'law', label: 'Law' },
  { code: 'literature', label: 'Literature' },
  { code: 'mathematics', label: 'Mathematics' },
  { code: 'medicine', label: 'Medicine' },
  { code: 'nursing', label: 'Nursing' },
  { code: 'other', label: 'Other' },
  { code: 'performing_arts', label: 'Performing Arts' },
  { code: 'philosophy', label: 'Philosophy' },
  { code: 'physics', label: 'Physics' },
  { code: 'political_science', label: 'Political Science' },
  { code: 'psychology', label: 'Psychology' },
  { code: 'science_general', label: 'Science (General)' },
  { code: 'social_sciences_general', label: 'Social Sciences (General)' },
  { code: 'social_work', label: 'Social Work' },
  { code: 'sociology', label: 'Sociology' },
  { code: 'theology', label: 'Theology' },
  { code: 'visual_arts', label: 'Visual Arts' },
] as const;

export const DISCIPLINE_CATALOGUE_AZ = DISCIPLINE_CATALOGUE_OPTIONS.map(
  (option) => option.label,
);
