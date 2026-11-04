import React, { useState } from "react";
import "../App.css";

export type RouletteNumber = number | "00";

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getPocketColor(value: RouletteNumber): "red" | "black" | "green" {
  if (value === 0 || value === "00") return "green";
  return RED_NUMBERS.has(value) ? "red" : "black";
}

interface Props {
  spins: RouletteNumber[];
  onAddSpin: (spin: RouletteNumber) => void;
  onEditSpin: (index: number, spin: RouletteNumber | "delete") => void;
  onReset: () => void;
}

export default function AdminPanel({
  spins,
  onAddSpin,
  onEditSpin,
  onReset,
}: Props) {
  const [inputValue, setInputValue] = useState("");

  // 관리자 화면에서는 최근 30개의 기록을 보여주어 수정하기 편하게 합니다.
  const recentSpins = spins.slice(-30).reverse();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    let newSpin: RouletteNumber | null = null;
    if (trimmed === "00") {
      newSpin = "00";
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 0 && num <= 36) {
        newSpin = num;
      }
    }

    if (newSpin !== null) {
      onAddSpin(newSpin);
      setInputValue("");
    } else {
      alert("유효한 숫자 (0~36 또는 '00')를 입력해주세요.");
      setInputValue("");
    }
  };

  const handleEdit = (historyIndex: number, currentValue: RouletteNumber) => {
    // recentSpins 기준의 index를 전체 배열(spins) 기준 index로 역산
    const globalIndex = spins.length - 1 - historyIndex;
    const userInput = window.prompt(
      `기존 숫자: [ ${currentValue} ]\n\n수정할 숫자 (0~36, 00)를 입력하세요.\n이 기록을 지우려면 '삭제'라고 입력하세요.`,
      String(currentValue),
    );

    if (userInput === null) return;
    const trimmed = userInput.trim();

    if (trimmed === "삭제") {
      onEditSpin(globalIndex, "delete");
      return;
    }

    let newSpin: RouletteNumber | null = null;
    if (trimmed === "00") newSpin = "00";
    else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 0 && num <= 36) newSpin = num;
    }

    if (newSpin !== null) {
      onEditSpin(globalIndex, newSpin);
    } else {
      alert("유효한 숫자 (0~36 또는 '00')를 입력하거나 '삭제'를 입력해주세요.");
    }
  };

  const handleResetClick = () => {
    if (window.confirm("정말 모든 룰렛 기록을 초기화하시겠습니까?")) {
      onReset();
    }
  };

  return (
    <div className="admin-stage">
      <div className="admin-header">
        <h1>가지노 딜러 패널</h1>
        <button
          className="btn btn--reset admin-reset-btn"
          onClick={handleResetClick}
        >
          전체 기록 초기화
        </button>
      </div>

      <div className="admin-content">
        {/* 번호 입력 영역 */}
        <div className="admin-input-section">
          <h2>새 번호 입력</h2>
          <form className="admin-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="admin-input-field"
              placeholder="0 ~ 36, 00"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="admin-submit-btn">
              입력
            </button>
          </form>
        </div>

        {/* 최근 기록 수정 영역 */}
        <div className="admin-history-section">
          <h2>최근 기록 (클릭하여 수정/삭제)</h2>
          <div className="admin-history-grid">
            {recentSpins.map((spin, idx) => (
              <div
                key={idx}
                className={`admin-history-cell admin-history-cell--${getPocketColor(spin)}`}
                onClick={() => handleEdit(idx, spin)}
              >
                {spin}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
