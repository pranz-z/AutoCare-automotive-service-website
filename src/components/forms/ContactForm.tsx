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

  const submit = (event: React.FormEvent) => {
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
    setDone(true);
  };

  if (done) {
    return (
      <div className="border border-line bg-surface p-8">
        <p className="text-[12px] uppercase tracking-[0.2em] text-accent">Received</p>
        <h3 className="font-heading text-2xl mt-2">Message sent.</h3>
        <p className="mt-2 text-muted">
          {company.name} will reply to {email}. For urgent work, call {company.phone}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
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
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button type="submit">Send message</Button>
    </form>
  );
}
