import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";

export default function Home() {
  useEffect(() => {
    const firebaseConfig = {};

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    signInAnonymously(auth)
      .then(() => {
        console.log("login");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
      });

    onAuthStateChanged(auth, (user) => {
      console.log(user.uid);
    });
  }, []);

  return (
    <div>
      <div className="game-container"></div>
      <div className="player-info"></div>
      <div>
        <label htmlFor="player-name">Your Name</label>
        <input id="player-name" maxLength="10" type="text" />
      </div>
      <div>
        <button id="player-color">Change Color</button>
      </div>
    </div>
  );
}
