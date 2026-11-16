const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-white";

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-neutral-500">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export default function CustomizePanel({ config, errors, onChange }) {
  const text = (key, label, props = {}) => (
    <Field label={label} error={errors[key]} hint={props.hint}>
      <input
        className={inputClass}
        value={config[key]}
        placeholder={props.placeholder}
        onChange={(e) => onChange(key, e.target.value)}
      />
    </Field>
  );

  return (
    <div className="space-y-4">
      {text("url", "Paste a YouTube link", {
        placeholder: "https://youtube.com/watch?v=...",
      })}
      {/* {text("title", "Name (optional)", {
        placeholder: "My video",
        hint: "Shown in the browser tab",
      })} */}

      {/* <Field label="Brand color">
        <input
          type="color"
          className="h-10 w-full cursor-pointer rounded-lg border border-neutral-300 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
          value={config.color}
          onChange={(e) => onChange("color", e.target.value)}
        />
      </Field>

      {text("cover", "Cover image URL", {
        placeholder: "https://...",
        hint: "Optional. Defaults to the video thumbnail.",
      })}
      {text("endMessage", "Closing message", {
        placeholder: "Thanks for watching",
      })}
      {text("ctaLabel", "Button label", { placeholder: "Visit our site" })}
      {text("ctaUrl", "Button link", { placeholder: "https://" })} */}
    </div>
  );
}

export { inputClass };
