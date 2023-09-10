const mapData = {};

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
    return `${x}x${y}`;
}

function createName() {
    const prefix = randomFromArray([
        "COOL",
        "SUPER",
        "HIP",
        "SMUG",
        "COOL",
        "SILKY",
        "GOOD",
        "SAFE",
        "DEAR",
        "DAMP",
        "WARM",
        "RICH",
        "LONG",
        "DARK",
        "SOFT",
        "BUFF",
        "DOPE",
    ]);
    const animal = randomFromArray([
        "BEAR",
        "DOG",
        "CAT",
        "FOX",
        "LAMB",
        "LION",
        "BOAR",
        "GOAT",
        "VOLE",
        "SEAL",
        "PUMA",
        "MULE",
        "BULL",
        "BIRD",
        "BUG",
    ]);
    return `${prefix} ${animal}`;
}

function isSolid(x, y) {

    const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
    return (
        blockedNextSpace ||
        x >= mapData.maxX ||
        x < mapData.minX ||
        y >= mapData.maxY ||
        y < mapData.minY
    )
}

function getRandomSafeSpot() {
    //We don't look things up by key here, so just return an x/y
    return randomFromArray([
        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 1, y: 5 },
        { x: 2, y: 6 },
        { x: 2, y: 8 },
        { x: 2, y: 9 },
        { x: 4, y: 8 },
        { x: 5, y: 5 },
        { x: 5, y: 8 },
        { x: 5, y: 10 },
        { x: 5, y: 11 },
        { x: 11, y: 7 },
        { x: 12, y: 7 },
        { x: 13, y: 7 },
        { x: 13, y: 6 },
        { x: 13, y: 8 },
        { x: 7, y: 6 },
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 8 },
        { x: 10, y: 8 },
        { x: 8, y: 8 },
        { x: 11, y: 4 },
    ]);
}

// Add this function to load the map data from a URL
function loadMapDataFromURL(url) {
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            // Update the mapData variable with the loaded data
            mapData.minX = data.minX;
            mapData.maxX = data.maxX;
            mapData.minY = data.minY;
            mapData.maxY = data.maxY;
            mapData.blockedSpaces = data.blockedSpaces;
            mapData.spawnpoint = data.spawnpoint; // Add this line
            console.log("Successfully Loaded Map: " + url);
            console.log("Spawn Point: ", mapData.spawnpoint);
        })
        .catch((error) => {
            console.error('Error loading map data:', error);
        });
}

// Call the function to load map data when the game starts
loadMapDataFromURL('map.json'); // Replace with your actual URL


let playerId;
let playerRef;
let players = {};
let playerElements = {};
let coins = {};
let coinElements = {};

const gameContainer = document.querySelector(".game-container");
const playerNameInput = document.querySelector("#player-name");
const playerColorButton = document.querySelector("#player-color");


function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
        x,
        y,
    })

    const coinTimeouts = [2000, 3000, 4000, 5000];
    setTimeout(() => {
        placeCoin();
    }, randomFromArray(coinTimeouts));
}

function attemptGrabCoin(x, y) {
    const key = getKeyString(x, y);
    if (coins[key]) {
        // Remove this key from data, then uptick Player's coin count
        firebase.database().ref(`coins/${key}`).remove();
        playerRef.update({
            coins: players[playerId].coins + 1,
        })
    }
}


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
        playerRef.set(players[playerId]);
        attemptGrabCoin(newX, newY);
        console.log("Moved to X=",newX,"Y=", newY);
    }

    if (players[playerId].y === 11 && players[playerId].x === 13) {
        console.log("portal noises");
        window.location.replace("http://www.joesworld.online");
    }
}

