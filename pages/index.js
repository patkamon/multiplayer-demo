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
  onChildRemoved,
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

  const firebaseConfig = {

  };
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
        let allCoinsRef = ref(database, `coins`);

        setLoad(false);

        onChildAdded(allPlayersRef, (snapshot) => {
          setAllPlayers((allPlayers) => [...allPlayers, snapshot.val()]);
        });

        onChildAdded(allCoinsRef, (snapshot) => {
          const coin = snapshot.val();
          // const key = getKeyString(coin.x, coin.y);
          // coins[key] = true;
          setAllCoins((allCoins) => [...allCoins, coin]);
        });
      } else {
        //You're logged out.
      }
    });
  }, []);

  useEffect(() => {
    let allPlayersRef = ref(database, `players`);

    onChildRemoved(allPlayersRef, (snapshot) => {
      const removed = snapshot.val();
      console.log("remove", removed);
      let arr = [...allPlayers];
      let i = arr.indexOf(removed);
      arr.splice(i, 1);
      setAllPlayers(arr);
    });
  });

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
            console.log(e.direction, e.color);

            return (
              <div
                key={i}
                className={`Character grid-cell ${
                  e.id === playerId ? "you" : ""
                } `}
                style={styles}
                data-direction={e.direction}
                data-color={e.color}
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

        {!load &&
          allCoins.map((e, i) => {
            const left = 16 * e.x + "px";
            const top = 16 * e.y - 4 + "px";
            const styles = {
              transform: `translate3d(${left}, ${top}, 0)`,
            };

            return (
              <div className="Coin grid-cell" style={styles} key={i}>
                <div className="Coin_shadow grid-cell"></div>
                <div className="Coin_sprite grid-cell"></div>
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
