const CONTENT_TYPES: Record<string, string> = {
  epub: "application/epub+zip",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  xhtml: "application/xhtml+xml",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  ncx: "application/x-dtbncx+xml",
  opf: "application/oebps-package+xml",
  xml: "application/xml",
  otf: "font/otf",
  ttf: "font/ttf",
  woff: "font/woff",
  woff2: "font/woff2",
  js: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
};

export function contentTypeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}
