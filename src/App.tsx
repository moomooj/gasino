import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase";
import RouletteBoard from "./components/RouletteBoard";
import AdminPanel from "./components/AdminPanel"; // 👈 어드민 패널 불러오기

export type RouletteNumber = number | "00";

export default function App() {
  const [spins, setSpins] = useState<RouletteNumber[]>([]);

  useEffect(() => {
    const spinsRef = ref(db, "spins");
    const unsubscribe = onValue(spinsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const safeArray = Array.isArray(data) ? data : Object.values(data);
        setSpins(safeArray.filter((v) => v !== null) as RouletteNumber[]);
      } else {
        setSpins([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddSpin = (newSpin: RouletteNumber) => {
    set(ref(db, "spins"), [...spins, newSpin]);
  };

  const handleEditSpin = (
    globalIndex: number,
    newSpin: RouletteNumber | "delete",
  ) => {
    const newSpins = [...spins];
    if (newSpin === "delete") {
      newSpins.splice(globalIndex, 1);
    } else {
      newSpins[globalIndex] = newSpin;
    }
    set(ref(db, "spins"), newSpins);
  };

  const handleReset = () => {
    set(ref(db, "spins"), null);
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* 손님용 보기 전용 디스플레이 */}
        <Route path="/" element={<RouletteBoard spins={spins} />} />

        {/* 딜러용 입력/수정 전용 패널 */}
        <Route
          path="/admin"
          element={
            <AdminPanel
              spins={spins}
              onAddSpin={handleAddSpin}
              onEditSpin={handleEditSpin}
              onReset={handleReset}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
