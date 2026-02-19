export function generateSampleColorImage(width = 256, height = 256): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ff6b6b");
  gradient.addColorStop(0.25, "#ffd93d");
  gradient.addColorStop(0.5, "#6bcb77");
  gradient.addColorStop(0.75, "#4d96ff");
  gradient.addColorStop(1, "#9b59b6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.4
  );
  radial.addColorStop(0, "rgba(255, 255, 255, 0.4)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/png");
}

export function generateSampleDepthImage(width = 256, height = 256): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const radial = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.5
  );
  radial.addColorStop(0, "#ffffff");
  radial.addColorStop(0.6, "#888888");
  radial.addColorStop(1, "#000000");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/png");
}
