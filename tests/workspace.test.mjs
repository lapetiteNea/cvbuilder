import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyResume } from "../js/model.js";
import {
  completion,
  exportResume,
  importResume,
  writeDraft,
  readDraft,
  clearDraft,
} from "../js/workspace.js";
function memory() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
}
test("backup roundtrip preserves CV content while creating a new identity", () => {
  const original = {
    ...emptyResume(),
    id: "saved-id",
    name: "Candidate",
    template: "creative",
    photo: "data:image/jpeg;base64,/9j/2Q==",
    order: ["skills", "education", "experience"],
    skills: [{ title: "JS", detail: "" }],
  };
  const restored = importResume(exportResume(original));
  assert.deepEqual(restored, { ...original, id: "" });
});
test("imports reject invalid JSON, unrelated data, future versions and oversized files", () => {
  for (const text of [
    "broken",
    "null",
    "[]",
    JSON.stringify({ app: "cvbuilder", version: 2, resume: emptyResume() }),
    "x".repeat(1000001),
  ])
    assert.throws(() => importResume(text));
});
test("imports reject malformed entries and excessive entry counts", () => {
  for (const experience of [
    [null],
    [{ title: 4, detail: "" }],
    Array.from({ length: 101 }, () => ({ title: "x", detail: "" })),
  ])
    assert.throws(() =>
      importResume(
        JSON.stringify({
          app: "cvbuilder",
          version: 1,
          resume: { ...emptyResume(), experience },
        }),
      ),
    );
});
test("drafts are separate for each CV and never modify another draft", () => {
  const storage = memory();
  writeDraft("", { ...emptyResume(), name: "New" }, storage);
  writeDraft("a", { ...emptyResume(), name: "A" }, storage);
  assert.equal(readDraft("", storage).name, "New");
  assert.equal(readDraft("a", storage).name, "A");
  clearDraft("a", storage);
  assert.equal(readDraft("a", storage), null);
  assert.equal(readDraft("", storage).name, "New");
});
test("completion measures useful sections without requiring a photo", () => {
  assert.equal(completion(emptyResume()), 0);
  const data = {
    ...emptyResume(),
    name: "Test",
    title: "Developer",
    email: "a@b.com",
    phone: "555123456",
    summary: "About",
    experience: [{ title: "Work", detail: "" }],
    education: [{ title: "School", detail: "" }],
    skills: [{ title: "HTML", detail: "" }],
  };
  assert.equal(completion(data), 100);
  assert.equal(completion({ ...data, email: "bad" }), 88);
});
