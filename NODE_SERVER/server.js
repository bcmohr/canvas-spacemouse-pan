// server.js — CommonJS version
const WebSocket = require('ws');
const { SpaceMouseWatcher } = require('spacemouse-node');

// Create WebSocket server on port 3030
const wss = new WebSocket.Server({ port: 3030 });
console.log("🛰️  SpaceMouse WebSocket server running on ws://localhost:3030");

let client = null;
wss.on('connection', (ws) => {
    console.log("✅ Obsidian connected");
    client = ws;
    ws.on('close', () => {
        console.log("❌ Obsidian disconnected");
        client = null;
    });
});

const watcher = new SpaceMouseWatcher();
watcher.on('error', (e) => console.error("SpaceMouse error:", e));

watcher.on('connected', (spaceMouse) => {
    console.log("🎮 SpaceMouse connected");

    const normalize = (v) => Math.max(-1, Math.min(1, v / 350));  // Assuming ±350 range

    spaceMouse.on('translate', (data) => {
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'translate',
                x: normalize(data.x),
                y: normalize(data.y),
                z: normalize(data.z)
            }));
        }
    });

    spaceMouse.on('disconnected', () => {
        console.log("🛑 SpaceMouse disconnected");
    });
});
