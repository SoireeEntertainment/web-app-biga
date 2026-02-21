"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#b91c1c" }}>Errore</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && error.stack && (
          <pre style={{ overflow: "auto", fontSize: "12px", background: "#f5f5f5", padding: "1rem" }}>
            {error.stack}
          </pre>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          Riprova
        </button>
      </body>
    </html>
  );
}
