import { Plugin, ItemView, PluginSettingTab, Setting, App } from 'obsidian';

interface SpaceMousePanSettings {
	panRate: number;
	invertX: boolean;
	invertY: boolean;
	zoomDeadzone: number;
	zoomExponent: number;
	zoomMultiplier: number;
}


const DEFAULT_SETTINGS: SpaceMousePanSettings = {
	panRate: 1.0,
	invertX: false,
	invertY: false,
	zoomDeadzone: 0.6,
	zoomExponent: 7,
	zoomMultiplier: 0.1,
};

export default class CanvasSpaceMousePanPlugin extends Plugin {
	settings: SpaceMousePanSettings;
	private activeZ: number = 0;
	private socket: WebSocket | null = null;

	async onload() {
		console.log("🔌 Connecting to SpaceMouse server...");
		await this.loadSettings();
		this.addSettingTab(new SpaceMousePanSettingTab(this.app, this));

		this.socket = new WebSocket("ws://localhost:3030");

		this.socket.onopen = () => {
			console.log("🧠 Connected to SpaceMouse input server");
		};
		
		setInterval(() => {
			this.applyZoom(this.activeZ);
		}, 10); // 10ms = ~100 FPS max, gated by debounce inside applyZoom		

		this.socket.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
		
				if (msg.type === 'translate') {
					let dx = msg.x * this.settings.panRate * 350;
					let dy = msg.y * this.settings.panRate * 350;
		
					if (this.settings.invertX) dx = -dx;
					if (this.settings.invertY) dy = -dy;
		
					this.panCanvas(dx, dy);
		
					// Update Z value for polling-based zoom
					this.activeZ = msg.z ?? 0;
				}
			} catch (err) {
				console.error("Invalid message from SpaceMouse server:", err);
			}
		};
		

		this.socket.onerror = (err) => {
			console.error("WebSocket error:", err);
		};
	}

	onunload() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}

	private panCanvas(dx: number, dy: number) {
		const view = this.app.workspace.getActiveViewOfType(ItemView);
		// @ts-ignore
		const canvas = (view as any)?.canvas;
		if (!canvas) return;

		const zoomFactor = (canvas.zoom ?? 0) + 5;
		canvas.tx += dx / zoomFactor;
		canvas.ty += dy / zoomFactor;
		canvas.markViewportChanged();
	}

	private lastZoomTime: number = 0;

	private applyZoom(z: number) {
		const view = this.app.workspace.getActiveViewOfType(ItemView);
		// @ts-ignore
		const canvas = (view as any)?.canvas;
		if (!canvas) return;
	
		const now = Date.now();
		if (now - this.lastZoomTime < 1) return;
		this.lastZoomTime = now;
	
		const { zoomDeadzone, zoomExponent, zoomMultiplier } = this.settings;
	
		let zoomFactor = 0;
	
		if (z > zoomDeadzone) {
			zoomFactor = zoomMultiplier * (Math.pow(z, zoomExponent) - Math.pow(zoomDeadzone, zoomExponent));
		} else if (z < -zoomDeadzone) {
			zoomFactor = -zoomMultiplier * (Math.pow(Math.abs(z), zoomExponent) - Math.pow(zoomDeadzone, zoomExponent));
		}
	
		if (zoomFactor !== 0) {
			canvas.zoomBy(zoomFactor);
		}
	}
	


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SpaceMousePanSettingTab extends PluginSettingTab {
	plugin: CanvasSpaceMousePanPlugin;
	private graphContainerEl: HTMLElement | null = null;


	constructor(app: App, plugin: CanvasSpaceMousePanPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Canvas SpaceMouse Pan Settings' });

		new Setting(containerEl)
			.setName('Pan rate')
			.setDesc('Multiplier for SpaceMouse panning speed')
			.addText((text) =>
				text
					.setPlaceholder("1.0")
					.setValue(this.plugin.settings.panRate.toString())
					.onChange(async (value) => {
						const parsed = parseFloat(value);
						if (!isNaN(parsed) && parsed > 0) {
							this.plugin.settings.panRate = parsed;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName('Invert X Axis')
			.setDesc('Reverse left/right pan direction')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.invertX)
					.onChange(async (value) => {
						this.plugin.settings.invertX = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Invert Y Axis')
			.setDesc('Reverse up/down pan direction')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.invertY)
					.onChange(async (value) => {
						this.plugin.settings.invertY = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Zoom Deadzone')
			.setDesc('Minimum absolute Z before zoom starts')
			.addText((text) =>
				text
					.setPlaceholder("0.5")
					.setValue(this.plugin.settings.zoomDeadzone.toString())
					.onChange(async (value) => {
						const parsed = parseFloat(value);
						if (!isNaN(parsed) && parsed >= 0 && parsed < 1) {
							this.plugin.settings.zoomDeadzone = parsed;
							await this.plugin.saveSettings();
							if (this.graphContainerEl) this.renderZoomGraph(this.graphContainerEl);
						}
					})
			);
		
		new Setting(containerEl)
			.setName('Zoom Exponent')
			.setDesc('Exponent of zoom curve (higher = steeper)')
			.addText((text) =>
				text
					.setPlaceholder("6")
					.setValue(this.plugin.settings.zoomExponent.toString())
					.onChange(async (value) => {
						const parsed = parseFloat(value);
						if (!isNaN(parsed) && parsed > 0) {
							this.plugin.settings.zoomExponent = parsed;
							await this.plugin.saveSettings();
							if (this.graphContainerEl) this.renderZoomGraph(this.graphContainerEl);
						}
					})
			);
		
		new Setting(containerEl)
			.setName('Zoom Multiplier')
			.setDesc('Overall zoom strength multiplier')
			.addText((text) =>
				text
					.setPlaceholder("0.05")
					.setValue(this.plugin.settings.zoomMultiplier.toString())
					.onChange(async (value) => {
						const parsed = parseFloat(value);
						if (!isNaN(parsed)) {
							this.plugin.settings.zoomMultiplier = parsed;
							await this.plugin.saveSettings();
							if (this.graphContainerEl) this.renderZoomGraph(this.graphContainerEl);
						}
					})					
			);

		containerEl.createEl('h3', { text: 'Zoom Curve Preview' });
		this.graphContainerEl = containerEl.createDiv();
		this.renderZoomGraph(this.graphContainerEl);
	}

	private renderZoomGraph(container: HTMLElement) {
		// Clear previous canvas if any
		container.empty();
		
		const width = 450;
		const height = 200;
	
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		container.appendChild(canvas);
	
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
	
		// Clear
		ctx.clearRect(0, 0, width, height);
	
		// Style
		ctx.strokeStyle = '#00aaff';
		ctx.lineWidth = 2;
		ctx.beginPath();
	
		const { zoomDeadzone, zoomExponent, zoomMultiplier } = this.plugin.settings;
	
		for (let i = 0; i < width; i++) {
			const z = (i / width) * 2 - 1; // Map i=0→-1, i=width→1
			let zoom = 0;
			if (z > zoomDeadzone) {
				zoom = zoomMultiplier * (Math.pow(z, zoomExponent) - Math.pow(zoomDeadzone, zoomExponent));
			} else if (z < -zoomDeadzone) {
				zoom = -zoomMultiplier * (Math.pow(Math.abs(z), zoomExponent) - Math.pow(zoomDeadzone, zoomExponent));
			}
	
			// Map zoom range to canvas Y (-0.05..+0.05) → (height..0)
			const y = height / 2 - zoom * (height * 8); // scale to fit
			const x = i;
	
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	
		// Draw axis
		ctx.strokeStyle = '#aaa';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, height / 2);
		ctx.lineTo(width, height / 2);
		ctx.stroke();
	
		ctx.beginPath();
		const dzX1 = width * (0.5 + zoomDeadzone / 2);
		const dzX2 = width * (0.5 - zoomDeadzone / 2);
		ctx.strokeStyle = '#ff4444';
		ctx.setLineDash([4, 4]);
		ctx.moveTo(dzX1, 0);
		ctx.lineTo(dzX1, height);
		ctx.moveTo(dzX2, 0);
		ctx.lineTo(dzX2, height);
		ctx.stroke();
		ctx.setLineDash([]);
	}
	
}
