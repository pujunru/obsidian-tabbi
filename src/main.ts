import { Plugin, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, TabbiSettings, SwitcherEntry } from "./types";
import { MruTracker } from "./mru";
import { SwitcherOverlay } from "./overlay";
import { TabbiSettingTab } from "./settings";
import { parseHotkey, toObsidianHotkey } from "./hotkey";

const FORWARD_COMMAND = "cycle-forward";
const BACKWARD_COMMAND = "cycle-backward";

export default class TabbiPlugin extends Plugin {
	settings: TabbiSettings = DEFAULT_SETTINGS;
	private mru!: MruTracker;
	private overlay!: SwitcherOverlay;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.mru = new MruTracker(this.app);
		this.overlay = new SwitcherOverlay(this.app, this.settings, (entry) =>
			this.activate(entry),
		);

		this.app.workspace.onLayoutReady(() => this.mru.seed());

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
				// Ignore changes we caused ourselves mid-cycle; the commit path
				// records the final destination instead.
				if (this.overlay.isOpen) return;
				this.mru.touch(leaf);
			}),
		);

		this.registerCommands();
		this.addSettingTab(new TabbiSettingTab(this.app, this));
	}

	onunload(): void {
		this.overlay?.close();
	}

	private registerCommands(): void {
		const forward = parseHotkey(this.settings.hotkey);
		const backward = parseHotkey(this.settings.reverseHotkey);

		this.addCommand({
			id: FORWARD_COMMAND,
			name: "Cycle to next tab",
			hotkeys: forward ? [toObsidianHotkey(forward)] : [],
			callback: () => this.cycle(1),
		});

		this.addCommand({
			id: BACKWARD_COMMAND,
			name: "Cycle to previous tab",
			hotkeys: backward ? [toObsidianHotkey(backward)] : [],
			callback: () => this.cycle(-1),
		});
	}

	/**
	 * Step the switcher. The first press opens the overlay on the second
	 * entry — the previously-used tab — which is what makes a tap-and-release
	 * behave like a straight toggle between two tabs. Later presses while the
	 * modifier is still held just rotate the selection.
	 */
	private cycle(delta: number): void {
		if (this.overlay.isOpen) {
			this.overlay.step(delta);
			return;
		}

		const entries = this.mru.entries(this.settings.maxEntries);
		if (entries.length < 2) return;

		const parsed = parseHotkey(
			delta > 0 ? this.settings.hotkey : this.settings.reverseHotkey,
		);
		const start = delta > 0 ? 1 : entries.length - 1;
		this.overlay.open(entries, start, parsed);
	}

	private activate(entry: SwitcherEntry): void {
		this.app.workspace.setActiveLeaf(entry.leaf, { focus: true });
		this.mru.touch(entry.leaf);
	}

	/** Re-register commands so new default hotkeys take effect. */
	refreshHotkeys(): void {
		this.registerCommands();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
