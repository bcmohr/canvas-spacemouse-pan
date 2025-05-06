# Obsidian Canvas SpaceMouse Pan

Control Obsidian Canvas views with a 3Dconnexion SpaceMouse device.

## Features

- Pan around Canvas views by moving the SpaceMouse
- Zoom in/out using the Z-axis
- Customizable settings:
  - Pan speed
  - Axis inversion
  - Zoom sensitivity and deadzone

## Requirements

- Obsidian
- 3Dconnexion SpaceMouse device
- Node.js server (included)

## Why a Node.js Server?

Obsidian is a sandboxed Electron application that cannot directly access HID (Human Interface Device) inputs for security reasons. The Node.js server acts as a bridge between your SpaceMouse hardware and Obsidian:

1. The server reads raw HID inputs from your SpaceMouse using the `spacemouse-node` library
2. It processes and normalizes the input data
3. It sends the data to the Obsidian plugin via WebSocket

This approach maintains Obsidian's security model while enabling SpaceMouse functionality.

## Installation

### Plugin Installation
1. Navigate to your Obsidian vault plugins directory:
   ```
   cd YOURVAULT/.obsidian/plugins
   ```
2. Clone the repository:
   ```
   git clone https://github.com/bcmohr/canvas-spacemouse-pan
   ```
3. Navigate to the plugin directory:
   ```
   cd canvas-spacemouse-pan
   ```
4. Install dependencies and build the plugin:
   ```
   npm install
   npm install spacemouse-node
   npm run build
   ```
5. Enable the plugin in Obsidian's settings under "Community Plugins"

At this point, the plugin is installed and ready in Obsidian, but it won't receive any input from your SpaceMouse until the server is running.

### Server Setup

6. Navigate to the server directory:
   ```
   cd NODE_SERVER
   ```
7. Install dependencies:
   ```
   npm install
   ```
8. Start the server:
   ```
   node server.js
   ```
9. You should see a message confirming the server is running on ws://localhost:3030

Once both the plugin is enabled in Obsidian and the server is running, your SpaceMouse will control Canvas views!

## Disclaimer

This is a barely-functioning hacked-together project for just panning around a canvas. The zoom functionality was added on later and is not well-developed. You'll notice that zooming in/out overrides any panning currently taking place. My goal was to get a minimum viable product out of this, not polish every quirk. I don't plan on figuring out how to add smooth panning AND zooming at the same time.

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Brennan

## Links

- [GitHub Repository](https://github.com/bcmohr/obsidian-spacemouse-pan)
