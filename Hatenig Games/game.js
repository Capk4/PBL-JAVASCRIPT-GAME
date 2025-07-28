// Matter.js Module Aliases
const { Engine, Render, World, Bodies, Body, Events, Constraint } = Matter;

// Create Engine & World
const engine = Engine.create();
const world = engine.world;

// Create Renderer (Fullscreen)
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#87CEEB",
    }
});
// Create Death Screen
let deathScreen = document.createElement("div");
deathScreen.id = "death-screen";
deathScreen.style.position = "fixed";
deathScreen.style.top = "0";
deathScreen.style.left = "0";
deathScreen.style.width = "100%";
deathScreen.style.height = "100%";
deathScreen.style.background = "rgba(0, 0, 0, 0.85)";
deathScreen.style.color = "white";
deathScreen.style.display = "none"; // Hidden initially
deathScreen.style.flexDirection = "column";
deathScreen.style.alignItems = "center";
deathScreen.style.justifyContent = "center";
deathScreen.style.fontSize = "2.5rem";
deathScreen.style.textAlign = "center";
deathScreen.style.zIndex = "1000"; // Ensure it appears above everything

// Add Death Message
let deathMessage = document.createElement("p");
deathMessage.id = "death-message";
deathScreen.appendChild(deathMessage);

// Add Retry Button
let retryButton = document.createElement("button");
retryButton.innerText = "Retry";
retryButton.style.background = "red";
retryButton.style.color = "white";
retryButton.style.border = "none";
retryButton.style.padding = "15px 30px";
retryButton.style.fontSize = "1.5rem";
retryButton.style.cursor = "pointer";
retryButton.style.marginTop = "20px";
retryButton.style.borderRadius = "10px";
retryButton.onclick = () => location.reload(); // Reload game on click
deathScreen.appendChild(retryButton);

// Add Death Screen to Body
document.body.appendChild(deathScreen);

// Player Crate (Pushable, No Rotation)
const player = Bodies.rectangle(150, window.innerHeight - 100, 50, 50, { 
    restitution: 0.2, 
    friction: 0.8,    
    density: 0.01,    
    inertia: Infinity  
});

// Ground & Platforms
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 20, window.innerWidth, 40, { isStatic: true });
const platform = Bodies.rectangle(window.innerWidth / 2, window.innerHeight / 2, 300, 20, { isStatic: true });

// BBC Collectible
const bbc = Bodies.circle(window.innerWidth - 100, window.innerHeight / 2 - 50, 20, { 
    isStatic: true, 
    render: { fillStyle: "yellow" } 
});

// 🔥 Spikes (Hazard)
const spikes = Bodies.rectangle(400, window.innerHeight - 40, 80, 20, { 
    isStatic: true, 
    render: { fillStyle: "red" } 
});
// ⚠️ Falling Platform (Now Yellow Initially)
const fallingPlatform = Bodies.rectangle(600, window.innerHeight / 2, 150, 20, { 
    isStatic: true, 
    render: { fillStyle: "yellow" }  // 🟡 Default color
});

// Collision Handling
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
        // 🟠 If player steps on falling platform, change color & delay fall
        if (pair.bodyA === player && pair.bodyB === fallingPlatform) {
            pair.bodyB.render.fillStyle = "orange";  // Change to 🟠 Orange
            setTimeout(() => {
                Body.setStatic(fallingPlatform, false); // Make it fall
            }, 1000); // 1 second delay before falling
        }
    });
});

// 🚗 Moving Car (Enemy)
const car = Bodies.rectangle(800, window.innerHeight - 60, 100, 40, { 
    isStatic: false,
    friction: 0,
    render: { fillStyle: "black" } 
});
Body.setVelocity(car, { x: -3, y: 0 }); // Move left initially

// 🔥 Rolling Barrel (Moves Left & Right)
const barrel = Bodies.circle(300, window.innerHeight - 100, 25, { 
    isStatic: false, 
    friction: 0.5, 
    restitution: 0.5,
    render: { fillStyle: "brown" }
});

// 🌋 Lava Pit (Instant Death)
const lava = Bodies.rectangle(900, window.innerHeight - 15, 200, 30, { 
    isStatic: true, 
    render: { fillStyle: "orange" } 
});
// Add Objects to World
World.add(world, [player, ground, platform, bbc, spikes, fallingPlatform, car, barrel, lava]);

// Controls
let keys = {};
let jumpCount = 0;
let isGrounded = false;

document.addEventListener("keydown", (e) => {
    keys[e.code] = true;

    // Jump (Double Jump)
    if ((e.code === "ArrowUp" || e.code === "KeyW") && jumpCount < 2) {
        Body.setVelocity(player, { x: player.velocity.x, y: -10 });
        jumpCount++;
        isGrounded = false;
    }
});

document.addEventListener("keyup", (e) => keys[e.code] = false);

