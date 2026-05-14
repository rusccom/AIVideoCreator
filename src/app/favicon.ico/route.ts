const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#070d12"/>
<path d="M18 16h28a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="#111827" stroke="#22d3ee" stroke-width="3"/>
<path d="M28 25v14l13-7-13-7Z" fill="#a7f3d0"/>
<path d="M17 51h30" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
</svg>`;

export function GET() {
  return new Response(iconSvg, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/svg+xml"
    }
  });
}
