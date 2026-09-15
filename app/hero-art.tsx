// Placeholder hero illustration: stylized stacks of sealed hobby boxes and
// graded card slabs, using the site's own brand colors rather than any
// franchise's actual color scheme or logo (avoids trademark/copyright
// issues with Pokemon/One Piece/Magic: The Gathering artwork). Swap for
// real product photography once physical inventory is on hand -- this
// component's job is just to fill the same hero backdrop slot.
export function HeroArt() {
  return (
    <svg
      viewBox="0 0 900 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Back stack of sealed boxes */}
      <g transform="translate(90,150) rotate(-6)">
        <rect x="0" y="0" width="150" height="95" rx="6" fill="#0A5572" opacity="0.9" />
        <rect x="0" y="0" width="150" height="22" rx="6" fill="#083f54" />
        <rect x="14" y="34" width="122" height="10" rx="2" fill="#FDFDFD" opacity="0.55" />
        <rect x="14" y="52" width="80" height="8" rx="2" fill="#FDFDFD" opacity="0.35" />
      </g>
      <g transform="translate(110,110) rotate(-6)">
        <rect x="0" y="0" width="150" height="46" rx="6" fill="#0A5572" />
        <rect x="0" y="0" width="150" height="16" rx="6" fill="#083f54" />
      </g>

      {/* Middle stack */}
      <g transform="translate(330,190) rotate(4)">
        <rect x="0" y="0" width="170" height="105" rx="8" fill="#2FA9B6" opacity="0.92" />
        <rect x="0" y="0" width="170" height="24" rx="8" fill="#23838d" />
        <rect x="16" y="38" width="138" height="12" rx="2" fill="#FDFDFD" opacity="0.55" />
        <rect x="16" y="58" width="90" height="9" rx="2" fill="#FDFDFD" opacity="0.35" />
      </g>
      <g transform="translate(350,148) rotate(4)">
        <rect x="0" y="0" width="170" height="52" rx="8" fill="#2FA9B6" />
        <rect x="0" y="0" width="170" height="18" rx="8" fill="#23838d" />
      </g>

      {/* Front stack */}
      <g transform="translate(560,220) rotate(-3)">
        <rect x="0" y="0" width="160" height="98" rx="8" fill="#EA942C" opacity="0.95" />
        <rect x="0" y="0" width="160" height="22" rx="8" fill="#c67716" />
        <rect x="14" y="36" width="130" height="11" rx="2" fill="#1a1300" opacity="0.35" />
        <rect x="14" y="55" width="86" height="8" rx="2" fill="#1a1300" opacity="0.22" />
      </g>
      <g transform="translate(580,178) rotate(-3)">
        <rect x="0" y="0" width="160" height="48" rx="8" fill="#EA942C" />
        <rect x="0" y="0" width="160" height="16" rx="8" fill="#c67716" />
      </g>

      {/* Graded card slabs, leaning against the stacks */}
      <g transform="translate(230,80) rotate(-10)">
        <rect x="0" y="0" width="86" height="130" rx="10" fill="#FDFDFD" stroke="#D04A2D" strokeWidth="4" />
        <rect x="8" y="10" width="70" height="18" rx="4" fill="#D04A2D" />
        <rect x="8" y="38" width="70" height="80" rx="4" fill="#e1e5e7" />
      </g>
      <g transform="translate(690,120) rotate(8)">
        <rect x="0" y="0" width="86" height="130" rx="10" fill="#FDFDFD" stroke="#0A5572" strokeWidth="4" />
        <rect x="8" y="10" width="70" height="18" rx="4" fill="#0A5572" />
        <rect x="8" y="38" width="70" height="80" rx="4" fill="#e1e5e7" />
      </g>
    </svg>
  );
}
