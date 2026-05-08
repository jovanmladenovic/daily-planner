export async function fetchAISuggestions(taskTitle) {
  const res = await fetch('/api/suggest-steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskTitle }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.suggestions;
}
