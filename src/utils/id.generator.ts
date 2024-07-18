export function generateId(): number {
  const min = 100000001;
  const max = 999999999;
  const uniqueId = Math.floor(Math.random() * (max - min + 1)) + min;

  return uniqueId;
}
