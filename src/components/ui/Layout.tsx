import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  light = false,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  light?: boolean;
  align?: "left" | "center";
}) {
  if (align === "center") {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className={`display text-4xl sm:text-5xl lg:text-6xl ${light ? "text-inverted" : "text-ink"}`}
        >
          {title}
        </h2>
        {description ? (
          <p className={`mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${light ? "text-inverted/70" : "text-muted"}`}>
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-3">
        {eyebrow ? (
          <>
            <p className={`meta ${light ? "text-accent" : "text-accent"}`}>{eyebrow}</p>
            <div className="mt-3 h-px w-10 bg-accent" />
          </>
        ) : null}
      </div>
      <div className="lg:col-span-9">
        <h2
          className={`display text-4xl sm:text-5xl lg:text-6xl ${light ? "text-inverted" : "text-ink"}`}
        >
          {title}
        </h2>
        {description ? (
          <p className={`mt-5 max-w-3xl text-base leading-relaxed sm:text-lg ${light ? "text-inverted/70" : "text-muted"}`}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-primary pb-14 pt-[8.5rem] text-inverted sm:pb-16">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[34%] border-l border-white/10 lg:block" />
      <div className="pointer-events-none absolute bottom-0 right-[34%] hidden h-20 w-px bg-accent/70 lg:block" />
      <Container className="relative">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            {eyebrow ? <p className="meta text-accent">{eyebrow}</p> : null}
            <div className="mt-4 h-px w-12 bg-accent" />
          </div>
          <div className="lg:col-span-9">
            <h1 className="display max-w-5xl text-5xl sm:text-6xl lg:text-7xl">{title}</h1>
            {description ? (
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-inverted/70 sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-current/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
      {children}
    </span>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
  min,
  as = "input",
  options,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
}) {
  const shared =
    "min-h-12 w-full rounded-none border border-line bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-muted/70 transition-colors duration-[var(--t-hover)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30";
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={shared}
        />
      ) : as === "select" ? (
        <select
          name={name}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        >
          <option value="">{placeholder ?? "Select"}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
    </label>
  );
}
