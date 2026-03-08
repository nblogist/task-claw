export default function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-red-400 text-xs mt-1">{error}</p>;
}