function initGame() {
    console.log("running func InitGame")
    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    allPlayersRef.on("value", (snapshot) => {
        //Fires whenever a change occurs
        players = snapshot.val() || {};
        Object.keys(players).forEach((key) => {
            const characterState = players[key];
            let el = playerElements[key];
            // Now update the DOM
            el.querySelector(".Character_name").innerText = characterState.name;
            el.querySelector(".Character_coins").innerText = characterState.coins;
            el.setAttribute("data-color", characterState.color);
            el.setAttribute("data-direction", characterState.direction);
            const left = 16 * characterState.x + "px";
            const top = 16 * characterState.y - 4 + "px";
            el.style.transform = `translate3d(${left}, ${top}, 0)`;
        })
    })
    allPlayersRef.on("child_added", (snapshot) => {
        //Fires whenever a new node is added the tree
        const addedPlayer = snapshot.val();
        const characterElement = document.createElement("div");
        characterElement.classList.add("Character", "grid-cell");
        if (addedPlayer.id === playerId) {
            characterElement.classList.add("you");
        }
        characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
        playerElements[addedPlayer.id] = characterElement;

        //Fill in some initial state
        characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
        characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
        characterElement.setAttribute("data-color", addedPlayer.color);
        characterElement.setAttribute("data-direction", addedPlayer.direction);
        const left = 16 * addedPlayer.x + "px";
        const top = 16 * addedPlayer.y - 4 + "px";
        characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
        gameContainer.appendChild(characterElement);
    })



    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
        const removedKey = snapshot.val().id;
        gameContainer.removeChild(playerElements[removedKey]);
        delete playerElements[removedKey];
    })

    //This block will remove coins from local state when Firebase `coins` value updates
    allCoinsRef.on("value", (snapshot) => {
        coins = snapshot.val() || {};
    });


    allCoinsRef.on("child_added", (snapshot) => {
        const coin = snapshot.val();
        const key = getKeyString(coin.x, coin.y);
        coins[key] = true;

        // Create the DOM Element
        const coinElement = document.createElement("div");
        coinElement.classList.add("Coin", "grid-cell");
        coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <div class="Coin_sprite grid-cell"></div>
      `;

        // Position the Element
        const left = 16 * coin.x + "px";
        const top = 16 * coin.y - 4 + "px";
        coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

        // Keep a reference for removal later and add to DOM
        coinElements[key] = coinElement;
        gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
        const { x, y } = snapshot.val();
        const keyToRemove = getKeyString(x, y);
        gameContainer.removeChild(coinElements[keyToRemove]);
        delete coinElements[keyToRemove];
    })


    //Updates player name with text input
    playerNameInput.addEventListener("change", (e) => {
        const newName = e.target.value || createName();
        playerNameInput.value = newName;
        playerRef.update({
            name: newName
        })
    })

    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
        const mySkinIndex = playerColors.indexOf(players[playerId].color);
        const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
        playerRef.update({
            color: nextColor
        })
    })

    // Load the spawn point from map data
    const spawnPoint = mapData.spawnpoint;

    players[playerId].x = spawnPoint.x;
    players[playerId].y = spawnPoint.y;
    playerRef.set(players[playerId]);
    console.log("bals");

    //Place my first coin
    placeCoin();



}

function loadingEnd() {
    console.log("Loading Finished");
    const loadingContainer = document.querySelector(".loadingDiv");
    const movecontainer = document.querySelector(".move-container");
    const playerinfo = document.querySelector(".player-info");

    loadingContainer.style.display = "none";
    gameContainer.style.display = "block";
    movecontainer.style.display = "grid";
    playerinfo.style.display = "block";
    chatContainer.style.display = "block";

}

firebase.auth().onAuthStateChanged((user) => {
    console.log(user)
    if (user) {
        // You're logged in!
        playerId = user.uid;
        playerRef = firebase.database().ref(`players/${playerId}`);

        const name = createName();
        playerNameInput.value = name;

        // Load the spawn point from map data
        const spawnPoint = mapData.spawnpoint;

        playerRef.set({
            id: playerId,
            name,
            direction: "right",
            color: randomFromArray(playerColors),
            x: spawnPoint.x, // Use the spawn point's x-coordinate
            y: spawnPoint.y, // Use the spawn point's y-coordinate
            coins: 0,
        });


        // Remove me from Firebase when I disconnect
        playerRef.onDisconnect().remove();
        loadingEnd();
        // Begin the game now that we are signed in
        initGame();
        
    } else {
        //You're logged out.
    }
})

firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
});
// Add these variables at the top of your script
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');


// Function to add a chat message to the chat container
function addChatMessage(name, message, messageId) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.setAttribute('data-message-id', messageId);
    messageElement.innerText = `${name}: ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// Function to remove a chat message from the chat container
function removeChatMessage(messageId) {
    const messageElement = chatMessages.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        chatMessages.removeChild(messageElement);
    }
}

function sendChatMessage(message) {
    if (message) {
        // Get the player's name
        const playerName = players[playerId].name;

        // Get the current timestamp
        const timestamp = firebase.database.ServerValue.TIMESTAMP;

        // Save the message to Firebase with a timestamp
        const chatRef = firebase.database().ref('chat');
        chatRef.push({
            name: playerName,
            message: message,
            timestamp: timestamp,
        });

        // Clear the input field
        chatInput.value = '';
    }
}

// Function to periodically check and delete expired messages
function checkAndDeleteExpiredMessages() {
    const chatRef = firebase.database().ref('chat');
    const currentTime = Date.now();

    chatRef.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const chatData = childSnapshot.val();
            const messageTimestamp = chatData.timestamp;

            // Define the maximum message age (in milliseconds)
            const maxMessageAge = 60 * 1000; // For example, every minute

            // Check if the message has expired
            if (currentTime - messageTimestamp > maxMessageAge) {

                // Message has expired, delete it
                childSnapshot.ref.remove();
                console.log("Message removed");
            }
            else {
                console.log("No messages exceed maximum age");
            }
        });
    });
}

// Call the checkAndDeleteExpiredMessages function periodically
setInterval(checkAndDeleteExpiredMessages, 60 * 1000);


// Add event listener for the Send button
sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    sendChatMessage(message);
});

// Add event listener for Enter key to send message
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = chatInput.value.trim();
        sendChatMessage(message);
    }
});

const chatRef = firebase.database().ref('chat');

// Listen for new chat messages from Firebase
chatRef.on('child_added', (snapshot) => {
    const chatData = snapshot.val();
    const messageId = snapshot.key;
    addChatMessage(chatData.name, chatData.message, messageId);
});

// Listen for chat message removals from Firebase
chatRef.on('child_removed', (snapshot) => {
    const messageId = snapshot.key;
    removeChatMessage(messageId);
});

