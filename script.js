// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
const gameState = {
    player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        width: 30,
        height: 30,
        speed: 5,
        health: 100,
        food: 100,
        water: 100,
        arrows: 20
    },
    resources: [],
    enemies: [],
    arrows: [],
    day: 1,
    dayLength: 30000, // 30 seconds per day
    lastTime: 0,
    lastDayTime: 0,
    lastSpawnTime: 0,
    spawnInterval: 5000, // Spawn new items/enemies every 5 seconds
    lastDamageTime: 0, // Track when the player was last damaged
    damageInterval: 1000, // Damage interval in milliseconds (1 second)
    gameOver: false,
    victory: false,
    currentMap: 'forest', // 'forest', 'temple', 'innerTemple', 'grandRoom', 'jungleBridge', 'templeRuins'
    doorOpen: false, // Whether the door is open (opens on day 2)
    jungleDoorOpen: false, // Whether the jungle door is open (opens on day 2)
    jungleTopDoorOpen: false, // Whether the jungle top door is open (opens on day 3)
    innerDoorOpen: false, // Whether the inner temple door is open (opens on day 3)
    grandRoomDoorOpen: false, // Whether the grand room door is open (opens on day 4)
    titanGolem: null, // Will store the titan golem boss when in grand room
    templeMusic: null, // Will store the temple music
    jungleMusic: null, // Will store the jungle music
    forestMusic: null, // Will store the forest music
    grandRoomMusic: null // Will store the grand room music
};

// Resource types
const resourceTypes = [
    { type: 'food', color: 'green', value: 20 },
    { type: 'water', color: 'blue', value: 20 },
    { type: 'medicine', color: 'red', value: 30 },
    { type: 'arrows', color: 'yellow', value: 10 }
];

// Enemy types
const enemyTypes = [
    { type: 'wolf', color: 'gray', speed: 3, damage: 15, health: 30, width: 20, height: 20 },
    { type: 'bear', color: 'brown', speed: 2, damage: 25, health: 50, width: 40, height: 40 },
    { type: 'golem', color: '#A9A9A9', speed: 1.5, damage: 35, health: 40, width: 25, height: 25 },
    { type: 'golemGuard', color: '#A9A9A9', speed: 1.2, damage: 40, health: 50, width: 30, height: 30, shieldHealth: 10 },
    { type: 'jungleGolem', color: '#8B4513', speed: 1.8, damage: 30, health: 45, width: 30, height: 30 },
    { type: 'jungleGolemGuard', color: '#8B4513', speed: 1.5, damage: 35, health: 55, width: 35, height: 35, shieldHealth: 15 } // New jungle golem guard
];

// Controls
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === 'l') {
        // Skip to day 5
        gameState.day = 5;
        gameState.doorOpen = true;
        gameState.jungleDoorOpen = true;
        gameState.innerDoorOpen = true;
        gameState.jungleTopDoorOpen = true;
        gameState.grandRoomDoorOpen = true;
        
        // Clear existing enemies and resources
        gameState.enemies = [];
        gameState.resources = [];
        
        // Generate new resources and enemies based on current map
        if (gameState.currentMap === 'forest') {
            generateResources(5);
            generateEnemies(2);
        } else if (gameState.currentMap === 'temple') {
            generateTempleResources(5);
            generateTempleEnemies(3);
        } else if (gameState.currentMap === 'innerTemple') {
            generateInnerTempleResources(5);
            generateInnerTempleEnemies(2);
        } else if (gameState.currentMap === 'jungleBridge') {
            generateJungleResources(5);
            generateJungleEnemies(2);
        } else if (gameState.currentMap === 'templeRuins') {
            generateTempleRuinsResources(5);
            generateTempleRuinsEnemies(2);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'd') keys.d = false;
});

// Mouse movement
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Mouse click for shooting
canvas.addEventListener('click', (e) => {
    if (gameState.player.arrows > 0 && !gameState.gameOver) {
        shootArrow();
    }
});

// Generate random resources
function generateResources(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        gameState.resources.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - 20),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - 20),
            width: 20,
            height: 20,
            type: resourceType.type,
            color: resourceType.color,
            value: resourceType.value
        });
    }
}

// Generate random enemies
function generateEnemies(count) {
    const wallThickness = 20;
    
    // Adjust count based on map and enemy type
    let adjustedCount = count;
    if (gameState.currentMap === 'temple') {
        // Reduce golem spawn rate by half
        adjustedCount = Math.max(1, Math.floor(count / 2));
    }
    
    for (let i = 0; i < adjustedCount; i++) {
        // Determine which enemy types are available based on the current map
        let availableEnemyTypes = [];
        
        if (gameState.currentMap === 'forest') {
            // In forest, only wolves and bears
            availableEnemyTypes = enemyTypes.filter(enemy => 
                enemy.type === 'wolf' || enemy.type === 'bear'
            );
        } else if (gameState.currentMap === 'temple') {
            // In temple, only golems
            availableEnemyTypes = enemyTypes.filter(enemy => 
                enemy.type === 'golem'
            );
        }
        
        // If no enemy types available for this map, skip
        if (availableEnemyTypes.length === 0) continue;
        
        const enemyType = availableEnemyTypes[Math.floor(Math.random() * availableEnemyTypes.length)];
        gameState.enemies.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - enemyType.width),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - enemyType.height),
            width: enemyType.width,
            height: enemyType.height,
            type: enemyType.type,
            color: enemyType.color,
            speed: enemyType.speed,
            damage: enemyType.damage,
            health: enemyType.health,
            maxHealth: enemyType.health
        });
    }
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update player position based on keys
function updatePlayer(deltaTime) {
    const wallThickness = 20;
    const doorWidth = 60;
    const doorX = canvas.width / 2 - doorWidth / 2;
    
    if (keys.w && gameState.player.y > wallThickness) gameState.player.y -= gameState.player.speed * deltaTime;
    if (keys.s && gameState.player.y < canvas.height - wallThickness - gameState.player.height) gameState.player.y += gameState.player.speed * deltaTime;
    if (keys.a && gameState.player.x > wallThickness) gameState.player.x -= gameState.player.speed * deltaTime;
    if (keys.d && gameState.player.x < canvas.width - wallThickness - gameState.player.width) gameState.player.x += gameState.player.speed * deltaTime;
    
    // Check if player is at the door and it's open
    if (gameState.doorOpen) {
        if (gameState.currentMap === 'forest') {
            // Check if player is at the top door (forest map)
            if (gameState.player.y <= wallThickness + 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to temple map
                gameState.currentMap = 'temple';
                // Position player at the bottom of the temple
                gameState.player.y = canvas.height - wallThickness - gameState.player.height - 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate temple-specific resources and enemies
                generateTempleResources(5);
                generateTempleEnemies(3);
            }
            
            // Check if player is at the jungle door (right side)
            if (gameState.jungleDoorOpen && 
                gameState.player.x >= canvas.width - wallThickness - gameState.player.width - 5 && 
                gameState.player.y + gameState.player.height / 2 >= canvas.height / 2 - doorWidth / 2 && 
                gameState.player.y + gameState.player.height / 2 <= canvas.height / 2 + doorWidth / 2) {
                
                // Switch to jungle bridge map
                gameState.currentMap = 'jungleBridge';
                // Position player at the left side of the bridge
                gameState.player.x = wallThickness + 10;
                gameState.player.y = canvas.height / 2 - gameState.player.height / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate jungle bridge resources and enemies
                generateJungleResources(5);
                generateJungleEnemies(2);
            }
        } else if (gameState.currentMap === 'temple') {
            // Check if player is at the bottom door (temple map)
            if (gameState.player.y >= canvas.height - wallThickness - gameState.player.height - 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to forest map
                gameState.currentMap = 'forest';
                // Position player at the top of the forest
                gameState.player.y = wallThickness + 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate forest resources and enemies
                generateResources(5);
                generateEnemies(2);
            }
            
            // Check if player is at the top door (temple map) and inner door is open
            if (gameState.innerDoorOpen && 
                gameState.player.y <= wallThickness + 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to inner temple map
                gameState.currentMap = 'innerTemple';
                // Position player at the bottom of the inner temple
                gameState.player.y = canvas.height - wallThickness - gameState.player.height - 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate inner temple resources and enemies
                generateInnerTempleResources(5);
                generateInnerTempleEnemies(2);
            }
        } else if (gameState.currentMap === 'innerTemple') {
            // Check if player is at the bottom door (inner temple map)
            if (gameState.player.y >= canvas.height - wallThickness - gameState.player.height - 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to temple map
                gameState.currentMap = 'temple';
                // Position player at the top of the temple
                gameState.player.y = wallThickness + 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate temple resources and enemies
                generateTempleResources(5);
                generateTempleEnemies(3);
            }
            
            // Check if player is at the top door (inner temple map) and grand room door is open
            if (gameState.grandRoomDoorOpen && 
                gameState.player.y <= wallThickness + 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to grand room map
                gameState.currentMap = 'grandRoom';
                // Position player at the bottom of the grand room
                gameState.player.y = canvas.height - wallThickness - gameState.player.height - 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Create titan golem boss if it doesn't exist
                if (!gameState.titanGolem) {
                    gameState.titanGolem = createTitanGolem();
                }
            }
        } else if (gameState.currentMap === 'grandRoom') {
            // Check if player is at the bottom door (grand room map)
            if (gameState.player.y >= canvas.height - wallThickness - gameState.player.height - 5 && 
                gameState.player.x + gameState.player.width / 2 >= doorX && 
                gameState.player.x + gameState.player.width / 2 <= doorX + doorWidth) {
                
                // Switch to inner temple map
                gameState.currentMap = 'innerTemple';
                // Position player at the top of the inner temple
                gameState.player.y = wallThickness + 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear titan golem reference when leaving
                gameState.titanGolem = null;
                
                // Generate inner temple resources and enemies
                generateInnerTempleResources(5);
                generateInnerTempleEnemies(2);
            }
        } else if (gameState.currentMap === 'jungleBridge') {
            // Check if player is at the left door (jungle bridge map)
            if (gameState.player.x <= wallThickness + 5 && 
                gameState.player.y + gameState.player.height / 2 >= canvas.height / 2 - doorWidth / 2 && 
                gameState.player.y + gameState.player.height / 2 <= canvas.height / 2 + doorWidth / 2) {
                
                // Switch to forest map
                gameState.currentMap = 'forest';
                // Position player at the right side of the forest
                gameState.player.x = canvas.width - wallThickness - gameState.player.width - 10;
                gameState.player.y = canvas.height / 2 - gameState.player.height / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate forest resources and enemies
                generateResources(5);
                generateEnemies(2);
            }
            
            // Check if player is at the top door (jungle bridge map)
            if (gameState.jungleTopDoorOpen && 
                gameState.player.y <= wallThickness + 5 && 
                gameState.player.x + gameState.player.width / 2 >= canvas.width / 2 - doorWidth / 2 && 
                gameState.player.x + gameState.player.width / 2 <= canvas.width / 2 + doorWidth / 2) {
                
                // Switch to temple ruins
                gameState.currentMap = 'templeRuins';
                gameState.player.y = canvas.height - wallThickness - gameState.player.height - 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate temple ruins resources and enemies
                generateTempleRuinsResources(5);
                generateTempleRuinsEnemies(2);
            }
        } else if (gameState.currentMap === 'templeRuins') {
            // Check if player is at the bottom door (temple ruins map)
            if (gameState.player.y >= canvas.height - wallThickness - gameState.player.height - 5 && 
                gameState.player.x + gameState.player.width / 2 >= canvas.width / 2 - doorWidth / 2 && 
                gameState.player.x + gameState.player.width / 2 <= canvas.width / 2 + doorWidth / 2) {
                
                // Switch back to jungle bridge
                gameState.currentMap = 'jungleBridge';
                gameState.player.y = wallThickness + 10;
                gameState.player.x = canvas.width / 2 - gameState.player.width / 2;
                
                // Clear existing enemies and resources
                gameState.enemies = [];
                gameState.resources = [];
                
                // Generate jungle bridge resources and enemies
                generateJungleResources(5);
                generateJungleEnemies(2);
            }
        }
    }
    
    // Handle music based on current map
    if (gameState.currentMap === 'temple' || gameState.currentMap === 'innerTemple') {
        if (gameState.templeMusic.paused) {
            gameState.templeMusic.play();
        }
        if (!gameState.jungleMusic.paused) {
            gameState.jungleMusic.pause();
        }
        if (!gameState.forestMusic.paused) {
            gameState.forestMusic.pause();
        }
        if (!gameState.grandRoomMusic.paused) {
            gameState.grandRoomMusic.pause();
        }
    } else if (gameState.currentMap === 'jungleBridge' || gameState.currentMap === 'templeRuins') {
        if (gameState.jungleMusic.paused) {
            gameState.jungleMusic.play();
        }
        if (!gameState.templeMusic.paused) {
            gameState.templeMusic.pause();
        }
        if (!gameState.forestMusic.paused) {
            gameState.forestMusic.pause();
        }
        if (!gameState.grandRoomMusic.paused) {
            gameState.grandRoomMusic.pause();
        }
    } else if (gameState.currentMap === 'forest') {
        if (gameState.forestMusic.paused) {
            gameState.forestMusic.play();
        }
        if (!gameState.templeMusic.paused) {
            gameState.templeMusic.pause();
        }
        if (!gameState.jungleMusic.paused) {
            gameState.jungleMusic.pause();
        }
        if (!gameState.grandRoomMusic.paused) {
            gameState.grandRoomMusic.pause();
        }
    } else if (gameState.currentMap === 'grandRoom') {
        if (gameState.grandRoomMusic.paused) {
            gameState.grandRoomMusic.play();
        }
        if (!gameState.templeMusic.paused) {
            gameState.templeMusic.pause();
        }
        if (!gameState.jungleMusic.paused) {
            gameState.jungleMusic.pause();
        }
        if (!gameState.forestMusic.paused) {
            gameState.forestMusic.pause();
        }
    } else {
        if (!gameState.templeMusic.paused) {
            gameState.templeMusic.pause();
        }
        if (!gameState.jungleMusic.paused) {
            gameState.jungleMusic.pause();
        }
        if (!gameState.forestMusic.paused) {
            gameState.forestMusic.pause();
        }
        if (!gameState.grandRoomMusic.paused) {
            gameState.grandRoomMusic.pause();
        }
    }
}

