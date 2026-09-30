import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type TabbiPlugin from "./main";
import { parseHotkey, displayHotkey } from "./hotkey";

export class TabbiSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: TabbiPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Switcher hotkey")
			.setDesc(
				"Chord that opens the switcher and steps forward. Hold the modifier and tap the " +
					"key repeatedly to cycle. Example: Ctrl+Q, Alt+Tab, Mod+E.",
			)
			.addText((text) =>
				text
					.setPlaceholder("Ctrl+Q")
					.setValue(this.plugin.settings.hotkey)
					.onChange(async (value) => {
						if (!parseHotkey(value)) return;
						this.plugin.settings.hotkey = value.trim();
						await this.plugin.saveSettings();
						this.plugin.refreshHotkeys();
					}),
			);

		new Setting(containerEl)
			.setName("Reverse hotkey")
			.setDesc("Chord that steps backward through the list. Usually the forward chord plus Shift.")
			.addText((text) =>
				text
					.setPlaceholder("Ctrl+Shift+Q")
					.setValue(this.plugin.settings.reverseHotkey)
					.onChange(async (value) => {
						if (!parseHotkey(value)) return;
						this.plugin.settings.reverseHotkey = value.trim();
						await this.plugin.saveSettings();
						this.plugin.refreshHotkeys();
					}),
			);

		new Setting(containerEl)
			.setName("Switch on modifier release")
			.setDesc(
				"On: the overlay closes and switches the moment you let go of the modifier, like cmd+Tab. " +
					"Off: the overlay stays open until you press Enter or click an entry.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.commitOnRelease).onChange(async (value) => {
					this.plugin.settings.commitOnRelease = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Maximum entries")
			.setDesc("How many tabs the overlay shows at once. 0 shows every open tab.")
			.addText((text) =>
				text
					.setPlaceholder("0")
					.setValue(String(this.plugin.settings.maxEntries))
					.onChange(async (value) => {
						const n = Number.parseInt(value, 10);
						if (Number.isNaN(n) || n < 0) return;
						this.plugin.settings.maxEntries = n;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Show full path")
			.setDesc("Display the full vault-relative path beneath each tab name.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showSubtitles).onChange(async (value) => {
					this.plugin.settings.showSubtitles = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Visible rows")
			.setDesc("How many tabs are visible before the list starts scrolling.")
			.addSlider((slider) =>
				slider
					.setLimits(4, 20, 1)
					.setValue(this.plugin.settings.visibleRows)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.visibleRows = value;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: "Current bindings" });
		const list = containerEl.createEl("ul");
		list.createEl("li", {
			text: `Forward: ${displayHotkey(this.plugin.settings.hotkey)}`,
		});
		list.createEl("li", {
			text: `Backward: ${displayHotkey(this.plugin.settings.reverseHotkey)}`,
		});

		new Setting(containerEl)
			.setDesc(
				"Bindings set here are applied as the commands' default hotkeys. If you have " +
					"previously customised them under Settings → Hotkeys, that customisation wins — " +
					"clear it there to pick these up.",
			)
			.addButton((btn) =>
				btn.setButtonText("Open hotkey settings").onClick(() => {
					const setting = (this.app as unknown as {
						setting: { open(): void; openTabById(id: string): void };
					}).setting;
					setting.open();
					setting.openTabById("hotkeys");
					new Notice("Search for “Tabbi” to review the bindings.");
				}),
			);
	}
}
