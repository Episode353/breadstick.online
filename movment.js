new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1))
new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1))
new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0))
new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0))

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
        console.log("Moved to X=", newX, "Y=", newY);
    }

    // Check for loading zones
    const loadingZone = mapData.loadingZones.find(zone => zone.x === newX && zone.y === newY);
    if (loadingZone) {
        console.log("Entering loading zone. Redirecting to:", loadingZone.url);
        window.location.replace(loadingZone.url);
        return; // Exit the function to prevent further movement
    }
}