// Generate temple-specific resources
function generateTempleResources(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Temple has more valuable resources
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const value = resourceType.value * 1.5; // 50% more value in temple
        
        gameState.resources.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - 20),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - 20),
            width: 20,
            height: 20,
            type: resourceType.type,
            color: resourceType.color,
            value: value
        });
    }
}

// Generate temple-specific enemies
function generateTempleEnemies(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Temple has more golems and stronger enemies
        let availableEnemyTypes = [...enemyTypes];
        
        // In temple, prefer golems
        if (Math.random() < 0.7) {
            // 70% chance to spawn a golem in temple
            const golemType = availableEnemyTypes.find(enemy => enemy.type === 'golem');
            if (golemType) {
                gameState.enemies.push({
                    x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - golemType.width),
                    y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - golemType.height),
                    width: golemType.width,
                    height: golemType.height,
                    type: golemType.type,
                    color: golemType.color,
                    speed: golemType.speed,
                    damage: golemType.damage,
                    health: golemType.health,
                    maxHealth: golemType.health
                });
                continue;
            }
        }
        
        // If not spawning a golem, spawn a random enemy
        const enemyType = availableEnemyTypes[Math.floor(Math.random() * availableEnemyTypes.length)];
        gameState.enemies.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - enemyType.width),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - enemyType.height),
            width: enemyType.width,
            height: enemyType.height,
            type: enemyType.type,
            color: enemyType.color,
            speed: enemyType.speed,
            damage: enemyType.damage * 1.2, // 20% more damage in temple
            health: enemyType.health * 1.2, // 20% more health in temple
            maxHealth: enemyType.health * 1.2
        });
    }
}

// Generate inner temple resources
function generateInnerTempleResources(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Inner temple has more valuable resources
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        const value = resourceType.value * 2; // Double value in inner temple
        
        gameState.resources.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - 20),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - 20),
            width: 20,
            height: 20,
            type: resourceType.type,
            color: resourceType.color,
            value: value
        });
    }
}

// Generate inner temple enemies
function generateInnerTempleEnemies(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Inner temple has stronger golems and golem guards
        const enemyType = Math.random() < 0.5 ? 
            enemyTypes.find(enemy => enemy.type === 'golem') :
            enemyTypes.find(enemy => enemy.type === 'golemGuard');
        
        const enemy = {
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - enemyType.width),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - enemyType.height),
            width: enemyType.width,
            height: enemyType.height,
            type: enemyType.type,
            color: enemyType.color,
            speed: enemyType.speed * 1.2, // 20% faster
            damage: enemyType.damage * 1.5, // 50% more damage
            health: enemyType.health * 1.5, // 50% more health
            maxHealth: enemyType.health * 1.5
        };
        
        // Add shield properties for golem guards
        if (enemyType.type === 'golemGuard') {
            enemy.shieldHealth = enemyType.shieldHealth;
            enemy.maxShieldHealth = enemyType.shieldHealth;
        }
        
        gameState.enemies.push(enemy);
    }
}

// Shoot an arrow
function shootArrow() {
    const dx = mouseX - (gameState.player.x + gameState.player.width / 2);
    const dy = mouseY - (gameState.player.y + gameState.player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const speed = 10;
        gameState.arrows.push({
            x: gameState.player.x + gameState.player.width / 2,
            y: gameState.player.y + gameState.player.height / 2,
            width: 5,
            height: 5,
            dx: (dx / distance) * speed,
            dy: (dy / distance) * speed,
            color: 'white'
        });
        
        gameState.player.arrows--;
    }
}

