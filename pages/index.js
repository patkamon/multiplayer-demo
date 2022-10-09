import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  onChildAdded,
} from "firebase/database";
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
  const [allPlayers, setAllPlayers] = useState([]);
  // const [allPlayersRef, setAllPlayersRef] = useState(undefined);
  const [allCoins, setAllCoins] = useState([]);
  const [load, setLoad] = useState(true);

  // const playerColorButton = document.querySelector("#player-color");

  const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {})
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
      });

    onAuthStateChanged(auth, (user) => {
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
        let allPlayersRef = ref(database, `players`);
        const allCoinsRef = ref(database, `coins`);
        setLoad(false);

        onChildAdded(allPlayersRef, (snapshot) => {
          setAllPlayers((allPlayers) => [...allPlayers, snapshot.val()]);
        });
        console.log(allPlayers, "hello");
      } else {
        //You're logged out.
      }
    });
  }, []);

  useEffect(() => {
    console.log(allPlayers);
  }, [allPlayers]);

  // if (allPlayersRef) {

  // }

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
    // console.log(allCoinsRef, allPlayersRef);
    // setLoad(false);
    // onValue(allPlayersRef, (snapshot) => {
    //   console.log(snapshot.val());
    //   players = snapshot.val() || {};
    //   Object.keys(players).forEach((key) => {
    //     const characterState = players[key];
    //     let el = playerElements[key];
    //     // Now update the DOM
    //     el.querySelector(".Character_name").innerText = characterState.name;
    //     el.querySelector(".Character_coins").innerText = characterState.coins;
    //     el.setAttribute("data-color", characterState.color);
    //     el.setAttribute("data-direction", characterState.direction);
    //     const left = 16 * characterState.x + "px";
    //     const top = 16 * characterState.y - 4 + "px";
    //     el.style.transform = `translate3d(${left}, ${top}, 0)`;
    //   });
    // });
  }

  return (
    <div>
      <div className="game-container">
        {!load &&
          allPlayers.map((e, i) => {
            // console.log(e);
            const left = 16 * e.x + "px";
            const top = 16 * e.y - 4 + "px";
            const styles = {
              transform: `translate3d(${left}, ${top}, 0)`,
            };
            return (
              <div
                key={i}
                className={`Character grid-cell ${
                  e.id === playerId ? "you" : ""
                } `}
                style={styles}
              >
                <div className="Character_shadow grid-cell"></div>
                <div className="Character_sprite grid-cell"></div>
                <div className="Character_name-container">
                  <span className="Character_name">{e.name}</span>
                  <span className="Character_coins">{e.coins}</span>
                </div>
                <div className="Character_you-arrow"></div>
              </div>
            );
          })}
      </div>
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
