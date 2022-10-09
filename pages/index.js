import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onDisconnect } from "firebase/database";
import { createName } from "../utils/createName";
import { randomFromArray } from "../utils/randomFromArray";
import { getRandomSafeSpot } from "../utils/getRandomSafeSpot";

export default function Home() {
  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};

  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");

  const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

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
      console.log(user);
      if (user) {
        const database = getDatabase();

        //You're logged in!
        playerId = user.uid;
        playerRef = ref(database, `players/${playerId}`);

        const name = createName();
        playerNameInput.value = name;

        const { x, y } = getRandomSafeSpot();

        set(playerRef, {
          id: playerId,
          name,
          direction: "right",
          color: randomFromArray(playerColors),
          x,
          y,
          coins: 0,
        });

        //Remove me from Firebase when I diconnect
        onDisconnect(playerRef).remove();

        //Begin the game now that we are signed in
        // initGame();
      } else {
        //You're logged out.
      }
    });
  }, []);

  return (
    <div>
      <div className="game-container"></div>
      <div className="player-info">
        <div>
          <label htmlFor="player-name">Your Name</label>
          <input id="player-name" maxLength="10" type="text" />
        </div>
        <div>
          <button id="player-color">Change Color</button>
        </div>
      </div>
    </div>
  );
}