// Update arrows
function updateArrows(deltaTime) {
    for (let i = gameState.arrows.length - 1; i >= 0; i--) {
        const arrow = gameState.arrows[i];
        
        // Move arrow
        arrow.x += arrow.dx * deltaTime;
        arrow.y += arrow.dy * deltaTime;
        
        // Check if arrow is out of bounds
        if (arrow.x < 0 || arrow.x > canvas.width || arrow.y < 0 || arrow.y > canvas.height) {
            gameState.arrows.splice(i, 1);
            continue;
        }
        
        // Check collision with titan golem if in grand room
        if (gameState.currentMap === 'grandRoom' && gameState.titanGolem) {
            const titan = gameState.titanGolem;
            
            // First check collision with shield blocks
            let hitShield = false;
            
            titan.shieldBlocks.forEach(block => {
                if (block.health <= 0) return; // Skip destroyed blocks
                
                // Calculate block position
                const centerX = titan.x + titan.width / 2;
                const centerY = titan.y + titan.height / 2;
                const blockX = centerX + Math.cos(block.angle) * block.distance;
                const blockY = centerY + Math.sin(block.angle) * block.distance;
                
                // Create a collision box for the block based on its rotation
                const blockBox = {
                    x: blockX - block.width / 2,
                    y: blockY - block.height / 2,
                    width: block.width,
                    height: block.height
                };
                
                if (checkCollision(arrow, blockBox)) {
                    block.health -= 5; // Shield blocks take more damage
                    gameState.arrows.splice(i, 1);
                    hitShield = true;
                    return;
                }
            });
            
            // If arrow didn't hit a shield, check collision with titan body
            if (!hitShield && checkCollision(arrow, titan)) {
                titan.health -= 10;
                gameState.arrows.splice(i, 1);
                
                // Check if titan is defeated
                if (titan.health <= 0) {
                    gameState.titanGolem = null;
                    gameState.victory = true; // Set victory state
                    gameState.gameOver = true; // End the game
                }
                continue;
            }
        } else {
            // Check collision with regular enemies
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (checkCollision(arrow, enemy)) {
                    // For golem guards, check if the arrow hits the shield
                    if (enemy.type === 'golemGuard' && enemy.shieldHealth > 0) {
                        // Calculate angle between arrow and enemy
                        const dx = arrow.x - (enemy.x + enemy.width / 2);
                        const dy = arrow.y - (enemy.y + enemy.height / 2);
                        const arrowAngle = Math.atan2(dy, dx);
                        
                        // Calculate angle to player (shield angle)
                        const playerDx = gameState.player.x + gameState.player.width / 2 - (enemy.x + enemy.width / 2);
                        const playerDy = gameState.player.y + gameState.player.height / 2 - (enemy.y + enemy.height / 2);
                        const shieldAngle = Math.atan2(playerDy, playerDx);
                        
                        // Calculate angle difference
                        let angleDiff = Math.abs(arrowAngle - shieldAngle);
                        if (angleDiff > Math.PI) {
                            angleDiff = 2 * Math.PI - angleDiff;
                        }
                        
                        // If arrow hits shield (within 60 degrees)
                        if (angleDiff < Math.PI / 3) {
                            enemy.shieldHealth -= 2; // Shield takes 2 damage per arrow
                            gameState.arrows.splice(i, 1);
                            break;
                        }
                    }
                    
                    // If no shield or arrow misses shield, damage enemy
                    enemy.health -= 20;
                    gameState.arrows.splice(i, 1);
                    
                    // Check if enemy is dead
                    if (enemy.health <= 0) {
                        gameState.enemies.splice(j, 1);
                    }
                    
                    break;
                }
            }
        }
    }
}

// Update enemies
function updateEnemies(deltaTime) {
    const currentTime = Date.now();
    
    gameState.enemies.forEach(enemy => {
        // Simple AI: move towards player
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * deltaTime;
            enemy.y += (dy / distance) * enemy.speed * deltaTime;
        }
        
        // Check collision with player and apply damage only once per second
        if (checkCollision(enemy, gameState.player) && 
            currentTime - gameState.lastDamageTime > gameState.damageInterval) {
            gameState.player.health -= enemy.damage;
            gameState.lastDamageTime = currentTime;
            
            if (gameState.player.health <= 0) {
                gameState.gameOver = true;
            }
        }
    });
}

// Update resources
function updateResources() {
    for (let i = gameState.resources.length - 1; i >= 0; i--) {
        const resource = gameState.resources[i];
        if (checkCollision(gameState.player, resource)) {
            if (resource.type === 'food') {
                gameState.player.food = Math.min(100, gameState.player.food + resource.value);
            } else if (resource.type === 'water') {
                gameState.player.water = Math.min(100, gameState.player.water + resource.value);
            } else if (resource.type === 'medicine') {
                gameState.player.health = Math.min(100, gameState.player.health + resource.value);
            } else if (resource.type === 'arrows') {
                gameState.player.arrows += resource.value;
            }
            gameState.resources.splice(i, 1);
        }
    }
}

// Decrease player stats over time
function decreaseStats(deltaTime) {
    const decreaseRate = deltaTime / 1440000; // Both food and water decrease by 1 every 1440 seconds (24 minutes)
    
    gameState.player.food = Math.max(0, gameState.player.food - decreaseRate);
    gameState.player.water = Math.max(0, gameState.player.water - decreaseRate);
    
    if (gameState.player.food <= 0 || gameState.player.water <= 0) {
        gameState.player.health = Math.max(0, gameState.player.health - decreaseRate);
        if (gameState.player.health <= 0) {
            gameState.gameOver = true;
        }
    }
}

// Random spawning of resources and enemies
function randomSpawn(timestamp) {
    if (timestamp - gameState.lastSpawnTime > gameState.spawnInterval) {
        // Random chance to spawn a resource or enemy
        const spawnChance = Math.random();
        
        if (spawnChance < 0.7) { // 70% chance to spawn a resource
            generateResources(1);
        } else { // 30% chance to spawn an enemy
            generateEnemies(1);
        }
        
        gameState.lastSpawnTime = timestamp;
    }
}