// Movement Handling
Events.on(engine, "beforeUpdate", () => {
    // Move left
    if (keys["ArrowLeft"] || keys["KeyA"]) 
        Body.setVelocity(player, { x: -5, y: player.velocity.y });

    // Move right
    if (keys["ArrowRight"] || keys["KeyD"]) 
        Body.setVelocity(player, { x: 5, y: player.velocity.y });

    // Move car left & right
    if (car.position.x < 700) Body.setVelocity(car, { x: 3, y: 0 }); // Move right
    if (car.position.x > 900) Body.setVelocity(car, { x: -3, y: 0 }); // Move left

    // Move barrel left & right
    if (barrel.position.x < 250) Body.setVelocity(barrel, { x: 2, y: 0 });
    if (barrel.position.x > 350) Body.setVelocity(barrel, { x: -2, y: 0 });
});

// Prevent Player Rotation
Events.on(engine, "beforeUpdate", () => {
    Body.setAngle(player, 0);
});

// Collision Handling
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
        // Landing Resets Jump
        if (pair.bodyA === player && (pair.bodyB === ground && pair.bodyB === platform && pair.bodyB === fallingPlatform)) {
            jumpCount = 0;
            isGrounded = true;

            // ⏳ Falling Platform Delay
            if (pair.bodyB === fallingPlatform) {
                setTimeout(() => {
                    Body.setStatic(fallingPlatform, false); // Make it fall
                }, 1000); // Delay before falling
            }
        }

        // 🔥 Touching Spikes or Lava → Reset Player
        if (pair.bodyA === player && (pair.bodyB === spikes && pair.bodyB === lava)) {
            Body.setPosition(player, { x: 150, y: window.innerHeight - 100 }); // Reset Position
            Body.setVelocity(player, { x: 0, y: 0 });
        }

        // 🚗 Touching Moving Car → Reset Player
        if (pair.bodyA === player && pair.bodyB === car) {
            Body.setPosition(player, { x: 150, y: window.innerHeight - 100 }); // Reset Position
            Body.setVelocity(player, { x: 0, y: 0 });
        }

        // 🔥 Touching Rolling Barrel → Knock Player Back
        if (pair.bodyA === player && pair.bodyB === barrel) {
            Body.setVelocity(player, { x: -5, y: -5 }); // Knock back effect
        }
    });
});

// Handle Resizing
window.addEventListener("resize", () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight - 20 });
});

// Run Engine & Render
Engine.run(engine);
Render.run(render);
let timeLeft = 20;  // ⏳ Start with 20 seconds
let timerDisplay = document.createElement("div");

// 🖥 Style the Timer Display
timerDisplay.style.position = "absolute";
timerDisplay.style.top = "10px";
timerDisplay.style.left = "10px";
timerDisplay.style.fontSize = "24px";
timerDisplay.style.fontFamily = "Arial";
timerDisplay.style.color = "white";
timerDisplay.innerHTML = 'Time: ${timeLeft}s';
document.body.appendChild(timerDisplay);

// ⏳ Timer Countdown (Game Over if Time Runs Out)
let countdown = setInterval(() => {
    timeLeft--;
    timerDisplay.innerHTML = 'Time: ${timeLeft}s';

    if (timeLeft <= 0) {
        clearInterval(countdown);
        showDeathScreen("Game Over! Time Ran Out!");
    }
}, 1000);

// ⚠️ Create Kill Part (Example: Spikes)
const killPart = Bodies.rectangle(400, window.innerHeight - 50, 100, 20, { 
    isStatic: true, 
    render: { fillStyle: "red" }  // 🔴 Red = Danger!
});
World.add(world, killPart);
// 💀 Player Dies on Touching Hazards OR Falling Off
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
      if ((pair.bodyA === player && pair.bodyB === killPart)  
          (pair.bodyB === player && pair.bodyA === killPart)) {
          showDeathScreen("Game Over! You touched a hazard!");
      }
  });
});

// 🏁 Define Spawn Point
const spawnPoint = { x: 100, y: 100 }; // Change as needed

// 🏁 Store Player's Original Start Position at the Beginning
const playerStartX = player.position.x;
const playerStartY = player.position.y;

//  Player Dies on Touching a Car (Show Alert First, Then Reload)
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
      if ((pair.bodyA === player && pair.bodyB === car)  
          (pair.bodyB === player && pair.bodyA === car)) {
          
          // Show Game Over message first
          showDeathScreen("Game Over! You got hit by a car!");
      }
  });
});

//  Check If Player Falls Off the Map & Respawn
Events.on(engine, "afterUpdate", () => {
  if (player.position.y > window.innerHeight + 100) {  
      Body.setPosition(player, { x: playerStartX, y: playerStartY }); // Respawn at start
      Body.setVelocity(player, { x: 0, y: 0 }); // Reset momentum
  }
});

