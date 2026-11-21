export const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const SLOT_VALUES = SLOTS.map((s) => s.value);
export const MIN_VALUE = 40;
export const MAX_VALUE = 600;