// Update UI
function updateUI() {
    // Update numeric health display
    document.getElementById('health').textContent = Math.floor(gameState.player.health);
    
    // Update health bar
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${gameState.player.health}%`;
    
    // Update food bar
    const foodBar = document.getElementById('food-bar');
    foodBar.style.width = `${gameState.player.food}%`;
    
    // Update water bar
    const waterBar = document.getElementById('water-bar');
    waterBar.style.width = `${gameState.player.water}%`;
    
    // Update day and arrows
    document.getElementById('day').textContent = gameState.day;
    document.getElementById('arrows').textContent = gameState.player.arrows;

    // Add help text
    const helpText = document.getElementById('help-text');
    if (!helpText) {
        const helpDiv = document.createElement('div');
        helpDiv.id = 'help-text';
        helpDiv.style.position = 'absolute';
        helpDiv.style.bottom = '10px';
        helpDiv.style.left = '10px';
        helpDiv.style.color = 'white';
        helpDiv.style.fontFamily = 'Arial';
        helpDiv.style.fontSize = '10px';
        helpDiv.style.textShadow = '1px 1px 2px black';
        helpDiv.style.lineHeight = '1.5';
        helpDiv.innerHTML = `
            <div style="margin-bottom: 5px;">Controls:</div>
            <div style="margin-bottom: 5px;">WASD to move, Mouse to aim, Click to shoot</div>
            <div style="margin-bottom: 5px;">Objective:</div>
            <div style="margin-bottom: 5px;">Survive 1 day to open the door to the temple</div>
            <div style="margin-bottom: 5px;">Tip:</div>
            <div>Collect food and water to survive longer</div>
        `;
        document.body.appendChild(helpDiv);
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw wall border
    const wallThickness = 20;
    
    // Draw the grey wall (top, bottom, left, right)
    ctx.fillStyle = '#808080'; // Grey color for the wall
    
    // Top wall
    ctx.fillRect(0, 0, canvas.width, wallThickness);
    
    // Bottom wall
    ctx.fillRect(0, canvas.height - wallThickness, canvas.width, wallThickness);
    
    // Left wall
    ctx.fillRect(0, 0, wallThickness, canvas.height);
    
    // Right wall
    ctx.fillRect(canvas.width - wallThickness, 0, wallThickness, canvas.height);
    
    // Check if door should be open (day 2 or later)
    if (gameState.day >= 2) {
        gameState.doorOpen = true;
        gameState.jungleDoorOpen = true;
    }
    
    // Check if inner door and jungle top door should be open (day 3 or later)
    if (gameState.day >= 3) {
        gameState.innerDoorOpen = true;
        gameState.jungleTopDoorOpen = true;
    }
    
    // Check if grand room door should be open (day 4 or later)
    if (gameState.day >= 4) {
        gameState.grandRoomDoorOpen = true;
    }
    
    // Draw the door based on current map
    const doorWidth = 60;
    const doorHeight = wallThickness;
    const doorX = canvas.width / 2 - doorWidth / 2;
    
    // Draw the door
    ctx.fillStyle = '#8B4513'; // Brown color for door
    
    if (gameState.currentMap === 'forest') {
        // Door at the top for forest map
        if (gameState.doorOpen) {
            ctx.fillRect(doorX, 0, doorWidth, doorHeight);
        }
        // Jungle door on the right side
        if (gameState.jungleDoorOpen) {
            ctx.fillRect(canvas.width - wallThickness, canvas.height / 2 - doorWidth / 2, wallThickness, doorWidth);
        }
    } else if (gameState.currentMap === 'temple') {
        // Door at the bottom for temple map
        ctx.fillRect(doorX, canvas.height - wallThickness, doorWidth, doorHeight);
        
        // Inner temple door at the top (only if it's open)
        if (gameState.innerDoorOpen) {
            ctx.fillStyle = '#A0522D'; // Slightly lighter brown for inner door
            ctx.fillRect(doorX, 0, doorWidth, doorHeight);
        }
    } else if (gameState.currentMap === 'innerTemple') {
        // Door at the bottom for inner temple map
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(doorX, canvas.height - wallThickness, doorWidth, doorHeight);
        
        // Grand room door at the top (only if it's open)
        if (gameState.grandRoomDoorOpen) {
            ctx.fillStyle = '#8B0000'; // Dark red for grand room door
            ctx.fillRect(doorX, 0, doorWidth, doorHeight);
        }
    } else if (gameState.currentMap === 'grandRoom') {
        // Door at the bottom for grand room map
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(doorX, canvas.height - wallThickness, doorWidth, doorHeight);
    } else if (gameState.currentMap === 'jungleBridge') {
        // Draw jungle bridge background (dark forest)
        ctx.fillStyle = '#1A2F1A'; // Dark forest green
        ctx.fillRect(wallThickness, wallThickness, canvas.width - 2 * wallThickness, canvas.height - 2 * wallThickness);
        
        // Draw torches in the forest
        ctx.fillStyle = '#FFA500'; // Orange for torch light
        const torchPositions = [
            {x: 100, y: 100},
            {x: canvas.width - 100, y: 100},
            {x: 100, y: canvas.height - 100},
            {x: canvas.width - 100, y: canvas.height - 100},
            {x: canvas.width / 2, y: canvas.height / 2}
        ];
        
        torchPositions.forEach(pos => {
            // Draw torch light radius
            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 100);
            gradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(26, 47, 26, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 100, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw torch base
            ctx.fillStyle = '#8B4513'; // Brown for torch base
            ctx.fillRect(pos.x - 5, pos.y - 5, 10, 20);
        });
        
        // Draw hanging bridge
        const bridgeWidth = 100;
        const startX = canvas.width / 2; // Top door position
        const startY = wallThickness;
        const endX = wallThickness; // Side door position
        const endY = canvas.height / 2;
        
        // Calculate bridge angle and length
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Save context for rotation
        ctx.save();
        
        // Translate to start point and rotate
        ctx.translate(startX, startY);
        ctx.rotate(angle);
        
        // Draw bridge planks
        ctx.fillStyle = '#8B4513'; // Brown for bridge
        const plankSpacing = 20;
        const numPlanks = Math.floor(length / plankSpacing);
        
        for (let i = 0; i < numPlanks; i++) {
            const y = i * plankSpacing;
            ctx.fillRect(-bridgeWidth / 2, y, bridgeWidth, 10);
        }
        
        // Draw bridge ropes
        ctx.strokeStyle = '#654321'; // Dark brown for ropes
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-bridgeWidth / 2 - 10, 0);
        ctx.lineTo(-bridgeWidth / 2 - 10, length);
        ctx.moveTo(bridgeWidth / 2 + 10, 0);
        ctx.lineTo(bridgeWidth / 2 + 10, length);
        ctx.stroke();
        
        // Restore context
        ctx.restore();
        
        // Draw door on the left side
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height / 2 - doorWidth / 2, wallThickness, doorWidth);
        
        // Draw door on the top (if open)
        if (gameState.jungleTopDoorOpen) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(canvas.width / 2 - doorWidth / 2, 0, doorWidth, wallThickness);
        }
    } else if (gameState.currentMap === 'templeRuins') {
        // Draw stone background with better lighting
        ctx.fillStyle = '#1A1A1A'; // Dark grey for stone floor
        ctx.fillRect(wallThickness, wallThickness, canvas.width - 2 * wallThickness, canvas.height - 2 * wallThickness);
        
        // Add ambient blue glow effect for the ruins
        const ambientGradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        ambientGradient.addColorStop(0, 'rgba(30, 144, 255, 0.2)'); // Dodger blue
        ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ambientGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw temple ruins structure
        ctx.fillStyle = '#404040'; // Grey for stone structures
        
        // Draw broken walls with better detail
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 150, canvas.height / 2 - 100);
        ctx.lineTo(canvas.width / 2 + 150, canvas.height / 2 - 100);
        ctx.lineTo(canvas.width / 2 + 140, canvas.height / 2 - 90);
        ctx.lineTo(canvas.width / 2 - 140, canvas.height / 2 - 90);
        ctx.closePath();
        ctx.fill(); // Top wall
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 150, canvas.height / 2 + 100);
        ctx.lineTo(canvas.width / 2 + 150, canvas.height / 2 + 100);
        ctx.lineTo(canvas.width / 2 + 140, canvas.height / 2 + 90);
        ctx.lineTo(canvas.width / 2 - 140, canvas.height / 2 + 90);
        ctx.closePath();
        ctx.fill(); // Bottom wall
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 150, canvas.height / 2 - 100);
        ctx.lineTo(canvas.width / 2 - 140, canvas.height / 2 - 90);
        ctx.lineTo(canvas.width / 2 - 140, canvas.height / 2 + 90);
        ctx.lineTo(canvas.width / 2 - 150, canvas.height / 2 + 100);
        ctx.closePath();
        ctx.fill(); // Left wall
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + 150, canvas.height / 2 - 100);
        ctx.lineTo(canvas.width / 2 + 140, canvas.height / 2 - 90);
        ctx.lineTo(canvas.width / 2 + 140, canvas.height / 2 + 90);
        ctx.lineTo(canvas.width / 2 + 150, canvas.height / 2 + 100);
        ctx.closePath();
        ctx.fill(); // Right wall
        
        // Draw broken pillars
        const pillarPositions = [
            {x: canvas.width / 2 - 120, y: canvas.height / 2 - 80},
            {x: canvas.width / 2 - 40, y: canvas.height / 2 - 80},
            {x: canvas.width / 2 + 40, y: canvas.height / 2 - 80},
            {x: canvas.width / 2 + 120, y: canvas.height / 2 - 80}
        ];
        
        pillarPositions.forEach(pos => {
            // Draw pillar base
            ctx.fillStyle = '#404040';
            ctx.fillRect(pos.x, pos.y, 30, 130);
            
            // Draw moss on pillars
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(pos.x + 5, pos.y + 15, 20, 40);
        });
        
        // Draw ancient runes on the floor that glow
        const runePositions = [
            {x: canvas.width / 2, y: canvas.height / 2, symbol: 'circle'},
            {x: canvas.width / 2 - 80, y: canvas.height / 2 + 60, symbol: 'diamond'},
            {x: canvas.width / 2 + 80, y: canvas.height / 2 + 60, symbol: 'triangle'},
            {x: canvas.width / 2 - 80, y: canvas.height / 2 - 60, symbol: 'square'},
            {x: canvas.width / 2 + 80, y: canvas.height / 2 - 60, symbol: 'spiral'}
        ];
        
        runePositions.forEach(rune => {
            // Draw glowing effect first
            const runeGradient = ctx.createRadialGradient(
                rune.x, rune.y, 0,
                rune.x, rune.y, 40
            );
            runeGradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)'); // Cyan
            runeGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = runeGradient;
            ctx.beginPath();
            ctx.arc(rune.x, rune.y, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the actual rune symbol
            ctx.strokeStyle = '#00FFFF'; // Cyan
            ctx.lineWidth = 3;
            
            if (rune.symbol === 'circle') {
                ctx.beginPath();
                ctx.arc(rune.x, rune.y, 20, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner circle
                ctx.beginPath();
                ctx.arc(rune.x, rune.y, 10, 0, Math.PI * 2);
                ctx.stroke();
            } else if (rune.symbol === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(rune.x, rune.y - 20); // Top
                ctx.lineTo(rune.x + 20, rune.y); // Right
                ctx.lineTo(rune.x, rune.y + 20); // Bottom
                ctx.lineTo(rune.x - 20, rune.y); // Left
                ctx.closePath();
                ctx.stroke();
            } else if (rune.symbol === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(rune.x, rune.y - 20); // Top
                ctx.lineTo(rune.x + 20, rune.y + 15); // Bottom right
                ctx.lineTo(rune.x - 20, rune.y + 15); // Bottom left
                ctx.closePath();
                ctx.stroke();
            } else if (rune.symbol === 'square') {
                ctx.beginPath();
                ctx.rect(rune.x - 15, rune.y - 15, 30, 30);
                ctx.stroke();
                
                // Cross inside
                ctx.beginPath();
                ctx.moveTo(rune.x - 15, rune.y - 15);
                ctx.lineTo(rune.x + 15, rune.y + 15);
                ctx.moveTo(rune.x + 15, rune.y - 15);
                ctx.lineTo(rune.x - 15, rune.y + 15);
                ctx.stroke();
            } else if (rune.symbol === 'spiral') {
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const radius = 5 + i * 4;
                    const startAngle = i * Math.PI / 2;
                    const endAngle = startAngle + Math.PI * 2;
                    ctx.arc(rune.x, rune.y, radius, startAngle, endAngle);
                }
                ctx.stroke();
            }
        });
        
        // Add torch lighting effects at corners
        const torchPositions = [
            {x: canvas.width / 2 - 145, y: canvas.height / 2 - 95},
            {x: canvas.width / 2 + 145, y: canvas.height / 2 - 95},
            {x: canvas.width / 2 - 145, y: canvas.height / 2 + 95},
            {x: canvas.width / 2 + 145, y: canvas.height / 2 + 95}
        ];
        
        torchPositions.forEach(torch => {
            // Draw torch light
            const torchGradient = ctx.createRadialGradient(
                torch.x, torch.y, 0,
                torch.x, torch.y, 70
            );
            torchGradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)'); // Orange
            torchGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
            ctx.fillStyle = torchGradient;
            ctx.beginPath();
            ctx.arc(torch.x, torch.y, 70, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw torch itself
            ctx.fillStyle = '#8B4513'; // Brown
            ctx.fillRect(torch.x - 3, torch.y - 15, 6, 15);
            
            // Draw flame
            ctx.fillStyle = '#FFA500'; // Orange
            ctx.beginPath();
            ctx.arc(torch.x, torch.y - 15, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw door at the bottom
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(canvas.width / 2 - doorWidth / 2, canvas.height - wallThickness, doorWidth, wallThickness);
    }
    
    // Draw the current map background
    if (gameState.currentMap === 'forest') {
        // Forest background (already set in CSS)
        
        // Add circle-in-circle rune on day 3
        if (gameState.day >= 3) {
            const runeX = canvas.width / 2;
            const runeY = canvas.height / 2;
            
            // Draw outer circle
            ctx.strokeStyle = '#808080'; // Grey color
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(runeX, runeY, 30, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw inner circle
            ctx.beginPath();
            ctx.arc(runeX, runeY, 15, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (gameState.currentMap === 'temple') {
        // Temple background with orange/yellow glow
        ctx.fillStyle = '#2A2A2A'; // Darker grey for stone temple
        ctx.fillRect(wallThickness, wallThickness, canvas.width - 2 * wallThickness, canvas.height - 2 * wallThickness);
        
        // Add torch light effect
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(255, 165, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add fixed moss patches instead of randomly positioned ones
        ctx.fillStyle = '#2E8B57'; // Sea green color for moss
        
        // Fixed moss patch positions
        const mossPatches = [
            {x: 100, y: 100, size: 40},
            {x: 200, y: 150, size: 35},
            {x: 300, y: 120, size: 45},
            {x: 150, y: 250, size: 30},
            {x: 250, y: 300, size: 40},
            {x: 350, y: 280, size: 35},
            {x: 400, y: 200, size: 40},
            {x: 500, y: 150, size: 30},
            {x: 550, y: 300, size: 35},
            {x: 450, y: 350, size: 40},
            {x: 200, y: 400, size: 35},
            {x: 300, y: 450, size: 30},
            {x: 400, y: 420, size: 40},
            {x: 500, y: 380, size: 35},
            {x: 600, y: 350, size: 30}
        ];
        
        // Draw all moss patches
        mossPatches.forEach(patch => {
            ctx.fillRect(patch.x, patch.y, patch.size, patch.size);
        });
    } else if (gameState.currentMap === 'innerTemple') {
        // Inner temple background with orange/yellow glow
        ctx.fillStyle = '#1A1A1A'; // Even darker grey for inner temple
        ctx.fillRect(wallThickness, wallThickness, canvas.width - 2 * wallThickness, canvas.height - 2 * wallThickness);
        
        // Add torch light effect
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(255, 165, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some decorative elements for inner temple
        ctx.fillStyle = '#FFD700'; // Gold color for decorative elements
        
        // Draw some gold accents
        for (let i = 0; i < 10; i++) {
            const x = wallThickness + 50 + i * 70;
            const y = wallThickness + 50;
            ctx.fillRect(x, y, 10, 10);
        }
        
        for (let i = 0; i < 10; i++) {
            const x = wallThickness + 50 + i * 70;
            const y = canvas.height - wallThickness - 60;
            ctx.fillRect(x, y, 10, 10);
        }
    } else if (gameState.currentMap === 'grandRoom') {
        // Grand room background
        ctx.fillStyle = '#2F1810'; // Dark brown for grand room
        ctx.fillRect(wallThickness, wallThickness, canvas.width - 2 * wallThickness, canvas.height - 2 * wallThickness);
        
        // Add some decorative elements
        ctx.fillStyle = '#FFD700'; // Gold color
        // Draw pillars
        for (let i = 0; i < 4; i++) {
            const x = wallThickness + 100 + i * (canvas.width - 200) / 3;
            ctx.fillRect(x, wallThickness + 50, 30, canvas.height - 2 * wallThickness - 100);
        }
    }
    
    // Draw player
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    
    // Draw player's bow (aiming direction)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    
    // Draw resources
    gameState.resources.forEach(resource => {
        ctx.fillStyle = resource.color;
        ctx.fillRect(resource.x, resource.y, resource.width, resource.height);
    });
    
    // Draw enemies or boss
    if (gameState.currentMap === 'grandRoom' && gameState.titanGolem) {
        drawTitanGolem(gameState.titanGolem);
    } else {
        gameState.enemies.forEach(enemy => {
            if (enemy.type === 'wolf') {
                drawWolf(enemy);
            } else if (enemy.type === 'bear') {
                drawBear(enemy);
            } else if (enemy.type === 'golem') {
                drawGolem(enemy);
            } else if (enemy.type === 'golemGuard') {
                drawGolemGuard(enemy);
            } else if (enemy.type === 'jungleGolem') {
                drawJungleGolem(enemy);
            } else if (enemy.type === 'jungleGolemGuard') {
                drawJungleGolemGuard(enemy);
            }
            
            // Draw health bar
            const healthPercentage = enemy.health / enemy.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x, enemy.y - 5, enemy.width * healthPercentage, 3);
        });
    }
    
    // Draw arrows
    gameState.arrows.forEach(arrow => {
        ctx.fillStyle = arrow.color;
        ctx.fillRect(arrow.x, arrow.y, arrow.width, arrow.height);
    });
    
    // Draw game over screen
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        
        if (gameState.victory) {
            ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Arial';
            ctx.fillText('You have defeated the Titan Golem!', canvas.width / 2, canvas.height / 2 + 40);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            ctx.font = '24px Arial';
            ctx.fillText(`You survived for ${gameState.day} days`, canvas.width / 2, canvas.height / 2 + 40);
        }
    }
}

// Draw a wolf
function drawWolf(wolf) {
    // Body (main cube)
    ctx.fillStyle = wolf.color;
    ctx.fillRect(wolf.x, wolf.y, wolf.width, wolf.height);
    
    // Ears (top left and top right)
    const earSize = wolf.width * 0.3;
    ctx.fillStyle = wolf.color;
    ctx.fillRect(wolf.x - earSize * 0.5, wolf.y - earSize * 0.5, earSize, earSize);
    ctx.fillRect(wolf.x + wolf.width - earSize * 0.5, wolf.y - earSize * 0.5, earSize, earSize);
    
    // Eyes (red)
    const eyeSize = wolf.width * 0.15;
    ctx.fillStyle = 'red';
    ctx.fillRect(wolf.x + wolf.width * 0.3, wolf.y + wolf.height * 0.3, eyeSize, eyeSize);
    ctx.fillRect(wolf.x + wolf.width * 0.6, wolf.y + wolf.height * 0.3, eyeSize, eyeSize);
    
    // Nose (black)
    const noseSize = wolf.width * 0.2;
    ctx.fillStyle = 'black';
    ctx.fillRect(wolf.x + wolf.width * 0.4, wolf.y + wolf.height * 0.6, noseSize, noseSize);
}

// Draw a bear
function drawBear(bear) {
    // Body (main cube)
    ctx.fillStyle = '#8B4513'; // Changed to saddle brown, less red
    ctx.fillRect(bear.x, bear.y, bear.width, bear.height);
    
    // Ears (top left and top right)
    const earSize = bear.width * 0.3;
    ctx.fillStyle = '#8B4513'; // Same color as body
    ctx.fillRect(bear.x - earSize * 0.5, bear.y - earSize * 0.5, earSize, earSize);
    ctx.fillRect(bear.x + bear.width - earSize * 0.5, bear.y - earSize * 0.5, earSize, earSize);
    
    // Eyes (red)
    const eyeSize = bear.width * 0.15;
    ctx.fillStyle = 'red';
    ctx.fillRect(bear.x + bear.width * 0.3, bear.y + bear.height * 0.3, eyeSize, eyeSize);
    ctx.fillRect(bear.x + bear.width * 0.6, bear.y + bear.height * 0.3, eyeSize, eyeSize);
    
    // Nose (black)
    const noseSize = bear.width * 0.25; // Slightly larger nose than wolf
    ctx.fillStyle = 'black';
    ctx.fillRect(bear.x + bear.width * 0.375, bear.y + bear.height * 0.6, noseSize, noseSize);
}

// Draw a mini golem
function drawGolem(golem) {
    // Main body (stone-like appearance)
    const bodyHeight = golem.height * 0.8; // 80% of total height (taller body)
    const baseHeight = golem.height * 0.2; // 20% of total height (shorter base)
    const baseWidth = golem.width * 0.8; // 80% of body width
    
    // Draw main body
    ctx.fillStyle = golem.color;
    ctx.fillRect(golem.x, golem.y, golem.width, bodyHeight);
    
    // Draw smaller base (directly connected to body to avoid gaps)
    const baseX = golem.x + (golem.width - baseWidth) / 2;
    ctx.fillRect(baseX, golem.y + bodyHeight - 1, baseWidth, baseHeight + 1); // Overlap by 1px to avoid gaps
    
    // Add moss details (green patches)
    ctx.fillStyle = '#2E8B57'; // Sea green color for moss
    const mossSize = golem.width * 0.2;
    ctx.fillRect(golem.x + golem.width * 0.2, golem.y + golem.height * 0.2, mossSize, mossSize);
    ctx.fillRect(golem.x + golem.width * 0.6, golem.y + golem.height * 0.6, mossSize, mossSize);
    
    // Single green eye with glow
    const eyeSize = golem.width * 0.3;
    const eyeX = golem.x + golem.width * 0.35;
    const eyeY = golem.y + golem.height * 0.3;
    
    // Draw eye glow
    const gradient = ctx.createRadialGradient(
        eyeX + eyeSize/2, eyeY + eyeSize/2, 0,
        eyeX + eyeSize/2, eyeY + eyeSize/2, eyeSize
    );
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(eyeX - eyeSize/2, eyeY - eyeSize/2, eyeSize * 2, eyeSize * 2);
    
    // Draw eye
    ctx.fillStyle = '#00FF00'; // Bright green for the eye
    ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
}

// Draw a golem guard
function drawGolemGuard(guard) {
    // Main body (stone-like appearance)
    const bodyHeight = guard.height * 0.8; // 80% of total height (taller body)
    const baseHeight = guard.height * 0.2; // 20% of total height (shorter base)
    const baseWidth = guard.width * 0.8; // 80% of body width
    
    // Draw main body
    ctx.fillStyle = guard.color;
    ctx.fillRect(guard.x, guard.y, guard.width, bodyHeight);
    
    // Draw smaller base (directly connected to body to avoid gaps)
    const baseX = guard.x + (guard.width - baseWidth) / 2;
    ctx.fillRect(baseX, guard.y + bodyHeight - 1, baseWidth, baseHeight + 1); // Overlap by 1px to avoid gaps
    
    // Add moss details (green patches)
    ctx.fillStyle = '#2E8B57'; // Sea green color for moss
    const mossSize = guard.width * 0.2;
    ctx.fillRect(guard.x + guard.width * 0.2, guard.y + guard.height * 0.2, mossSize, mossSize);
    ctx.fillRect(guard.x + guard.width * 0.6, guard.y + guard.height * 0.6, mossSize, mossSize);
    
    // Single eye with glow - color changes based on shield status
    const eyeSize = guard.width * 0.3;
    const eyeX = guard.x + guard.width * 0.35;
    const eyeY = guard.y + guard.height * 0.3;
    
    // Determine eye color based on shield status
    const eyeColor = guard.shieldHealth > 0 ? '#00FF00' : '#FF0000'; // Green if shield up, red if shield down
    const glowColor = guard.shieldHealth > 0 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
    
    // Draw eye glow
    const gradient = ctx.createRadialGradient(
        eyeX + eyeSize/2, eyeY + eyeSize/2, 0,
        eyeX + eyeSize/2, eyeY + eyeSize/2, eyeSize
    );
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(eyeX - eyeSize/2, eyeY - eyeSize/2, eyeSize * 2, eyeSize * 2);
    
    // Draw eye
    ctx.fillStyle = eyeColor;
    ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
    
    // Only draw shield if it has health remaining
    if (guard.shieldHealth > 0) {
        // Calculate angle to player for shield positioning
        const dx = gameState.player.x + gameState.player.width / 2 - (guard.x + guard.width / 2);
        const dy = gameState.player.y + gameState.player.height / 2 - (guard.y + guard.height / 2);
        const angle = Math.atan2(dy, dx);
        
        // Draw shield
        const shieldWidth = guard.height * 0.4;
        const shieldHeight = guard.width * 0.8;
        const shieldDistance = guard.width * 0.7;
        
        // Save current context state
        ctx.save();
        
        // Translate to golem center
        ctx.translate(guard.x + guard.width / 2, guard.y + guard.height / 2);
        
        // Rotate to face player (removed the extra Math.PI/2)
        ctx.rotate(angle);
        
        // Draw the shield at the correct position relative to the golem (facing the player)
        ctx.fillStyle = '#C0C0C0'; // Silver color for shield
        ctx.fillRect(shieldDistance, -shieldHeight / 2, shieldWidth, shieldHeight);
        
        // Draw shield border
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.strokeRect(shieldDistance, -shieldHeight / 2, shieldWidth, shieldHeight);
        
        // Restore context state
        ctx.restore();
        
        // Draw shield health bar if damaged
        if (guard.shieldHealth < 10) {
            const shieldHealthPercentage = guard.shieldHealth / 10;
            ctx.fillStyle = 'red';
            ctx.fillRect(guard.x, guard.y - 10, guard.width, 3);
            ctx.fillStyle = 'blue';
            ctx.fillRect(guard.x, guard.y - 10, guard.width * shieldHealthPercentage, 3);
        }
    }
}

// Create titan golem boss
function createTitanGolem() {
    return {
        x: canvas.width / 2 - 50, // Center of room
        y: canvas.height / 2 - 50,
        width: 100, // Much larger than regular golems
        height: 100,
        type: 'titanGolem',
        color: '#696969', // Darker gray for titan
        speed: 0.5, // Slower than regular golems
        damage: 50,
        health: 500,
        maxHealth: 500,
        shieldBlocks: Array(6).fill().map((_, i) => ({
            angle: (i * Math.PI * 2) / 6, // Evenly space blocks in a circle
            distance: 120, // Distance from titan center
            width: 60,
            height: 30,
            health: 30,
            maxHealth: 30
        })),
        rotationSpeed: 0.002 // Speed at which shields rotate
    };
}

// Draw titan golem
function drawTitanGolem(titan) {
    // Main body (stone-like appearance)
    const bodyHeight = titan.height * 0.8; // 80% of total height (taller body)
    const baseHeight = titan.height * 0.2; // 20% of total height (shorter base)
    const baseWidth = titan.width * 0.8; // 80% of body width
    
    // Draw main body
    ctx.fillStyle = titan.color;
    ctx.fillRect(titan.x, titan.y, titan.width, bodyHeight);
    
    // Draw smaller base (directly connected to body to avoid gaps)
    const baseX = titan.x + (titan.width - baseWidth) / 2;
    ctx.fillRect(baseX, titan.y + bodyHeight - 1, baseWidth, baseHeight + 1); // Overlap by 1px to avoid gaps
    
    // Add moss details (larger patches)
    ctx.fillStyle = '#2E8B57';
    const mossSize = titan.width * 0.2;
    ctx.fillRect(titan.x + titan.width * 0.2, titan.y + titan.height * 0.2, mossSize, mossSize);
    ctx.fillRect(titan.x + titan.width * 0.6, titan.y + titan.height * 0.6, mossSize, mossSize);
    
    // Three large green eyes with glow (one upper middle, two lower sides)
    const eyeSize = titan.width * 0.2;
    const eyePositions = [
        {x: titan.x + titan.width * 0.5, y: titan.y + titan.height * 0.25}, // Top center eye
        {x: titan.x + titan.width * 0.25, y: titan.y + titan.height * 0.45}, // Lower left eye
        {x: titan.x + titan.width * 0.75, y: titan.y + titan.height * 0.45}  // Lower right eye
    ];
    
    eyePositions.forEach(pos => {
        // Draw eye glow
        const gradient = ctx.createRadialGradient(
            pos.x + eyeSize/2, pos.y + eyeSize/2, 0,
            pos.x + eyeSize/2, pos.y + eyeSize/2, eyeSize
        );
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x - eyeSize/2, pos.y - eyeSize/2, eyeSize * 2, eyeSize * 2);
        
        // Draw eye
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(pos.x, pos.y, eyeSize, eyeSize);
    });
    
    // Draw rotating shield blocks with green ruins
    const centerX = titan.x + titan.width / 2;
    const centerY = titan.y + titan.height / 2;
    
    titan.shieldBlocks.forEach((block, index) => {
        if (block.health <= 0) return; // Don't draw destroyed blocks
        
        // Calculate block position
        const x = centerX + Math.cos(block.angle) * block.distance;
        const y = centerY + Math.sin(block.angle) * block.distance;
        
        // Save context for rotation
        ctx.save();
        
        // Translate to block position and rotate
        ctx.translate(x, y);
        ctx.rotate(block.angle + Math.PI / 2);
        
        // Draw block
        ctx.fillStyle = '#8B4513'; // Brown color for shield blocks
        ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
        
        // Draw block border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);
        
        // Draw green ruins symbols (more distinctive)
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        
        // Draw a different symbol for each shield block
        const symbolIndex = index % 6;
        
        if (symbolIndex === 0) {
            // Triangular symbol
            ctx.beginPath();
            ctx.moveTo(0, -block.height/3);
            ctx.lineTo(-block.width/3, block.height/3);
            ctx.lineTo(block.width/3, block.height/3);
            ctx.closePath();
            ctx.stroke();
        } else if (symbolIndex === 1) {
            // Circle symbol
            ctx.beginPath();
            ctx.arc(0, 0, block.width/4, 0, Math.PI * 2);
            ctx.stroke();
        } else if (symbolIndex === 2) {
            // Square symbol with dot in center
            ctx.beginPath();
            ctx.strokeRect(-block.width/4, -block.height/4, block.width/2, block.height/2);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(-block.width/10, -block.height/10, block.width/5, block.height/5);
        } else if (symbolIndex === 3) {
            // X symbol
            ctx.beginPath();
            ctx.moveTo(-block.width/3, -block.height/3);
            ctx.lineTo(block.width/3, block.height/3);
            ctx.moveTo(block.width/3, -block.height/3);
            ctx.lineTo(-block.width/3, block.height/3);
            ctx.stroke();
        } else if (symbolIndex === 4) {
            // Diamond symbol
            ctx.beginPath();
            ctx.moveTo(0, -block.height/3);
            ctx.lineTo(block.width/3, 0);
            ctx.lineTo(0, block.height/3);
            ctx.lineTo(-block.width/3, 0);
            ctx.closePath();
            ctx.stroke();
        } else {
            // Spiral symbol
            ctx.beginPath();
            const spiralSize = block.width/3;
            for (let i = 0; i < 360; i += 30) {
                const angle = i * Math.PI / 180;
                const radius = spiralSize * (i / 360);
                const spiralX = Math.cos(angle) * radius;
                const spiralY = Math.sin(angle) * radius;
                if (i === 0) {
                    ctx.moveTo(spiralX, spiralY);
                } else {
                    ctx.lineTo(spiralX, spiralY);
                }
            }
            ctx.stroke();
        }
        
        // Restore context
        ctx.restore();
        
        // Draw block health bar if damaged
        if (block.health < block.maxHealth) {
            const healthPercentage = block.health / block.maxHealth;
            const barX = x - block.width / 2;
            const barY = y - block.height;
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, block.width, 3);
            ctx.fillStyle = 'blue';
            ctx.fillRect(barX, barY, block.width * healthPercentage, 3);
        }
    });
    
    // Draw titan health bar
    const healthPercentage = titan.health / titan.maxHealth;
    ctx.fillStyle = 'red';
    ctx.fillRect(titan.x, titan.y - 20, titan.width, 10);
    ctx.fillStyle = 'green';
    ctx.fillRect(titan.x, titan.y - 20, titan.width * healthPercentage, 10);
}

// Draw a jungle golem
function drawJungleGolem(golem) {
    // Main trunk (tapered appearance)
    const baseWidth = golem.width * 1.3; // Even wider base
    const midWidth = golem.width * 1.1; // Slightly wider middle
    const topWidth = golem.width * 0.9; // Slightly narrower top
    
    // Draw the tapered trunk with three sections
    ctx.fillStyle = '#5C4033'; // Darker brown color for wood
    ctx.beginPath();
    // Bottom section (first third)
    const bottomThird = golem.y + (golem.height * 2/3);
    ctx.moveTo(golem.x + (golem.width - baseWidth)/2, golem.y + golem.height); // Bottom left
    ctx.lineTo(golem.x + (golem.width - baseWidth)/2 + baseWidth, golem.y + golem.height); // Bottom right
    ctx.lineTo(golem.x + (golem.width - midWidth)/2 + midWidth, bottomThird); // Middle right
    ctx.lineTo(golem.x + (golem.width - midWidth)/2, bottomThird); // Middle left
    // Top section (last two thirds)
    ctx.lineTo(golem.x + (golem.width - topWidth)/2, golem.y); // Top left
    ctx.lineTo(golem.x + (golem.width - topWidth)/2 + topWidth, golem.y); // Top right
    ctx.closePath();
    ctx.fill();
    
    // Add vertical wood grain texture
    ctx.strokeStyle = '#3D281E'; // Even darker brown for wood grain
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const x = golem.x + (golem.width / 5) * (i + 1);
        const bottomY = golem.y + golem.height;
        const midY = bottomThird;
        const topY = golem.y;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x + (midWidth - baseWidth)/4, midY);
        ctx.lineTo(x + (topWidth - midWidth)/4, topY);
        ctx.stroke();
    }
    
    // Add jagged top with multiple spikes of varying lengths
    ctx.fillStyle = '#3D281E'; // Darkest brown for bark edges
    const spikeCount = 7; // More spikes
    const spikeWidth = topWidth / spikeCount;
    
    for (let i = 0; i < spikeCount; i++) {
        const x = golem.x + (golem.width - topWidth)/2 + i * spikeWidth;
        // More varied spike heights
        const spikeHeight = golem.height * 0.2 * (0.3 + Math.random() * 0.7); // More variation in height
        
        ctx.beginPath();
        ctx.moveTo(x, golem.y);
        ctx.lineTo(x + spikeWidth/2, golem.y - spikeHeight);
        ctx.lineTo(x + spikeWidth, golem.y);
        ctx.fill();
    }
    
    // Add moss details (green patches)
    ctx.fillStyle = '#2E8B57'; // Sea green color for moss
    const mossSize = golem.width * 0.25; // Larger moss patches
    ctx.fillRect(golem.x + golem.width * 0.2, golem.y + golem.height * 0.2, mossSize, mossSize);
    ctx.fillRect(golem.x + golem.width * 0.6, golem.y + golem.height * 0.6, mossSize, mossSize);
    
    // Glowing pink eye
    const eyeSize = golem.width * 0.35; // Larger eye
    const eyeX = golem.x + golem.width * 0.35;
    const eyeY = golem.y + golem.height * 0.3;
    
    // Draw eye glow
    const gradient = ctx.createRadialGradient(
        eyeX + eyeSize/2, eyeY + eyeSize/2, 0,
        eyeX + eyeSize/2, eyeY + eyeSize/2, eyeSize
    );
    gradient.addColorStop(0, 'rgba(255, 192, 203, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 192, 203, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(eyeX - eyeSize/2, eyeY - eyeSize/2, eyeSize * 2, eyeSize * 2);
    
    // Draw eye
    ctx.fillStyle = '#FF69B4'; // Hot pink for the eye
    ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
}

// Draw a jungle golem guard
function drawJungleGolemGuard(guard) {
    // Main body (stone-like appearance)
    const bodyHeight = guard.height * 0.8; // 80% of total height (taller body)
    const baseHeight = guard.height * 0.2; // 20% of total height (shorter base)
    const baseWidth = guard.width * 0.8; // 80% of body width
    
    // Draw main body (tapered trunk)
    ctx.fillStyle = '#5C4033'; // Darker brown color for wood
    ctx.beginPath();
    // Bottom section
    const bottomThird = guard.y + (guard.height * 2/3);
    ctx.moveTo(guard.x + (guard.width - baseWidth)/2, guard.y + guard.height); // Bottom left
    ctx.lineTo(guard.x + (guard.width - baseWidth)/2 + baseWidth, guard.y + guard.height); // Bottom right
    ctx.lineTo(guard.x + (guard.width - baseWidth * 0.9)/2 + baseWidth * 0.9, bottomThird); // Middle right
    ctx.lineTo(guard.x + (guard.width - baseWidth * 0.9)/2, bottomThird); // Middle left
    // Top section
    ctx.lineTo(guard.x + (guard.width - baseWidth * 0.8)/2, guard.y); // Top left
    ctx.lineTo(guard.x + (guard.width - baseWidth * 0.8)/2 + baseWidth * 0.8, guard.y); // Top right
    ctx.closePath();
    ctx.fill();
    
    // Add vertical wood grain texture
    ctx.strokeStyle = '#3D281E'; // Even darker brown for wood grain
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const x = guard.x + (guard.width / 5) * (i + 1);
        const bottomY = guard.y + guard.height;
        const midY = bottomThird;
        const topY = guard.y;
        ctx.beginPath();
        ctx.moveTo(x, bottomY);
        ctx.lineTo(x + (baseWidth * 0.1)/4, midY);
        ctx.lineTo(x + (baseWidth * 0.2)/4, topY);
        ctx.stroke();
    }
    
    // Add jagged top with multiple spikes
    ctx.fillStyle = '#3D281E'; // Darkest brown for bark edges
    const spikeCount = 5; // Fewer spikes than regular jungle golem
    const spikeWidth = baseWidth * 0.8 / spikeCount;
    const topStart = guard.x + (guard.width - baseWidth * 0.8)/2;
    
    for (let i = 0; i < spikeCount; i++) {
        const x = topStart + i * spikeWidth;
        // Varied spike heights
        const spikeHeight = guard.height * 0.15 * (0.5 + Math.random() * 0.5);
        
        ctx.beginPath();
        ctx.moveTo(x, guard.y);
        ctx.lineTo(x + spikeWidth/2, guard.y - spikeHeight);
        ctx.lineTo(x + spikeWidth, guard.y);
        ctx.fill();
    }
    
    // Add moss details
    ctx.fillStyle = '#2E8B57'; // Sea green color for moss
    const mossSize = guard.width * 0.25; // Larger moss patches
    ctx.fillRect(guard.x + guard.width * 0.2, guard.y + guard.height * 0.2, mossSize, mossSize);
    ctx.fillRect(guard.x + guard.width * 0.6, guard.y + guard.height * 0.6, mossSize, mossSize);
    
    // Glowing eye - color changes based on shield status
    const eyeSize = guard.width * 0.30;
    const eyeX = guard.x + guard.width * 0.35;
    const eyeY = guard.y + guard.height * 0.3;
    
    // Determine eye color based on shield status
    const eyeColor = guard.shieldHealth > 0 ? '#FF69B4' : '#FF0000'; // Pink if shield up, red if shield down
    const glowColor = guard.shieldHealth > 0 ? 'rgba(255, 192, 203, 0.8)' : 'rgba(255, 0, 0, 0.8)';
    
    // Draw eye glow
    const gradient = ctx.createRadialGradient(
        eyeX + eyeSize/2, eyeY + eyeSize/2, 0,
        eyeX + eyeSize/2, eyeY + eyeSize/2, eyeSize
    );
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(eyeX - eyeSize/2, eyeY - eyeSize/2, eyeSize * 2, eyeSize * 2);
    
    // Draw eye
    ctx.fillStyle = eyeColor;
    ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
    
    // Only draw shield if it has health remaining
    if (guard.shieldHealth > 0) {
        // Calculate angle to player for shield positioning
        const dx = gameState.player.x + gameState.player.width / 2 - (guard.x + guard.width / 2);
        const dy = gameState.player.y + gameState.player.height / 2 - (guard.y + guard.height / 2);
        const angle = Math.atan2(dy, dx);
        
        // Draw shield
        const shieldWidth = guard.height * 0.45;
        const shieldHeight = guard.width * 0.9;
        const shieldDistance = guard.width * 0.7;
        
        // Save current context state
        ctx.save();
        
        // Translate to golem center
        ctx.translate(guard.x + guard.width / 2, guard.y + guard.height / 2);
        
        // Rotate to face player (removed the extra Math.PI/2)
        ctx.rotate(angle);
        
        // Draw the shield at the correct position relative to the golem (facing the player)
        ctx.fillStyle = '#654321'; // Wooden shield color
        ctx.fillRect(shieldDistance, -shieldHeight / 2, shieldWidth, shieldHeight);
        
        // Draw shield border and patterns
        ctx.strokeStyle = '#3D281E';
        ctx.lineWidth = 2;
        ctx.strokeRect(shieldDistance, -shieldHeight / 2, shieldWidth, shieldHeight);
        
        // Draw shield symbols (ancient runes)
        ctx.strokeStyle = '#00FF00'; // Green runes on shield
        ctx.lineWidth = 1.5;
        
        // Draw a curved rune in the center
        ctx.beginPath();
        ctx.arc(shieldDistance + shieldWidth/2, 0, shieldWidth * 0.3, 0, Math.PI, true);
        ctx.stroke();
        
        // Draw a few line runes
        ctx.beginPath();
        ctx.moveTo(shieldDistance + shieldWidth * 0.2, -shieldHeight * 0.3);
        ctx.lineTo(shieldDistance + shieldWidth * 0.8, -shieldHeight * 0.3);
        ctx.moveTo(shieldDistance + shieldWidth * 0.2, shieldHeight * 0.3);
        ctx.lineTo(shieldDistance + shieldWidth * 0.8, shieldHeight * 0.3);
        ctx.stroke();
        
        // Draw circle rune
        ctx.beginPath();
        ctx.arc(shieldDistance + shieldWidth/2, 0, shieldWidth * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Restore context state
        ctx.restore();
        
        // Draw shield health bar if damaged
        if (guard.shieldHealth < guard.maxShieldHealth) {
            const shieldHealthPercentage = guard.shieldHealth / guard.maxShieldHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(guard.x, guard.y - 10, guard.width, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(guard.x, guard.y - 10, guard.width * shieldHealthPercentage, 3);
        }
    }
}

// Game loop
function gameLoop(timestamp) {
    if (!gameState.lastTime) {
        gameState.lastTime = timestamp;
        gameState.lastDayTime = timestamp;
    }
    
    // Calculate delta time for movement (scaled to 60 FPS)
    const deltaTime = (timestamp - gameState.lastTime) / 16.67;
    gameState.lastTime = timestamp;
    
    if (!gameState.gameOver) {
        // Update game state
        updatePlayer(deltaTime);
        
        // Update titan golem if in grand room
        if (gameState.currentMap === 'grandRoom' && gameState.titanGolem) {
            // Rotate shield blocks
            gameState.titanGolem.shieldBlocks.forEach(block => {
                if (block.health > 0) {
                    block.angle += gameState.titanGolem.rotationSpeed * deltaTime;
                    if (block.angle >= Math.PI * 2) {
                        block.angle -= Math.PI * 2;
                    }
                }
            });
            
            // Move titan golem slowly towards player
            const dx = gameState.player.x - gameState.titanGolem.x;
            const dy = gameState.player.y - gameState.titanGolem.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                gameState.titanGolem.x += (dx / distance) * gameState.titanGolem.speed * deltaTime;
                gameState.titanGolem.y += (dy / distance) * gameState.titanGolem.speed * deltaTime;
            }
        } else {
            updateEnemies(deltaTime);
        }
        
        updateResources();
        updateArrows(deltaTime);
        decreaseStats(deltaTime);
        
        if (gameState.currentMap !== 'grandRoom') {
            randomSpawn(timestamp);
        }
        
        // Check if day has passed (using real time, not delta time)
        if (timestamp - gameState.lastDayTime > gameState.dayLength) {
            gameState.day++;
            gameState.lastDayTime = timestamp;
            
            // Update door states based on day
            if (gameState.day >= 2) {
                gameState.doorOpen = true;
                gameState.jungleDoorOpen = true;
            }
            if (gameState.day >= 3) {
                gameState.innerDoorOpen = true;
                gameState.jungleTopDoorOpen = true;
            }
            if (gameState.day >= 4) {
                gameState.grandRoomDoorOpen = true;
            }
            
            if (gameState.currentMap !== 'grandRoom') {
                generateResources(3);
                generateEnemies(2);
            }
        }
        
        // Update UI
        updateUI();
    }
    
    // Draw everything
    draw();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Initialize game
function init() {
    // Create and set up temple music
    gameState.templeMusic = new Audio('audio/38. Redstone Monstrosity.mp3');
    gameState.templeMusic.loop = true;
    gameState.templeMusic.volume = 0.5; // Set volume to 50%
    
    // Create and set up jungle music
    gameState.jungleMusic = new Audio('audio/51. Evoker.mp3');
    gameState.jungleMusic.loop = true;
    gameState.jungleMusic.volume = 0.5; // Set volume to 50%
    
    // Create and set up forest music
    gameState.forestMusic = new Audio('audio/20. Temple Tunnels.mp3');
    gameState.forestMusic.loop = true;
    gameState.forestMusic.volume = 0.5; // Set volume to 50%
    
    // Create and set up grand room music
    gameState.grandRoomMusic = new Audio('audio/50. Enderman.mp3');
    gameState.grandRoomMusic.loop = true;
    gameState.grandRoomMusic.volume = 0.5; // Set volume to 50%
    
    generateResources(5);
    generateEnemies(2);
    requestAnimationFrame(gameLoop);
}

// Start the game
init();

// Generate jungle bridge resources
function generateJungleResources(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Jungle has more food resources
        const resourceType = Math.random() < 0.7 ? 
            resourceTypes.find(r => r.type === 'food') : 
            resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        
        gameState.resources.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - 20),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - 20),
            width: 20,
            height: 20,
            type: resourceType.type,
            color: resourceType.color,
            value: resourceType.value
        });
    }
}

// Generate jungle bridge enemies
function generateJungleEnemies(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Jungle has more wolves and jungle golems, with rare bears
        const enemyType = Math.random() < 0.7 ? 
            (Math.random() < 0.1 ? enemyTypes.find(e => e.type === 'bear') : // 10% chance for bear
             Math.random() < 0.5 ? enemyTypes.find(e => e.type === 'wolf') : // 45% chance for wolf
             enemyTypes.find(e => e.type === 'jungleGolem')) : // 45% chance for jungle golem
            enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        gameState.enemies.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - enemyType.width),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - enemyType.height),
            width: enemyType.width,
            height: enemyType.height,
            type: enemyType.type,
            color: enemyType.color,
            speed: enemyType.speed,
            damage: enemyType.damage,
            health: enemyType.health,
            maxHealth: enemyType.health
        });
    }
}

// Generate temple ruins resources
function generateTempleRuinsResources(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Temple ruins has more medicine and arrows (from the ruins)
        const resourceType = Math.random() < 0.7 ? 
            (Math.random() < 0.5 ? resourceTypes.find(r => r.type === 'medicine') : resourceTypes.find(r => r.type === 'arrows')) : 
            resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
        
        gameState.resources.push({
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - 20),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - 20),
            width: 20,
            height: 20,
            type: resourceType.type,
            color: resourceType.color,
            value: resourceType.value
        });
    }
}

// Generate temple ruins enemies
function generateTempleRuinsEnemies(count) {
    const wallThickness = 20;
    
    for (let i = 0; i < count; i++) {
        // Temple ruins has jungle golem guards and regular golems
        const randomChoice = Math.random();
        let enemyType;
        
        if (randomChoice < 0.4) {
            // 40% chance for jungle golem guard
            enemyType = enemyTypes.find(e => e.type === 'jungleGolemGuard');
        } else if (randomChoice < 0.7) {
            // 30% chance for jungle golem
            enemyType = enemyTypes.find(e => e.type === 'jungleGolem');
        } else if (randomChoice < 0.9) {
            // 20% chance for regular golem
            enemyType = enemyTypes.find(e => e.type === 'golem');
        } else {
            // 10% chance for random enemy
            enemyType = enemyTypes[Math.floor(Math.random() * (enemyTypes.length - 1))]; // Exclude jungleGolemGuard
        }
        
        const enemy = {
            x: wallThickness + Math.random() * (canvas.width - 2 * wallThickness - enemyType.width),
            y: wallThickness + Math.random() * (canvas.height - 2 * wallThickness - enemyType.height),
            width: enemyType.width,
            height: enemyType.height,
            type: enemyType.type,
            color: enemyType.color,
            speed: enemyType.speed,
            damage: enemyType.damage,
            health: enemyType.health,
            maxHealth: enemyType.health
        };
        
        // Add shield properties for golem guards
        if (enemyType.type === 'jungleGolemGuard' || enemyType.type === 'golemGuard') {
            enemy.shieldHealth = enemyType.shieldHealth;
            enemy.maxShieldHealth = enemyType.shieldHealth;
        }
        
        gameState.enemies.push(enemy);
    }
}
