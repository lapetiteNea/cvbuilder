import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyResume, validate, normalize, moveSection } from "../js/model.js";
import { readAll, save, remove } from "../js/storage.js";
const valid = () => ({
  ...emptyResume(),
  name: "Test Candidate",
  email: "test@example.com",
  phone: "+995 (555) 12-34-56",
});
function memory() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
}
test("required name, email and phone reject empty values", () =>
  assert.equal(Object.keys(validate(emptyResume())).length, 3));
test("valid international phone and email pass", () =>
  assert.deepEqual(validate(valid()), {}));
test("reject malformed email and too short phone", () =>
  assert.equal(
    Object.keys(validate({ ...valid(), email: "a@", phone: "123" })).length,
    2,
  ));
test("move sections without mutating original or crossing bounds", () => {
  const order = emptyResume().order;
  assert.deepEqual(moveSection(order, 1, -1), [
    "education",
    "experience",
    "skills",
  ]);
  assert.deepEqual(moveSection(order, 0, -1), order);
  assert.equal(order[0], "experience");
});
test("save multiple CVs, update one and remove one", () => {
  const storage = memory();
  const a = save(valid(), storage);
  const b = save(valid(), storage);
  assert.notEqual(a.id, b.id);
  save({ ...a, title: "Updated" }, storage);
  assert.equal(readAll(storage).length, 2);
  assert.equal(readAll(storage)[0].title, "Updated");
  remove(a.id, storage);
  assert.equal(readAll(storage)[0].id, b.id);
});
test("corrupted storage is not silently overwritten", () => {
  const storage = memory();
  storage.setItem("cvbuilder_rebuild_v1", "broken");
  assert.throws(() => save(valid(), storage));
  assert.equal(storage.getItem("cvbuilder_rebuild_v1"), "broken");
});
test("storage write failures propagate", () => {
  assert.throws(() =>
    save(valid(), {
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    }),
  );
});
test("normalize rejects unsupported template color and duplicate order", () => {
  const data = normalize({
    template: "bad",
    color: "red;",
    order: ["skills", "skills", "skills"],
    education: [null, { title: "Degree" }],
  });
  assert.equal(data.template, "modern");
  assert.equal(data.color, "#315a4b");
  assert.deepEqual(data.order, emptyResume().order);
  assert.equal(data.education.length, 1);
});