// 🛠 Fix: Prevent Falling Platforms from Stopping the Car
Events.on(engine, "collisionActive", (event) => {
  event.pairs.forEach((pair) => {
      if ((pair.bodyA === car && pair.bodyB === fallingPlatform)  
          (pair.bodyB === car && pair.bodyA === fallingPlatform)) {
          
          // Push the car forward slightly to prevent it from getting stuck
          Body.setVelocity(car, { x: carSpeed, y: 0 });
      }
  });
});

// 🛠 Reset Game Function (If Time Runs Out)
function resetGame() {
  timeLeft = 20;
  timerDisplay.innerHTML = `Time: ${timeLeft}s`;
  Body.setPosition(player, { x: 150, y: window.innerHeight - 100 });  // Reset Player
}

// 🔥 Power-Up Effects
let defaultGravity = 1;
let speedMultiplier = 1;

// 🏆 BBC Collision - Random Power-Up
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
      if (pair.bodyA === player && pair.bodyB === bbc) {
          World.remove(world, bbc);  // Remove BBC

          // 🎲 Randomly Pick a Power-Up (1, 2, or 3)
          let randomPowerUp = Math.floor(Math.random() * 3) + 1;

          if (randomPowerUp === 1) {
              // 🍌 Speed Boost → Moves 50% faster
              speedMultiplier = 1.5;
              setTimeout(() => speedMultiplier = 1, 5000);
              console.log("Speed Boost Activated! 🏃‍♂️");
          } 
          else if (randomPowerUp === 2) {
              // 🦺 Slow Fall → Reduces Gravity
              engine.world.gravity.y = 0.5;
              setTimeout(() => engine.world.gravity.y = defaultGravity, 5000);
              console.log("Slow Fall Activated! 🪂");
          } 
          else {
              // ⏳ Extra Time → +10 Seconds
              timeLeft += 10;
              timerDisplay.innerHTML = `Time: ${timeLeft}s`;
              console.log("Extra Time Collected! ⏳ +10s");
          }
      }
  });
});

// 🎮 Adjust Movement Speed with Power-Ups
Events.on(engine, "beforeUpdate", () => {
  if (keys["ArrowLeft"] || keys["KeyA"]) 
      Body.setVelocity(player, { x: -5 * speedMultiplier, y: player.velocity.y });

  if (keys["ArrowRight"] || keys["KeyD"]) 
      Body.setVelocity(player, { x: 5 * speedMultiplier, y: player.velocity.y });
});
// 🏆 Create Power-Up Notification
let powerUpText = document.createElement("div");
powerUpText.style.position = "absolute";
powerUpText.style.top = "50px";
powerUpText.style.left = "10px";
powerUpText.style.fontSize = "20px";
powerUpText.style.fontFamily = "Arial";
powerUpText.style.color = "yellow";
powerUpText.style.fontWeight = "bold";
powerUpText.style.display = "none";  // Hide by default
document.body.appendChild(powerUpText);
// 🎲 Function to Pick a Random Power-Up
function getRandomPowerUp() {
  const powerUps = [
      { name: "Speed Boost 🏃‍♂️", effect: () => {
          speedMultiplier = 1.5;
          setTimeout(() => speedMultiplier = 1, 5000);
      }},
      { name: "Slow Fall 🪂", effect: () => {
          engine.world.gravity.y = 0.5;
          setTimeout(() => engine.world.gravity.y = defaultGravity, 5000);
      }},
      { name: "Extra Time +10s ⏳", effect: () => {
          timeLeft += 10;
          timerDisplay.innerHTML = `Time: ${timeLeft}s`;
      }}
  ];
  
  return powerUps[Math.floor(Math.random() * powerUps.length)];
}

// 🏆 BBC Collision - Proper Random Power-Up Selection
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
      if (pair.bodyA === player && pair.bodyB === bbc) {
          World.remove(world, bbc);  // Remove BBC

          // 🎲 Select & Apply ONE Random Power-Up
          const chosenPowerUp = getRandomPowerUp();
          chosenPowerUp.effect(); // Apply Effect

          // 📢 Show Power-Up Message
          powerUpText.innerHTML = 'Power-Up: ${chosenPowerUp.name}';
          powerUpText.style.display = "block";
          setTimeout(() => powerUpText.style.display = "none", 2000); // Hide after 2 sec
      }
  });
});

function showDeathScreen(message) {
  alert(message);  // Show an alert when the player loses
  location.reload();  // Reload the game after closing the alert
}

function restartGame() {
  location.reload(); // Reloads the page to restart the game
}
let gameLoopId;

function updateGameLoop() {
  gameLoopId = requestAnimationFrame(updateGameLoop);
  
  // Stop updating if the death screen is shown
  if (document.getElementById("death-screen").style.display === "flex") return;
  
  // Your game update logic here...
}

gameLoopId = requestAnimationFrame(updateGameLoop);