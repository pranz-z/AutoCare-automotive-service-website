"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Layout";
import { getCompany } from "@/lib/content";

export function ContactForm() {
  const company = getCompany();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("service");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !email || !message) {
      setError("Name, email, and message are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, topic, message }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Your message could not be sent. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="border border-line bg-surface p-8">
        <div className="h-1 w-12 bg-accent" />
        <p className="meta mt-4 text-accent">Received</p>
        <h3 className="font-heading text-2xl mt-2">Message sent.</h3>
        <p className="mt-2 text-muted">
          {company.name} will reply to {email}. For urgent work, call {company.phone}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 border border-line bg-surface p-5 sm:p-8">
      <Field label="Name" name="name" required value={name} onChange={setName} />
      <Field label="Email" name="email" type="email" required value={email} onChange={setEmail} />
      <Field label="Phone" name="phone" value={phone} onChange={setPhone} />
      <Field
        label="Topic"
        name="topic"
        as="select"
        value={topic}
        onChange={setTopic}
        options={[
          { value: "service", label: "Service inquiry" },
          { value: "fleet", label: "Fleet / corporate" },
          { value: "coverage", label: "Request a service area" },
          { value: "other", label: "Other" },
        ]}
      />
      <Field label="Message" name="message" as="textarea" required value={message} onChange={setMessage} />
      {error ? <p role="alert" className="border-l-2 border-red-600 pl-3 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
