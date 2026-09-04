const Loading = ({ label = "Loading, please wait…" }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-screen items-center justify-center"
  >
    <span className="sr-only">{label}</span>
    <div
      aria-hidden="true"
      className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary"
    />
  </div>
);

export default Loading;
