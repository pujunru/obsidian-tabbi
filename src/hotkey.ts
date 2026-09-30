import { Modifier, Hotkey, Platform } from "obsidian";

export interface ParsedHotkey {
	modifiers: Modifier[];
	key: string;
	/**
	 * KeyboardEvent.key values whose release should commit the overlay.
	 * Derived from the *first* modifier in the chord, which acts as the
	 * "master key" the user holds down.
	 */
	releaseKeys: string[];
}

/** Canonical Obsidian modifier names, keyed by the aliases users type. */
const MODIFIER_ALIASES: Record<string, Modifier> = {
	ctrl: "Ctrl",
	control: "Ctrl",
	cmd: "Mod",
	command: "Mod",
	meta: "Meta",
	super: "Meta",
	win: "Meta",
	mod: "Mod",
	alt: "Alt",
	option: "Alt",
	opt: "Alt",
	shift: "Shift",
};

/**
 * KeyboardEvent.key values that correspond to each modifier. "Mod" maps to
 * Meta on macOS and Control elsewhere, matching Obsidian's own resolution.
 */
function releaseKeysFor(mod: Modifier): string[] {
	switch (mod) {
		case "Ctrl":
			return ["Control"];
		case "Meta":
			return ["Meta", "OS"];
		case "Alt":
			return ["Alt", "AltGraph"];
		case "Shift":
			return ["Shift"];
		case "Mod":
			return Platform.isMacOS ? ["Meta", "OS"] : ["Control"];
		default:
			return [];
	}
}

/** Normalise a single key token to the form Obsidian expects. */
function normaliseKey(raw: string): string {
	const token = raw.trim();
	if (token.length === 1) return token.toUpperCase();
	const named: Record<string, string> = {
		tab: "Tab",
		space: " ",
		enter: "Enter",
		return: "Enter",
		escape: "Escape",
		esc: "Escape",
		backspace: "Backspace",
		arrowup: "ArrowUp",
		arrowdown: "ArrowDown",
		arrowleft: "ArrowLeft",
		arrowright: "ArrowRight",
		up: "ArrowUp",
		down: "ArrowDown",
		left: "ArrowLeft",
		right: "ArrowRight",
	};
	const lower = token.toLowerCase();
	if (named[lower]) return named[lower];
	if (/^f\d{1,2}$/.test(lower)) return lower.toUpperCase();
	return token;
}

/**
 * Parse a chord like "Ctrl+Shift+Q" into modifiers, key, and the physical
 * keys whose release should commit the switcher. Returns null when the chord
 * is malformed or has no modifier (a modifier is required — without one there
 * is nothing to hold).
 */
export function parseHotkey(chord: string): ParsedHotkey | null {
	const parts = chord
		.split("+")
		.map((p) => p.trim())
		.filter((p) => p.length > 0);
	if (parts.length < 2) return null;

	const modifiers: Modifier[] = [];
	for (const part of parts.slice(0, -1)) {
		const mod = MODIFIER_ALIASES[part.toLowerCase()];
		if (!mod) return null;
		if (!modifiers.includes(mod)) modifiers.push(mod);
	}
	if (modifiers.length === 0) return null;

	const key = normaliseKey(parts[parts.length - 1]);
	if (!key) return null;

	// The master key is the first modifier typed; Shift is never a master key
	// on its own since it is usually the "reverse direction" qualifier.
	const master = modifiers.find((m) => m !== "Shift") ?? modifiers[0];

	return { modifiers, key, releaseKeys: releaseKeysFor(master) };
}

/** Convert a parsed chord into the shape Obsidian's command registry wants. */
export function toObsidianHotkey(parsed: ParsedHotkey): Hotkey {
	return { modifiers: parsed.modifiers, key: parsed.key };
}

/** Render a chord for display, using platform-appropriate symbols. */
export function displayHotkey(chord: string): string {
	const parsed = parseHotkey(chord);
	if (!parsed) return chord;
	const symbols: Record<string, string> = Platform.isMacOS
		? { Mod: "⌘", Meta: "⌘", Ctrl: "⌃", Alt: "⌥", Shift: "⇧" }
		: { Mod: "Ctrl", Meta: "Win", Ctrl: "Ctrl", Alt: "Alt", Shift: "Shift" };
	const joiner = Platform.isMacOS ? "" : "+";
	const mods = parsed.modifiers.map((m) => symbols[m] ?? m).join(joiner);
	return mods + joiner + (parsed.key === " " ? "Space" : parsed.key);
}
