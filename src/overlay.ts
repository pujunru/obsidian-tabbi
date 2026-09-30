import { App } from "obsidian";
import { SwitcherEntry, TabbiSettings } from "./types";
import { ParsedHotkey } from "./hotkey";

/**
 * The floating switcher panel.
 *
 * Its lifetime is driven entirely by the master modifier: `open()` builds the
 * panel and installs a keyup listener, `step()` rotates the selection while
 * the modifier stays down, and the listener commits as soon as the modifier
 * comes back up. The panel is a plain DOM overlay rather than a Modal so that
 * Obsidian's own focus handling never steals keys mid-cycle.
 */
export class SwitcherOverlay {
	private container: HTMLElement | null = null;
	private itemEls: HTMLElement[] = [];
	private entries: SwitcherEntry[] = [];
	private index = 0;
	private cleanups: Array<() => void> = [];

	constructor(
		private app: App,
		private settings: TabbiSettings,
		private onCommit: (entry: SwitcherEntry) => void,
	) {}

	get isOpen(): boolean {
		return this.container !== null;
	}

	/**
	 * Show the overlay for `entries`, starting on the given index.
	 * `parsed` supplies the modifier keys whose release commits the choice.
	 */
	open(entries: SwitcherEntry[], startIndex: number, parsed: ParsedHotkey | null): void {
		if (entries.length === 0) return;
		this.close(false);

		this.entries = entries;
		this.index = this.wrap(startIndex);
		this.render();
		this.installListeners(parsed);
	}

	/** Rotate the selection by `delta`, wrapping round-robin at both ends. */
	step(delta: number): void {
		if (!this.isOpen) return;
		this.index = this.wrap(this.index + delta);
		this.highlight();
	}

	/** Commit the current selection and tear the overlay down. */
	commit(): void {
		if (!this.isOpen) return;
		const entry = this.entries[this.index];
		this.close(false);
		if (entry) this.onCommit(entry);
	}

	/** Dismiss without switching. */
	cancel(): void {
		this.close(false);
	}

	close(_unused = false): void {
		for (const fn of this.cleanups) fn();
		this.cleanups = [];
		this.container?.remove();
		this.container = null;
		this.itemEls = [];
		this.entries = [];
	}

	private wrap(i: number): number {
		const n = this.entries.length;
		if (n === 0) return 0;
		return ((i % n) + n) % n;
	}

	private render(): void {
		const root = document.body.createDiv({ cls: "tabbi-backdrop" });
		this.container = root;

		const panel = root.createDiv({ cls: "tabbi-panel" });
		panel.style.setProperty("--tabbi-rows", String(this.settings.visibleRows));

		for (const entry of this.entries) {
			const item = panel.createDiv({ cls: "tabbi-item" });

			const text = item.createDiv({ cls: "tabbi-text" });
			text.createDiv({ cls: "tabbi-title", text: entry.title });
			if (this.settings.showSubtitles) {
				text.createDiv({ cls: "tabbi-path", text: entry.subtitle });
			}

			// Tabs that aren't backed by a file (graph, canvas view, etc.) get a
			// small type tag so the row still says what it is.
			if (entry.subtitle === entry.viewType) {
				item.createDiv({ cls: "tabbi-tag", text: entry.viewType });
			}

			const idx = this.itemEls.length;
			item.addEventListener("mouseenter", () => {
				this.index = idx;
				this.highlight();
			});
			item.addEventListener("click", () => {
				this.index = idx;
				this.commit();
			});

			this.itemEls.push(item);
		}

		this.highlight();
	}

	private highlight(): void {
		this.itemEls.forEach((el, i) => el.toggleClass("is-selected", i === this.index));
		this.itemEls[this.index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}

	private installListeners(parsed: ParsedHotkey | null): void {
		const releaseKeys = parsed?.releaseKeys ?? [];

		const onKeyUp = (evt: KeyboardEvent) => {
			if (this.settings.commitOnRelease && releaseKeys.includes(evt.key)) {
				this.commit();
			}
		};

		const onKeyDown = (evt: KeyboardEvent) => {
			if (evt.key === "Escape") {
				evt.preventDefault();
				this.cancel();
				return;
			}
			if (evt.key === "Enter") {
				evt.preventDefault();
				this.commit();
				return;
			}
			// Arrow keys work whether or not the modifier is still held, which
			// makes the overlay usable when commitOnRelease is off.
			if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
				evt.preventDefault();
				this.step(1);
				return;
			}
			if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
				evt.preventDefault();
				this.step(-1);
			}
		};

		// A blur means the modifier release will never arrive (the OS took the
		// keyboard away), so commit what is selected rather than hanging open.
		const onBlur = () => {
			if (this.settings.commitOnRelease) this.commit();
			else this.cancel();
		};

		const onBackdropClick = (evt: MouseEvent) => {
			if (evt.target === this.container) this.cancel();
		};

		document.addEventListener("keyup", onKeyUp, true);
		document.addEventListener("keydown", onKeyDown, true);
		window.addEventListener("blur", onBlur);
		this.container?.addEventListener("click", onBackdropClick);

		this.cleanups.push(
			() => document.removeEventListener("keyup", onKeyUp, true),
			() => document.removeEventListener("keydown", onKeyDown, true),
			() => window.removeEventListener("blur", onBlur),
		);
	}
}
