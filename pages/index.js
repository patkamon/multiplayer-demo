import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
export default function Home() {
  return (
    <div>
      <div class="game-container"></div>
      <div class="player-info"></div>
      <div>
        <label for="player-name">Your Name</label>
        <input id="player-name" maxLength="10" type="text" />
      </div>
      <div>
        <button id="player-color">Change Color</button>
      </div>
    </div>
  );
}
