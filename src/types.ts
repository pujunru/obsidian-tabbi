import { WorkspaceLeaf } from "obsidian";

/** A single entry rendered in the switcher overlay. */
export interface SwitcherEntry {
	leaf: WorkspaceLeaf;
	/** Primary label, e.g. the note basename. */
	title: string;
	/** Secondary label: the full vault-relative path, or the view type. */
	subtitle: string;
	/** Obsidian view type, used to tag non-file tabs. */
	viewType: string;
}

export interface TabbiSettings {
	/** Hotkey chord that opens the switcher and steps forward, e.g. "Ctrl+Q". */
	hotkey: string;
	/** Hotkey chord that steps backward while the overlay is open. */
	reverseHotkey: string;
	/** Cap on how many entries the overlay shows. 0 = unlimited. */
	maxEntries: number;
	/**
	 * When true the overlay commits on modifier release (cmd+Tab feel).
	 * When false it stays open until Enter/click, and Esc cancels.
	 */
	commitOnRelease: boolean;
	/** Show the full path line beneath each title. */
	showSubtitles: boolean;
	/** Rows visible before the list scrolls. */
	visibleRows: number;
}

export const DEFAULT_SETTINGS: TabbiSettings = {
	hotkey: "Ctrl+Q",
	reverseHotkey: "Ctrl+Shift+Q",
	maxEntries: 0,
	commitOnRelease: true,
	showSubtitles: true,
	visibleRows: 10,
};
