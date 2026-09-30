import { App, WorkspaceLeaf } from "obsidian";
import { SwitcherEntry } from "./types";

/**
 * Tracks the most-recently-used order of open workspace leaves.
 *
 * Obsidian gives no MRU ordering of its own, so we maintain one: every
 * active-leaf change moves that leaf to the front. Leaves are held by
 * reference and pruned lazily whenever the list is read, which keeps closed
 * tabs from leaking.
 */
export class MruTracker {
	private order: WorkspaceLeaf[] = [];

	constructor(private app: App) {}

	/** Seed the order from whatever is already open, active leaf first. */
	seed(): void {
		const leaves = this.collectOpenLeaves();
		const active = this.app.workspace.getMostRecentLeaf();
		this.order = leaves.sort((a, b) => {
			if (a === active) return -1;
			if (b === active) return 1;
			return 0;
		});
	}

	/** Promote a leaf to the front of the MRU order. */
	touch(leaf: WorkspaceLeaf | null): void {
		if (!leaf || !this.isTrackable(leaf)) return;
		const idx = this.order.indexOf(leaf);
		if (idx !== -1) this.order.splice(idx, 1);
		this.order.unshift(leaf);
	}

	/** Drop leaves that are no longer open and append any newly opened ones. */
	private reconcile(): WorkspaceLeaf[] {
		const open = new Set(this.collectOpenLeaves());
		this.order = this.order.filter((leaf) => open.has(leaf));
		for (const leaf of open) {
			if (!this.order.includes(leaf)) this.order.push(leaf);
		}
		return this.order;
	}

	/** Current MRU-ordered entries, ready to render. */
	entries(limit = 0): SwitcherEntry[] {
		const leaves = this.reconcile();
		const capped = limit > 0 ? leaves.slice(0, limit) : leaves;
		return capped.map((leaf) => this.describe(leaf));
	}

	/** All leaves in the main editing area, excluding sidebars. */
	private collectOpenLeaves(): WorkspaceLeaf[] {
		const leaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (this.isTrackable(leaf)) leaves.push(leaf);
		});
		return leaves;
	}

	private isTrackable(leaf: WorkspaceLeaf): boolean {
		const type = leaf.view?.getViewType();
		return !!type && type !== "empty";
	}

	private describe(leaf: WorkspaceLeaf): SwitcherEntry {
		const view = leaf.view;
		const file = (view as { file?: { basename: string; path: string } }).file;
		const viewType = view?.getViewType() ?? "unknown";

		if (file) {
			// Full vault-relative path, which is what disambiguates same-named
			// notes living in different folders.
			return { leaf, title: file.basename, subtitle: file.path, viewType };
		}

		return {
			leaf,
			title: view?.getDisplayText?.() || "Untitled",
			subtitle: viewType,
			viewType,
		};
	}
}
