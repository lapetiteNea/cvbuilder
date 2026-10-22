import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePhotoFile, preparePhoto } from "../js/photo.js";

test("photo upload accepts supported raster files and rejects unsupported or oversized input", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.doesNotThrow(() => validatePhotoFile({ type, size: 1024 }));
  }
  for (const file of [
    { type: "image/svg+xml", size: 1024 },
    { type: "text/plain", size: 1024 },
    { type: "image/png", size: 0 },
    { type: "image/jpeg", size: 9 * 1024 * 1024 },
  ]) {
    assert.throws(() => validatePhotoFile(file));
  }
});

test("photo processing resizes to 480 pixels, produces JPEG and releases the file URL", async () => {
  const oldImage = globalThis.Image,
    oldDocument = globalThis.document;
  const oldCreate = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL;
  let revoked = false,
    drawn = false;
  const photo = "data:image/jpeg;base64,/9j/2Q==";
  const canvas = {
    getContext: () => ({
      fillRect() {},
      drawImage() {
        drawn = true;
      },
    }),
    toDataURL: (type, quality) => {
      assert.equal(type, "image/jpeg");
      assert.equal(quality, 0.82);
      return photo;
    },
  };
  try {
    URL.createObjectURL = () => "blob:test";
    URL.revokeObjectURL = (url) => {
      assert.equal(url, "blob:test");
      revoked = true;
    };
    globalThis.Image = class {
      naturalWidth = 2000;
      naturalHeight = 1000;
      async decode() {}
    };
    globalThis.document = { createElement: () => canvas };
    assert.equal(await preparePhoto({ type: "image/png", size: 1024 }), photo);
    assert.equal(canvas.width, 480);
    assert.equal(canvas.height, 240);
    assert.equal(drawn, true);
    assert.equal(revoked, true);
    revoked = false;
    globalThis.Image = class {
      async decode() {
        throw Error("corrupt");
      }
    };
    await assert.rejects(
      preparePhoto({ type: "image/jpeg", size: 1024 }),
      /გახსნა/,
    );
    assert.equal(revoked, true);
  } finally {
    globalThis.Image = oldImage;
    globalThis.document = oldDocument;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
