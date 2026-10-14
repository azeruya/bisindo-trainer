type CatMascotProps = {
  mood?: "idle" | "holding" | "correct";
};

const INK = "#35264F";
const CREAM = "#FFF8ED";
const PEACH = "#FFCFB3";
const PINK = "#F4B4D4";
const GRAPE = "#8B7CF6";
const MINT = "#B8ECCF";

export default function CatMascot({
  mood = "idle",
}: CatMascotProps) {
  const happy = mood === "correct";
  const focused = mood === "holding";

  return (
    <div className={`cat-mascot cat-${mood}`}>
      <svg
        viewBox="0 0 180 120"
        aria-hidden="true"
      >
        {/* head + ears */}
        <path
          d="
            M43 77
            Q38 60 47 46
            L44 20
            L67 37
            Q90 28 113 37
            L136 20
            L133 48
            Q142 61 137 77
            Q132 99 90 101
            Q48 99 43 77
            Z
          "
          fill={CREAM}
          stroke={INK}
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* ears */}
        <path
          d="M51 30 L61 39 L49 45 Z"
          fill={PINK}
        />

        <path
          d="M129 30 L119 39 L131 45 Z"
          fill={PINK}
        />

        {/* forehead accent */}
        <path
          d="M82 39 Q90 34 98 39"
          fill="none"
          stroke={PEACH}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* eyes */}
        {happy ? (
          <>
            <path
              d="M61 66 Q68 58 75 66"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M105 66 Q112 58 119 66"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        ) : focused ? (
          <>
            <ellipse
              cx="68"
              cy="65"
              rx="5"
              ry="7"
              fill={INK}
            />

            <ellipse
              cx="112"
              cy="65"
              rx="5"
              ry="7"
              fill={INK}
            />

            <circle
              cx="66.5"
              cy="62.5"
              r="1.5"
              fill="white"
            />

            <circle
              cx="110.5"
              cy="62.5"
              r="1.5"
              fill="white"
            />
          </>
        ) : (
          <>
            <path
              d="M62 65 Q68 68 74 65"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M106 65 Q112 68 118 65"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}

        {/* cheeks */}
        <ellipse
          cx="54"
          cy="76"
          rx="8"
          ry="4"
          fill={PINK}
          opacity="0.5"
        />

        <ellipse
          cx="126"
          cy="76"
          rx="8"
          ry="4"
          fill={PINK}
          opacity="0.5"
        />

        {/* nose */}
        <path
          d="M90 70 L86 74 L94 74 Z"
          fill="#E9829F"
        />

        {/* mouth */}
        {happy ? (
          <path
            d="M82 78 Q90 89 98 78"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M82 78 Q86 82 90 78 Q94 82 98 78"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* whiskers */}
        <path
          d="
            M54 73 L31 69
            M55 80 L29 82
            M126 73 L149 69
            M125 80 L151 82
          "
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* paws gripping card */}
        <g className="cat-paws">
          <path
            d="
              M58 95
              Q55 103 62 108
              Q72 111 79 102
              L79 95
              Z
            "
            fill={CREAM}
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />

          <path
            d="
              M101 95
              L101 102
              Q108 111 118 108
              Q125 103 122 95
              Z
            "
            fill={CREAM}
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>

        {/* little paw lines */}
        <path
          d="M65 101 L65 105 M72 101 L72 105"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M108 101 L108 105 M115 101 L115 105"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* celebration */}
        {happy && (
          <g className="cat-sparkles">
            <path
              d="
                M26 31
                L29 39
                L37 42
                L29 45
                L26 53
                L23 45
                L15 42
                L23 39
                Z
              "
              fill={MINT}
              stroke={INK}
              strokeWidth="2"
            />

            <circle
              cx="151"
              cy="37"
              r="5"
              fill={GRAPE}
            />

            <path
              d="
                M151 18
                L153 23
                L158 25
                L153 27
                L151 32
                L149 27
                L144 25
                L149 23
                Z
              "
              fill={PINK}
            />
          </g>
        )}
      </svg>
    </div>
  );
}