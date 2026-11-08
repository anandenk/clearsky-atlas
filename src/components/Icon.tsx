export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    Environment: (
      <>
        <path d="M3 8h12c5 0 5-6 1-6M3 12h16c5 0 5 7 0 7M3 16h8c4 0 4 6 0 6" />
      </>
    ),
    Health: (
      <>
        <path d="M20 13c3-3 2-9-3-9-3 0-5 3-5 3S10 4 7 4c-5 0-6 6-3 9l8 8z" />
        <path d="M2 12h5l2-3 3 6 2-3h8" />
      </>
    ),
    Community: (
      <>
        <circle cx="8" cy="7" r="3" />
        <path d="M2 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 3c3 0 4 2 4 5v2" />
      </>
    ),
    Infrastructure: (
      <>
        <path d="M3 21V8h7v13M10 21V3h10v18M1 21h22M6 11v2m0 3v2m8-11h2m-2 4h2m-2 4h2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
      </>
    ),
    chevron: <path d="m8 5 7 7-7 7" />,
    check: <path d="m5 12 4 4L20 5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}
export function BrandMark() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 24c9-21 23-21 32 0M7 29c7-18 19-18 26 0M11 33c5-14 13-14 18 0M16 36c2-9 6-9 8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
