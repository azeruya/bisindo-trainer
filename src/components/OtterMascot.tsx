type OtterMascotProps = {
  mood?: "idle" | "holding" | "correct";
};

const INK = "#4A356E";

export default function OtterMascot({
  mood = "idle",
}: OtterMascotProps) {
  const happy = mood === "correct";
  const focused = mood === "holding";

  return (
    <div className={`otter-mascot otter-${mood}`}>
      <svg viewBox="0 0 180 130" aria-hidden="true">
        {/* tail behind */}
        <g className="otter-tail">
          <path
            d="M122 88
               Q154 94 156 72
               Q158 56 146 56
               Q132 56 126 72"
            fill="none"
            stroke={INK}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M122 88
               Q154 94 156 72
               Q158 56 146 56
               Q132 56 126 72"
            fill="none"
            stroke="#A66D52"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>

        {/* body/head */}
        <g className="otter-body">
          {/* head */}
          <ellipse
            cx="90"
            cy="58"
            rx="42"
            ry="34"
            fill="#9B6B52"
            stroke={INK}
            strokeWidth="5"
          />

          {/* ears */}
          <circle
            cx="62"
            cy="34"
            r="10"
            fill="#9B6B52"
            stroke={INK}
            strokeWidth="5"
          />
          <circle
            cx="118"
            cy="34"
            r="10"
            fill="#9B6B52"
            stroke={INK}
            strokeWidth="5"
          />
          <circle cx="62" cy="34" r="4.5" fill="#EEC9B1" />
          <circle cx="118" cy="34" r="4.5" fill="#EEC9B1" />

          {/* muzzle */}
          <ellipse
            cx="90"
            cy="68"
            rx="24"
            ry="18"
            fill="#F6E3D5"
            stroke={INK}
            strokeWidth="4"
          />

          {/* nose */}
          <ellipse
            cx="90"
            cy="61"
            rx="6"
            ry="4.5"
            fill="#5D3B2E"
          />

          {/* eyes */}
          {happy ? (
            <>
              <path
                d="M72 52 Q78 46 84 52"
                fill="none"
                stroke={INK}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M96 52 Q102 46 108 52"
                fill="none"
                stroke={INK}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          ) : focused ? (
            <>
              <ellipse cx="78" cy="51" rx="5" ry="7" fill={INK} />
              <ellipse cx="102" cy="51" rx="5" ry="7" fill={INK} />
              <circle cx="76.5" cy="49.5" r="1.4" fill="#fff" />
              <circle cx="100.5" cy="49.5" r="1.4" fill="#fff" />

              <path
                d="M70 42 L82 39"
                stroke={INK}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M98 39 L110 42"
                stroke={INK}
                strokeWidth="3"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <ellipse cx="78" cy="51" rx="4.8" ry="6" fill={INK} />
              <ellipse cx="102" cy="51" rx="4.8" ry="6" fill={INK} />
              <circle cx="76.5" cy="49.5" r="1.4" fill="#fff" />
              <circle cx="100.5" cy="49.5" r="1.4" fill="#fff" />
            </>
          )}

          {/* cheeks */}
          <ellipse
            cx="67"
            cy="69"
            rx="6"
            ry="3.8"
            fill="#F7B6C8"
            opacity="0.7"
          />
          <ellipse
            cx="113"
            cy="69"
            rx="6"
            ry="3.8"
            fill="#F7B6C8"
            opacity="0.7"
          />

          {/* mouth */}
          {happy ? (
            <path
              d="M81 72
                 Q90 83 99 72"
              fill="none"
              stroke={INK}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M83 73
                 Q90 78 97 73"
              fill="none"
              stroke={INK}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* whiskers */}
          <path
            d="M64 66 L48 62 M64 72 L46 72 M116 66 L132 62 M116 72 L134 72"
            fill="none"
            stroke={INK}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* paws on edge */}
          <g className="otter-paws">
            <ellipse
              cx="72"
              cy="102"
              rx="14"
              ry="11"
              fill="#F6E3D5"
              stroke={INK}
              strokeWidth="4"
            />
            <ellipse
              cx="108"
              cy="102"
              rx="14"
              ry="11"
              fill="#F6E3D5"
              stroke={INK}
              strokeWidth="4"
            />

            {/* little claws */}
            <path
              d="M66 101 L66 106 M72 100 L72 106 M78 101 L78 106
                 M102 101 L102 106 M108 100 L108 106 M114 101 L114 106"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* little splash / sparkles for correct */}
        {happy && (
          <g className="otter-sparkles">
            <circle cx="36" cy="42" r="5" fill="#8ED9C4" />
            <circle cx="145" cy="30" r="4" fill="#F7B6C8" />
            <path
              d="M30 78 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"
              fill="#F6D66A"
              stroke={INK}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}