export function OverlayRuta() {
  return (
    <svg
      className="pagina-auth__overlay-ruta"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        d="M 40 700 C 140 640, 90 460, 220 400 C 340 345, 260 180, 360 90"
        fill="none"
        stroke="#2E5CFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle className="punto punto--inicio" cx="40" cy="700" r="8" fill="#101828" />
      <circle className="punto punto--fin" cx="360" cy="90" r="9" fill="#2E5CFF" />
      <circle
        className="punto punto--pulso"
        cx="360"
        cy="90"
        r="9"
        fill="none"
        stroke="#2E5CFF"
        strokeWidth="2.5"
      />
    </svg>
  );
}
