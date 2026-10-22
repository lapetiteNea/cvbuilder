export const MAX_PHOTO_LENGTH = 300000;
export function validPhoto(value) {
  return (
    typeof value === "string" &&
    value.length <= MAX_PHOTO_LENGTH &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}
export function validatePhotoFile(file) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("აირჩიე JPG, PNG ან WebP ფოტო.");
  }
  if (!file.size || file.size > 8 * 1024 * 1024) {
    throw new Error("ფოტოს ზომა უნდა იყოს 8 MB-მდე.");
  }
}
export async function preparePhoto(file) {
  validatePhotoFile(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("ფოტოს გახსნა ვერ მოხერხდა. სცადე სხვა ფაილი.");
    }
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40000000
    ) {
      throw new Error(
        "ფოტოს გარჩევადობა მეტისმეტად დიდია. აირჩიე შემცირებული ფოტო.",
      );
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      480 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("ფოტოს დამუშავება ვერ მოხერხდა.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg", 0.82);
    if (!validPhoto(photo))
      throw new Error("ფოტო ვერ შემცირდა. სცადე სხვა ფაილი.");
    return photo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
