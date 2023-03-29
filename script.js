let players = [];

function prepareWebSocket() {
  let webSocket = new WebSocket("ws://localhost:2948/socket");

  webSocket.addEventListener("open", (/* event */) => {
    console.log("WebSocket connection opened");
  });

  webSocket.addEventListener("error", (error) => {
    console.error("WebSocket error", error);
    setTimeout(() => {
      prepareWebSocket();
    }, 10000);
  });

  webSocket.addEventListener("close", (event) => {
    console.log(`WebSocket connection closed with code ${event.code}`);
  });

  // EventListener for new WebSocket messages
  webSocket.addEventListener("message", (event) => {
    let data = JSON.parse(event.data);

    if (data._type === "handshake") {
      delete data._type;
      delete data.ProtocolVersion;
      console.log("Player Info", data);
      return;
    }

    if (data._event === "PlayerJoined") {
      playerJoined(data.PlayerJoined);
    }

    if (data._event === "PlayerUpdated") {
      updatePlayers(data);
    }

    if (data._event === "Score") {
      updateHTML(data);
      setDifferenceBarValues();
    }
  });
}

// When player joins, push player to player array
function playerJoined(player) {
  // Only push if not already in it
  if (!players.find(p => p.LUID === player.LUID)) {
    players.push({
      name: player.UserName,
      id: player.LUID
    });
  }
}

// Remove all player that are spectating and
// Sort by name
function updatePlayers(data) {
  if (data.PlayerUpdated.Spectating) {
    players = players.filter(player => player.id !== data.PlayerUpdated.LUID);
  }
  players = players.sort((a, b) => a.name - b.name);
}

const leftAcc = document.getElementById("left-acc");
const leftScore = document.getElementById("left-score");
const leftMisses = document.getElementById("left-misses");
const leftCombo = document.getElementById("left-combo");
const leftPlayer = document.getElementById("left-player");

const rightAcc = document.getElementById("right-acc");
const rightScore = document.getElementById("right-score");
const rightMisses = document.getElementById("right-misses");
const rightCombo = document.getElementById("right-combo");
const rightPlayer = document.getElementById("right-player");

// When a new score packet comes in
function updateHTML(data) {
  players = players.sort((a, b) => a.name - b.name);
  //console.log(JSON.stringify(players));

  // get all necessary data from the packet and transform them into readable format
  const visible = {
    acc: `${(parseFloat(data.Score.Accuracy) * 100).toFixed(2)}%`,
    score: data.Score.Score.toLocaleString(),
    misses: data.Score.MissCount,
    combo: data.Score.Combo
  };
  
  const name = data.Score.LUID == players[0].id ? players[0].name : players[1].name

  // if the id matches the first player, set its scores
  // else, set the scores for the seconds player
  if (data.Score.LUID == players[0].id) {
    leftAcc.textContent = visible.acc;
    leftScore.textContent = visible.score;
    leftMisses.textContent = visible.misses;
	  leftCombo.textContent = visible.combo;
    leftPlayer.textContent = name;
  } else {
    rightAcc.textContent = visible.acc;
    rightScore.textContent = visible.score;
    rightMisses.textContent = visible.misses;
    rightCombo.textContent = visible.combo;
    rightPlayer.textContent = name;
  }
}

// Updates the Tug Of War bar at the top
function setDifferenceBarValues() {
  // Get the current accuracy for each player
  const score1 = parseFloat(leftAcc.textContent.slice(0, -1));
  const score2 = parseFloat(rightAcc.textContent.slice(0, -1));

  // calculate the difference
  const difference = score2 - score1;

  // calculate css width variable as percentage 1% per 0.1 accuracy difference
  let negativePercentage = Math.max(0, Math.min(10000, -difference * 10000 / score1));
  let positivePercentage = Math.max(0, Math.min(10000, difference * 10000 / score1));

  // cap the percentage to 100
  if (negativePercentage >= 100)
    negativePercentage = 100;
  if (positivePercentage >= 100)
    positivePercentage = 100;

  // if something went wrong, cancel
  if (isNaN(negativePercentage) || isNaN(positivePercentage))
    return;

  // enlarge scores of top player by setting css classes and values
  if (negativePercentage > 0)
    setTopPlayerStyling("left", "right");
  else
    setTopPlayerStyling("right", "left");

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
  checkForSpacingParameter();
  setDifferenceBarValues();
  prepareWebSocket();
});

function checkForSpacingParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const spacingParam = urlParams.get("cs");

  if (spacingParam === "true") {
    const style = document.createElement("style");
    style.innerHTML = `
      body {
        max-width: 1870px;
        margin: 0 auto;
      }

      .spacing {
        display: block;
        height: 100%;
      }

      .bar {
        grid-template-columns: 1fr 30px 1fr;
      }
      
      .container {
        gap: 30px;
        margin-left: var(--cs-margin-left);
        margin-right: var(--cs-margin-right);
        transition: margin 200ms;
      }

      .player {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
}