export function ErrorSimple({ error }: { error: Error; reset?: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <div>{error.name}</div>
      {/* TODO */}
      <button onClick={() => null}>Try again</button>
    </div>
  );
}
