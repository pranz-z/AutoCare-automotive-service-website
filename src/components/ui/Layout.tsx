import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[72rem] px-5 sm:px-8 ${className}`}>
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
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? (
        <p
          className={`text-[12px] font-semibold tracking-[0.22em] uppercase mb-3 ${light ? "text-accent" : "text-accent"}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-heading text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] tracking-tight ${light ? "text-inverted" : "text-ink"}`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-base sm:text-lg leading-relaxed ${light ? "text-inverted/70" : "text-muted"}`}>
          {description}
        </p>
      ) : null}
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
    <section className="bg-primary text-inverted pt-28 pb-16 sm:pt-32 sm:pb-20">
      <Container>
        {eyebrow ? (
          <p className="text-[12px] font-semibold tracking-[0.22em] uppercase text-accent mb-4">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl max-w-4xl leading-[1.05]">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg text-inverted/70 leading-relaxed">{description}</p>
        ) : null}
      </Container>
    </section>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-line px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted">
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
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
}) {
  const shared =
    "w-full bg-surface border border-line px-3.5 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold tracking-[0.14em] uppercase text-muted">
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
          onChange={(event) => onChange(event.target.value)}
          className={shared}
        />
      )}
    </label>
  );
}
