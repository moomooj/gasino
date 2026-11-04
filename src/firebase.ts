import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 👇 아까 2단계에서 띄워둔 파이어베이스 화면에서 아래 부분을 복사해서 교체하세요!
const firebaseConfig = {
  apiKey: "AIzaSyAaKdSGpxBnE2S-EO8cTjwdrUKWFLRNCH0",
  authDomain: "roulette-ap.firebaseapp.com",
  projectId: "roulette-ap",
  storageBucket: "roulette-ap.firebasestorage.app",
  messagingSenderId: "396334306339",
  appId: "1:396334306339:web:f109d4da681e6e89b8cd96",
  databaseURL: "https://roulette-ap-default-rtdb.firebaseio.com",
};

// 파이어베이스 시작!
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
