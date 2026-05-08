export const CATEGORIES = [
  { id: 'work',     label: 'Work',     bg: '#E6F1FB', text: '#0C447C' },
  { id: 'personal', label: 'Personal', bg: '#EEEDFE', text: '#3C3489' },
  { id: 'health',   label: 'Health',   bg: '#EAF3DE', text: '#27500A' },
  { id: 'learning', label: 'Learning', bg: '#FAEEDA', text: '#633806' },
  { id: 'creative', label: 'Creative', bg: '#FBEAF0', text: '#72243E' },
  { id: 'social',   label: 'Social',   bg: '#FAECE7', text: '#712B13' },
  { id: 'admin',    label: 'Admin',    bg: '#F1EFE8', text: '#444441' },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export function getCat(id) {
  return CAT_MAP[id] ?? { id, label: id, bg: '#F1EFE8', text: '#444441' };
}
