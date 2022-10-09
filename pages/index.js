import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onDisconnect } from "firebase/database";
import { createName } from "../utils/createName";
import { randomFromArray } from "../utils/randomFromArray";
import { getRandomSafeSpot } from "../utils/getRandomSafeSpot";
import Hotkeys from "react-hot-keys";

export default function Home() {
  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};

  const firebaseConfig = {};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase();

  const [playerNameInput, setPlayerNameInput] = useState("");
  // const gameContainer = document.querySelector(".game-container");
  // const playerColorButton = document.querySelector("#player-color");

  const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

  useEffect(() => {
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
        //You're logged in!
        playerId = user.uid;
        playerRef = ref(database, `players/${playerId}`);

        const name = createName();
        setPlayerNameInput(name);

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
        initGame();
      } else {
        //You're logged out.
      }
    });
  }, []);

  function handleArrowPress(xChange = 0, yChange = 0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    if (!isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      if (xChange === -1) {
        players[playerId].direction = "left";
      }
      set(playerRef, players[playerId]);
      attemptGrabCoin(newX, newY);
    }
  }

  function initGame() {
    const allPlayersRef = ref(database, `players`);
    const allCoinsRef = ref(database, `coins`);
  }

  return (
    <div>
      <div className="game-container"></div>
      <div className="player-info">
        <div>
          <label htmlFor="player-name">Your Name</label>
          <input
            id="player-name"
            value={playerNameInput}
            onChange={(n) => setPlayerNameInput(n.target.value)}
            maxLength="10"
            type="text"
          />
        </div>
        <div>
          <button id="player-color">Change Color</button>
        </div>
        <Hotkeys
          keyName="down"
          filter={(event) => {
            return true;
          }}
          onKeyDown={() => handleArrowPress(0, 1)}
        />
      </div>
    </div>
  );
}
