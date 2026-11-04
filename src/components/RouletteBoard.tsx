import React, { useMemo, useState, useEffect, useRef } from "react";
import "../App.css";

export type RouletteNumber = number | "00";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getPocketColor(value: RouletteNumber): "red" | "black" | "green" {
  if (value === 0 || value === "00") return "green";
  return RED_NUMBERS.has(value) ? "red" : "black";
}

function toKey(value: RouletteNumber) {
  return String(value);
}

const WHEEL_ORDER: RouletteNumber[] = [
  0,
  28,
  9,
  26,
  30,
  11,
  7,
  20,
  32,
  17,
  5,
  22,
  34,
  15,
  3,
  24,
  36,
  13,
  1,
  "00",
  27,
  10,
  25,
  29,
  12,
  8,
  19,
  31,
  18,
  6,
  21,
  33,
  16,
  4,
  23,
  35,
  14,
  2,
];

const CX = 100;
const CY = 100;
const R_OUTER = 98;
const R_INNER = 62;
const R_LABEL = 80;
const R_BAR_MIN = 16;

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

function ringSegment(rOut: number, rIn: number, start: number, end: number) {
  const o1 = polar(rOut, start);
  const o2 = polar(rOut, end);
  const i2 = polar(rIn, end);
  const i1 = polar(rIn, start);
  const large = end - start > 180 ? 1 : 0;

  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${i1.x} ${i1.y}`,
    "Z",
  ].join(" ");
}

function countSpins(spins: RouletteNumber[]) {
  const map = new Map<string, number>();
  for (const n of spins) {
    const key = toKey(n);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function parseRouletteNumber(key: string): RouletteNumber {
  if (key === "00") return "00";
  return Number(key);
}

function getHotNumbers(spins: RouletteNumber[], limit = 4) {
  const counts = countSpins(spins);
  return [...counts.entries()]
    .map(([key, count]) => ({ value: parseRouletteNumber(key), count }))
    .sort(
      (a, b) =>
        b.count - a.count || String(a.value).localeCompare(String(b.value)),
    )
    .slice(0, limit);
}

function getColdNumbers(spins: RouletteNumber[], limit = 4) {
  const counts = new Map<string, number>();
  const lastSeen = new Map<string, number>();

  WHEEL_ORDER.forEach((n) => {
    const key = toKey(n);
    counts.set(key, 0);
    lastSeen.set(key, -1);
  });

  spins.forEach((n, i) => {
    const key = toKey(n);
    counts.set(key, counts.get(key)! + 1);
    lastSeen.set(key, i);
  });

  return [...counts.entries()]
    .map(([key, count]) => ({
      value: parseRouletteNumber(key),
      count,
      lastIndex: lastSeen.get(key)!,
    }))
    .sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.lastIndex - b.lastIndex;
    })
    .slice(0, limit);
}

function RouletteWheel({ spins }: { spins: RouletteNumber[] }) {
  const slice = 360 / WHEEL_ORDER.length;

  const { counts, maxCount } = useMemo(() => {
    const countsMap = countSpins(spins);
    return {
      counts: countsMap,
      maxCount: Math.max(1, ...Array.from(countsMap.values())),
    };
  }, [spins]);

  const maxBarLen = R_INNER - R_BAR_MIN;

  return (
    <div className="wheel-wrap">
      <div className="wheel">
        <svg className="wheel__ring" viewBox="0 0 200 200" aria-label="룰렛">
          <circle
            cx={CX}
            cy={CY}
            r={R_INNER - 0.5}
            className="wheel__center-fill"
          />
          {WHEEL_ORDER.map((value, i) => {
            const start = i * slice;
            const mid = start + slice / 2;
            const count = counts.get(toKey(value)) ?? 0;
            const barLen = (count / maxCount) * maxBarLen;
            const barHalf = slice * 0.32;
            return (
              <g key={`bar-${value}-${i}`}>
                {count > 0 && (
                  <path
                    d={ringSegment(
                      R_INNER - 1,
                      R_INNER - 1 - barLen,
                      mid - barHalf,
                      mid + barHalf,
                    )}
                    className="wheel__bar"
                  />
                )}
              </g>
            );
          })}
          {WHEEL_ORDER.map((value, i) => {
            const start = i * slice;
            const end = start + slice;
            const mid = start + slice / 2;
            const label = polar(R_LABEL, mid);
            const color = getPocketColor(value);
            return (
              <g key={`pocket-${value}-${i}`}>
                <path
                  d={ringSegment(R_OUTER, R_INNER, start, end)}
                  className={`wheel__pocket wheel__pocket--${color}`}
                />
                <text
                  x={label.x}
                  y={label.y}
                  className="wheel__label"
                  transform={`rotate(${mid}, ${label.x}, ${label.y})`}
                >
                  {value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

type CategoryId = "black" | "red" | "even" | "odd" | "low" | "high";
const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "black", label: "BLACK" },
  { id: "red", label: "RED" },
  { id: "even", label: "EVEN" },
  { id: "odd", label: "ODD" },
  { id: "low", label: "1~18" },
  { id: "high", label: "19~36" },
];

function matchesCategory(value: RouletteNumber, id: CategoryId) {
  if (value === 0 || value === "00") return false;
  if (id === "red") return getPocketColor(value) === "red";
  if (id === "black") return getPocketColor(value) === "black";
  if (id === "even") return value % 2 === 0;
  if (id === "odd") return value % 2 === 1;
  if (id === "low") return value >= 1 && value <= 18;
  if (id === "high") return value >= 19 && value <= 36;
  return false;
}

function getCategoryStats(spins: RouletteNumber[]) {
  const total = spins.length || 1;
  return CATEGORIES.map((cat) => {
    const count = spins.filter((n) => matchesCategory(n, cat.id)).length;
    const percent = Math.round((count / total) * 100);
    return { ...cat, count, percent };
  });
}

type RoadCategory =
  | "red"
  | "black"
  | "green"
  | "even"
  | "odd"
  | "low"
  | "high"
  | "empty";

function generateRoad(
  spins: RouletteNumber[],
  type: "color" | "parity" | "range",
): RoadCategory[][] {
  const columns: RoadCategory[][] = [];
  for (const spin of spins) {
    let current: RoadCategory = "green";
    if (spin !== 0 && spin !== "00") {
      if (type === "color") current = getPocketColor(spin) as RoadCategory;
      else if (type === "parity") current = spin % 2 === 0 ? "even" : "odd";
      else if (type === "range") current = spin <= 18 ? "low" : "high";
    }
    if (columns.length === 0) {
      columns.push([current]);
    } else {
      const lastCol = columns[columns.length - 1];
      if (lastCol[lastCol.length - 1] === current) {
        if (lastCol.length < 5) lastCol.push(current);
      } else {
        columns.push([current]);
      }
    }
  }

  const last10 = columns.slice(-10);
  while (last10.length < 10) last10.push([]);
  return last10.map((col) => {
    const newCol = [...col];
    while (newCol.length < 5) newCol.push("empty");
    return newCol;
  });
}

function getRoadLabel(item: RoadCategory) {
  switch (item) {
    case "red":
      return "R";
    case "black":
      return "B";
    case "green":
      return "G";
    case "even":
      return "E";
    case "odd":
      return "O";
    case "low":
      return "L";
    case "high":
      return "H";
    default:
      return "";
  }
}

interface Props {
  spins: RouletteNumber[];
}

export default function RouletteBoard({ spins }: Props) {
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // 당첨 번호 팝업 애니메이션 상태
  const [latestSpin, setLatestSpin] = useState<RouletteNumber | null>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  // 데이터 추가 감지 로직
  const prevLength = useRef(-1);
  useEffect(() => {
    if (prevLength.current === -1) {
      prevLength.current = spins.length;
      return;
    }

    if (spins.length > prevLength.current) {
      const newSpin = spins[spins.length - 1];
      setLatestSpin(newSpin);
      setShowWinAnimation(true);

      const timer = setTimeout(() => {
        setShowWinAnimation(false);
      }, 4000);

      prevLength.current = spins.length;
      return () => clearTimeout(timer);
    }
    prevLength.current = spins.length;
  }, [spins]);

  const categoryStats = useMemo(() => getCategoryStats(spins), [spins]);

  const hotNumbers = useMemo(() => {
    const result = getHotNumbers(spins);
    while (result.length < 4) result.push({ value: null, count: 0 });
    return result;
  }, [spins]);

  const coldNumbers = useMemo(() => {
    if (spins.length === 0) return Array(4).fill({ value: null, count: 0 });
    return getColdNumbers(spins);
  }, [spins]);

  const historySlots = useMemo(() => {
    const recent = spins.slice(-16);
    const reversed = [...recent].reverse();
    const emptyCount = 16 - reversed.length;
    return [...reversed, ...Array(emptyCount).fill(null)];
  }, [spins]);

  const modalHistorySpins = useMemo(() => {
    return spins.slice(-25).reverse();
  }, [spins]);

  const colorRoad = useMemo(() => generateRoad(spins, "color"), [spins]);
  const parityRoad = useMemo(() => generateRoad(spins, "parity"), [spins]);
  const rangeRoad = useMemo(() => generateRoad(spins, "range"), [spins]);

  return (
    <main className="stage">
      <aside
        className="left-panel"
        onClick={() => setIsHistoryModalOpen(true)}
        style={{ cursor: "pointer" }}
        title="클릭하여 최근 25개 기록 보기"
      >
        {historySlots.map((value, i) => (
          <div
            key={i}
            className={`left-panel__cell ${value !== null ? `left-panel__cell--${getPocketColor(value)}` : "left-panel__cell--empty"}`}
          >
            {value !== null ? value : ""}
          </div>
        ))}
      </aside>

      <section className="main-panel">
        <header className="top-header">
          <div className="header-title">가지노</div>
          <div className="header-limits">
            <div>inside $1 - 5</div>
            <div>outside $10 - 25</div>
          </div>
        </header>

        <div className="middle-section">
          <div
            className="wheel-container"
            onClick={() => setIsWheelModalOpen(true)}
            style={{ cursor: "pointer" }}
            title="클릭하여 전체화면으로 보기"
          >
            <RouletteWheel spins={spins} />
          </div>

          <div className="side-stats">
            <div className="side-box">
              <span className="side-box__title">🔥 HOT</span>
              <div className="side-box__grid sub-box--hot">
                {hotNumbers.map((item, idx) => {
                  const pColor =
                    item.value !== null ? getPocketColor(item.value) : "";
                  return (
                    <div key={idx} className="number-card">
                      <span
                        className={`sub-box__number ${pColor ? "text-" + pColor : ""}`}
                      >
                        {item.value !== null ? item.value : "-"}
                      </span>
                      <span className="sub-box__count">
                        {item.value !== null ? `x${item.count}` : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="side-box">
              <span className="side-box__title">❄️ COLD</span>
              <div className="side-box__grid sub-box--cold">
                {coldNumbers.map((item, idx) => {
                  const pColor =
                    item.value !== null ? getPocketColor(item.value) : "";
                  return (
                    <div key={idx} className="number-card">
                      <span
                        className={`sub-box__number ${pColor ? "text-" + pColor : ""}`}
                      >
                        {item.value !== null ? item.value : "-"}
                      </span>
                      <span className="sub-box__count">
                        {item.value !== null ? `x${item.count}` : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="category-row">
            {categoryStats.map((cat) => (
              <div
                key={cat.id}
                className={`category-box category-box--${cat.id}`}
              >
                <span className="category-box__percent">{cat.percent}%</span>
                <span className="category-box__label">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="road-section">
          <div className="road-map">
            <div className="road-map__title">RED / BLACK</div>
            <div className="road-map__grid">
              {colorRoad.map((col, cIdx) => (
                <div key={cIdx} className="road-map__col">
                  {col.map((item, iIdx) => (
                    <div key={iIdx} className="road-map__cell-wrap">
                      {item !== "empty" && (
                        <div
                          className={`road-map__cell road-map__cell--${item}`}
                        >
                          {getRoadLabel(item)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="road-map">
            <div className="road-map__title">EVEN / ODD</div>
            <div className="road-map__grid">
              {parityRoad.map((col, cIdx) => (
                <div key={cIdx} className="road-map__col">
                  {col.map((item, iIdx) => (
                    <div key={iIdx} className="road-map__cell-wrap">
                      {item !== "empty" && (
                        <div
                          className={`road-map__cell road-map__cell--${item}`}
                        >
                          {getRoadLabel(item)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="road-map">
            <div className="road-map__title">UP / DOWN</div>
            <div className="road-map__grid">
              {rangeRoad.map((col, cIdx) => (
                <div key={cIdx} className="road-map__col">
                  {col.map((item, iIdx) => (
                    <div key={iIdx} className="road-map__cell-wrap">
                      {item !== "empty" && (
                        <div
                          className={`road-map__cell road-map__cell--${item}`}
                        >
                          {getRoadLabel(item)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="board-footer">
          <span>PLEASE PLACE YOUR BETS</span>
          <span className="dot"></span>
          <span>GOOD LUCK</span>
        </footer>
      </section>

      {/* 1. 룰렛 전체화면 모달 */}
      {isWheelModalOpen && (
        <div
          className="wheel-modal-overlay"
          onClick={() => setIsWheelModalOpen(false)}
        >
          <div
            className="wheel-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <RouletteWheel spins={spins} />
            <button
              className="wheel-modal-close"
              onClick={() => setIsWheelModalOpen(false)}
            >
              닫기 ✖
            </button>
          </div>
        </div>
      )}

      {/* 2. 최근 25개 기록 모달 */}
      {isHistoryModalOpen && (
        <div
          className="wheel-modal-overlay"
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div
            className="history-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="history-modal-title">최근 25개 기록</h2>
            <div className="history-modal-grid">
              {modalHistorySpins.map((spin, idx) => (
                <div
                  key={idx}
                  className={`history-modal-cell history-modal-cell--${getPocketColor(spin)}`}
                >
                  {spin}
                </div>
              ))}
              {Array.from({
                length: Math.max(0, 25 - modalHistorySpins.length),
              }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="history-modal-cell history-modal-cell--empty"
                ></div>
              ))}
            </div>
            <button
              className="wheel-modal-close"
              onClick={() => setIsHistoryModalOpen(false)}
            >
              닫기 ✖
            </button>
          </div>
        </div>
      )}

      {/* 3. 새 당첨 번호 화려한 애니메이션 모달 */}
      {showWinAnimation && latestSpin !== null && (
        <div className="win-animation-overlay">
          <div
            className={`win-animation-content win-animation-content--${getPocketColor(latestSpin)}`}
          >
            <div className="win-text-small">WINNING NUMBER</div>
            <div className="win-text-large">{latestSpin}</div>
          </div>
        </div>
      )}
    </main>
  );
}
