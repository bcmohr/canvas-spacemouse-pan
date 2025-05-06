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

## Setup

1. Install the plugin in Obsidian
2. Run the Node.js server: `node server.js`
3. Start using your SpaceMouse with Obsidian Canvas

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Brennan

## Links

- [GitHub Repository](https://github.com/yourusername/obsidian-spacemouse-pan)
