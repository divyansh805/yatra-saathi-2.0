export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="30"
        height="30"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="9" fill="#123D3A" />
        <circle cx="24" cy="11" r="4" fill="#E9A34A" />
        <path d="M5 24L13.5 14.5L20 21.5L24.5 17L31 24H5Z" fill="#8CC9E8" />
        <path d="M6 27.5C11 25.5 16 29.5 22 27.5C25.5 26.3 28.5 26.5 31 27.5" stroke="#F8F6F0" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span
        className={`font-editorial text-lg font-semibold tracking-tight ${
          light ? 'text-white' : 'text-[#123D3A]'
        }`}
      >
        Yatra Saathi
      </span>
    </span>
  );
}
