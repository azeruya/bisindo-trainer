type Landmark = {
  x: number;
  y: number;
  z: number;
};

type HandPose = {
  slot: number;
  landmarks: Landmark[];
};

type LandmarkGuideProps = {
  hands: HandPose[];
  mirror?: boolean;
};

const CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],

  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],

  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],

  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],

  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],

  [0, 17],
];

const FINGERTIPS = new Set([
  4,
  8,
  12,
  16,
  20,
]);

const HAND_STYLES = [
  {
    bone: "#5A4A72",
    joint: "#CFC4FF",
    fingertip: "#9C88F2",
    wrist: "#F3B2C8",
  },
  {
    bone: "#5A4A72",
    joint: "#FFD5E4",
    fingertip: "#EC9FC0",
    wrist: "#F3B2C8",
  },
];

export default function LandmarkGuide({
  hands,
  mirror = true,
}: LandmarkGuideProps) {
  const allPoints =
    hands.flatMap(
      (hand) => hand.landmarks
    );

  if (allPoints.length === 0) {
    return null;
  }

  const xs =
    allPoints.map(
      (point) => point.x
    );

  const ys =
    allPoints.map(
      (point) => point.y
    );

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const width =
    Math.max(
      maxX - minX,
      0.001
    );

  const height =
    Math.max(
      maxY - minY,
      0.001
    );

  const SVG_SIZE = 280;
  const PADDING = 34;

  const usableSize =
    SVG_SIZE -
    PADDING * 2;

  const scale =
    Math.min(
      usableSize / width,
      usableSize / height
    );

  const poseWidth =
    width * scale;

  const poseHeight =
    height * scale;

  const offsetX =
    (SVG_SIZE -
      poseWidth) /
    2;

  const offsetY =
    (SVG_SIZE -
      poseHeight) /
    2;

  const isTwoHandPose =
    hands.length > 1;

  const jointRadius = 3.5;
  const fingertipRadius = 5.2;
  const wristRadius = 4.3;
  const boneWidth = 2.8;

  function project(
    point: Landmark
  ) {
    let x =
      offsetX +
      (point.x - minX) *
        scale;

    const y =
      offsetY +
      (point.y - minY) *
        scale;

    if (mirror) {
      x =
        SVG_SIZE - x;
    }

    return {
      x,
      y,
    };
  }

  return (
    <div className="landmark-guide">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="landmark-guide-svg"
        role="img"
        aria-label={
          isTwoHandPose
            ? "Two-hand reference landmark guide"
            : "Hand reference landmark guide"
        }
      >
        {hands.map(
          (
            hand,
            handIndex
          ) => {
            const points =
              hand.landmarks.map(
                project
              );

            const style =
              HAND_STYLES[
                handIndex %
                  HAND_STYLES.length
              ];

            return (
              <g
                key={
                  hand.slot ??
                  handIndex
                }
                className="landmark-hand"
              >
                {/* bones */}
                {CONNECTIONS.map(
                  ([from, to]) => (
                    <line
                      key={`${from}-${to}`}
                      x1={
                        points[from]
                          .x
                      }
                      y1={
                        points[from]
                          .y
                      }
                      x2={
                        points[to].x
                      }
                      y2={
                        points[to].y
                      }
                      stroke={
                        style.bone
                      }
                      strokeWidth={
                        boneWidth
                      }
                      strokeLinecap="round"
                      opacity={0.82}
                    />
                  )
                )}

                {/* joints */}
                {points.map(
                  (
                    point,
                    index
                  ) => {
                    const isWrist =
                      index === 0;

                    const isTip =
                      FINGERTIPS.has(
                        index
                      );

                    let radius =
                      jointRadius;

                    let fill =
                      style.joint;

                    if (isWrist) {
                      radius =
                        wristRadius;

                      fill =
                        style.wrist;
                    } else if (
                      isTip
                    ) {
                      radius =
                        fingertipRadius;

                      fill =
                        style.fingertip;
                    }

                    return (
                      <circle
                        key={
                          index
                        }
                        cx={
                          point.x
                        }
                        cy={
                          point.y
                        }
                        r={
                          radius
                        }
                        fill={
                          fill
                        }
                        stroke={
                          style.bone
                        }
                        strokeWidth={
                          isTip
                            ? 2
                            : 1.8
                        }
                      />
                    );
                  }
                )}
              </g>
            );
          }
        )}
      </svg>

      {isTwoHandPose && (
        <div className="landmark-guide-hint">
          <span className="guide-hand-key guide-hand-one" />
          <span>Hand 1</span>

          <span className="guide-hand-key guide-hand-two" />
          <span>Hand 2</span>
        </div>
      )}
    </div>
  );
}