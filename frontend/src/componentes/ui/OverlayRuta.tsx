export function OverlayRuta() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        className="trazo-ruta"
        d="M 40 700 C 140 640, 90 460, 220 400 C 340 345, 260 180, 360 90"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle className="punto punto--inicio" cx="40" cy="700" r="8" fill="#101828" />
      <circle className="punto punto--fin" cx="360" cy="90" r="9" fill="#7C3AED" />
      <circle
        className="punto punto--pulso"
        cx="360"
        cy="90"
        r="9"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2.5"
      />
    </svg>
  );
}
