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
  update,
} from "firebase/database";
import { createName } from "../utils/createName";
import { randomFromArray } from "../utils/randomFromArray";
import { getRandomSafeSpot } from "../utils/getRandomSafeSpot";
import Hotkeys from "react-hot-keys";
import { isSolid } from "../utils/isSolid";

export default function Home() {
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
  const [playerId, setPlayerId] = useState();
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
        setPlayerId(user.uid);
        let _playerId = user.uid;
        playerRef = ref(database, `players/${_playerId}`);

        const name = createName();
        setPlayerNameInput(name);

        const { x, y } = getRandomSafeSpot();

        set(playerRef, {
          id: _playerId,
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
          setAllCoins((allCoins) => [...allCoins, coin]);
        });

        setLoad(false);
      } else {
        //You're logged out.
      }
    });
  }, []);

  useEffect(() => {
    placeCoin();
    let allPlayersRef = ref(database, `players`);
    let allCoinsRef = ref(database, `coins`);

    onChildRemoved(allPlayersRef, (snapshot) => {
      const removed = snapshot.val();
      let arr = [...allPlayers];
      let i = arr.indexOf(removed);
      arr.splice(i, 1);
      setAllPlayers(arr);
    });

    onChildRemoved(allCoinsRef, (snapshot) => {
      const removed = snapshot.val();
      let arr = [...allCoins];
      let i = arr.indexOf(removed);
      arr.splice(i, 1);
      setAllCoins(arr);
    });
  });

  useEffect(() => {
    let allPlayersRef = ref(database, `players`);

    onValue(allPlayersRef, (snapshot) => {
      players = snapshot.val() || {};
      setAllPlayers(Object.values(players));
    });
  }, [allCoins]);

  useEffect(() => {
    let allCoinsRef = ref(database, `coins`);
    onValue(allCoinsRef, (snapshot) => {
      let coins = snapshot.val() || {};
      setAllCoins(Object.values(coins));
    });
  }, [allPlayers]);

  function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = ref(database, `coins/${x}x${y}`);
    set(coinRef, {
      x,
      y,
    });
    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
      placeCoin();
    }, randomFromArray(coinTimeouts));
  }

  function attemptGrabCoin(x, y) {
    const key = `${x}x${y}`;
    let _playerRef = ref(database, `players/${playerId}`);
    set(ref(database, `coins/${key}`), null);
    let coin = 0;
    allPlayers.forEach((e) => {
      if (e.id == playerId) {
        coin = e.coins;
      }
    });
    allCoins.forEach((e) => {
      if (e.x == x && e.y == y) {
        update(_playerRef, {
          coins: coin + 1,
        });
      }
    });
  }

  function handleArrowPress(xChange = 0, yChange = 0) {
    let _playerRef = ref(database, `players/${playerId}`);
    allPlayers.forEach((e) => {
      if (e.id === playerId) {
        const newX = e.x + xChange;
        const newY = e.y + yChange;
        if (!isSolid(newX, newY)) {
          if (xChange === 1) {
            e.direction = "right";
          }
          if (xChange === -1) {
            e.direction = "left";
          }
          set(_playerRef, {
            ...e,
            x: newX,
            y: newY,
          });
          attemptGrabCoin(newX, newY);
        }
      }
    });
  }

  return (
    <div>
      <div className="game-container">
        {!load &&
          allPlayers.map((e) => {
            const left = 16 * e.x + "px";
            const top = 16 * e.y - 4 + "px";
            const styles = {
              transform: `translate3d(${left}, ${top}, 0)`,
            };

            return (
              <div
                key={e.id + `${e.x}x${e.y}`}
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
        <Hotkeys
          keyName="up"
          filter={(event) => {
            return true;
          }}
          onKeyDown={() => handleArrowPress(0, -1)}
        />
        <Hotkeys
          keyName="right"
          filter={(event) => {
            return true;
          }}
          onKeyDown={() => handleArrowPress(1, 0)}
        />
        <Hotkeys
          keyName="left"
          filter={(event) => {
            return true;
          }}
          onKeyDown={() => handleArrowPress(-1, 0)}
        />
      </div>
    </div>
  );
}
