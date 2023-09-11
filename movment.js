
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

    //portal teleportation
    if (players[playerId].y === 11 && players[playerId].x === 13) {
        console.log("portal noises");
        window.location.replace("http://www.joesworld.online");
    }
}