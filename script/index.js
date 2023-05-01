let players = [];

let barmultiplier = 1;
let highlightScale = 1.25;
let textgap = 30;
let highlight = true;
let orderAlphabet = true;

function prepareWebSocket() {
  let webSocket = new WebSocket("ws://localhost:2948/socket");

  webSocket.addEventListener("open", (/* event */) => {
    console.log("WebSocket connection opened");
  });

  webSocket.addEventListener("error", (error) => {
    console.error("WebSocket error", error);
    setTimeout(() => {
      prepareWebSocket();
    }, 100000);
  });

  webSocket.addEventListener("close", (event) => {
    console.log(`WebSocket connection closed with code ${event.code}`);
  });

  // EventListener for new WebSocket messages
  webSocket.addEventListener("message", (e) => {
    const packet = JSON.parse(e.data);

    const event = packet._event;
    const playerEvent = packet[event];
    const luid = playerEvent.LUID;
    const ssid = playerEvent.UserID;
    const playerName = playerEvent.UserName;

    let player = players.find(p => p.luid === luid);

    if (!player && event !== "RoomState") {
      // console.log(packet);
      player = {
        luid: luid,
        name: playerName,
        ssid: ssid,
        spectating: false,
        score: {
          score: 0,
          accuracy: 0,
          combo: 0,
          missCount: 0
        }
      };
      players.push(player);
    }

    if (event === 'PlayerUpdated') {
      player.spectating = playerEvent.Spectating;
    }

    if (event === 'Score' && !player.spectating) {
      player.score.score = playerEvent.Score.toLocaleString();
      player.score.accuracy = (parseFloat(playerEvent.Accuracy) * 100).toFixed(2);
      player.score.combo = playerEvent.Combo;
      player.score.missCount = playerEvent.MissCount;
    }

    if (event === "PlayerLeaved") {
      const index = players.findIndex(p => p.id === data.PlayerLeaved.LUID);
      if (index !== -1) {
        players.splice(index, 1);
      }
    }

    if (event === "RoomLeaved") {
      players = [];
    }

    players = players.filter(p => !p.spectating);
    // console.log(players);

    if (orderAlphabet) {
      players.sort((a, b) => a.name.localeCompare(b.name));
      // players.sort((a, b) => {
      //   const nameA = a.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      //   const nameB = b.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      //   return nameA.localeCompare(nameB);
      // });
    }

    // console.log(JSON.stringify(players));
    updateHTML();
    setDifferenceBarValues();
  });
}

let prevPlayerIDs = {
  player1: "",
  player2: "",
};

async function updateHTML() {
  // console.log(players);

  for (let i = 0; i < 2; i++) {
    const player = players[i];
    const playerID = i + 1;

    const playerSelector = playerID === 1 ? '.leftPlayer' : '.rightPlayer';
    const playerScoreEl = document.querySelector(playerSelector);
    const playerInfoEl = document.querySelector(playerSelector + "Info");

    // Update player HTML elements
    playerScoreEl.querySelector('.points').textContent = player.score.score;
    playerScoreEl.querySelector('.acc').textContent = player.score.accuracy + "%";
    playerScoreEl.querySelector('.combo').textContent = player.score.combo;
    playerScoreEl.querySelector('.miss').textContent = player.score.missCount;

    if (prevPlayerIDs[`player${playerID}`] !== player.ssid) {
      const SSInfo = await getPlayerInfo("scoresaber", player.ssid);
      const BLInfo = await getPlayerInfo("beatleader", player.ssid);

      playerInfoEl.querySelector('.SSName').textContent = SSInfo.name;
      playerInfoEl.querySelector('.SSAvatar').src = SSInfo.profilePicture;
      playerInfoEl.querySelector('.SSRank').textContent = `#${SSInfo.rank} (#${SSInfo.countryRank} ${SSInfo.country})`;
      playerInfoEl.querySelector('.BLName').textContent = BLInfo.name;
      playerInfoEl.querySelector('.BLAvatar').src = BLInfo.avatar;
      playerInfoEl.querySelector('.BLAvatar').setAttribute("data-gifffer", BLInfo.avatar);
      playerInfoEl.querySelector('.BLRank').textContent = `#${BLInfo.rank} (#${BLInfo.countryRank} ${BLInfo.country})`;

      prevPlayerIDs[`player${playerID}`] = player.ssid;

      Gifffer({
        playButtonStyles: {
          'display': 'none',
        },
        playButtonIconStyles: {
          'display': 'none',
        }
      });
    }
  }
}


// Updates the Tug Of War bar at the top
function setDifferenceBarValues(s1, s2) {
  // Get the current accuracy for each player
  const score1 = s1 || parseFloat(document.querySelector('.leftPlayer .acc').textContent.slice(0, -1));
  const score2 = s2 || parseFloat(document.querySelector('.rightPlayer .acc').textContent.slice(0, -1));

  // calculate the difference
  const difference = score2 - score1;

  // calculate css width variable as percentage 1% per 0.1 accuracy difference
  let negativePercentage = Math.max(0, Math.min(100, -difference * 10000 / barmultiplier / score1));
  let positivePercentage = Math.max(0, Math.min(100, difference * 10000 / barmultiplier / score1));

  // if something went wrong, cancel
  if (isNaN(negativePercentage) || isNaN(positivePercentage))
    return;

  // enlarge scores of top player by setting css classes and values
  if (highlight) {
    if (negativePercentage > 0)
      setTopPlayerStyling("leftPlayer", "rightPlayer");
    else
      setTopPlayerStyling("rightPlayer", "leftPlayer");
  }

  // set the calculated css value
  document.documentElement.style.setProperty("--width-left", negativePercentage + "%");
  document.documentElement.style.setProperty("--width-right", positivePercentage + "%");
}

// sets css classes and attributes for top and bottom player
// -> enlargens scores of the top player
function setTopPlayerStyling(top, bottom) {
  document.querySelector("." + top).classList.add("top");
  document.querySelector("." + bottom).classList.remove("top");
  document.documentElement.style.setProperty("--cs-margin-" + top, "0px");
  document.documentElement.style.setProperty("--cs-margin-" + bottom, "30px");
}

window.addEventListener("load", () => {
  checkParams();
  setDifferenceBarValues();
  prepareWebSocket();
});

// get player info from ScoreSaber and BeatLeader
async function getPlayerInfo(type, id) {
  const raw = await fetch(`/proxy?type=${type}&id=${id}`);
  const json = await raw.json();
  return json;
}

// function testPlayer() {
//   const player = {
//     luid: 1,
//     name: "qlulezz",
//     ssid: "76561198256479099",
//     spectating: false,
//     score: {
//       score: 5678,
//       accuracy: 98.31,
//       combo: 24,
//       missCount: 0
//     }
//   };
//   players.push(player);
//   updateHTML();
// }

// function testPlayer2() {
//   const player = {
//     luid: 2,
//     name: "Le Fishé | Hug000",
//     ssid: "76561197984146789",
//     spectating: false,
//     score: {
//       score: 1234,
//       accuracy: 97.59,
//       combo: 24,
//       missCount: 0
//     }
//   };
//   players.push(player);
//   updateHTML();
// }
