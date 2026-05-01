// Format backend output JSON for display
export function formatOutput(data: any) {
  if (!data) return '';
  return JSON.stringify(data, null, 2);
}
