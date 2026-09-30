# Tabbi

**⌘Tab for your Obsidian tabs.** Hold, tap, release. You're there.

You know the gesture already. Hold the modifier, tap to cycle, let go to land.
Tabbi brings it to Obsidian, ordered by what you actually used last — not by
whatever arbitrary order your tabs happen to sit in.

No fuzzy search box. No typing. No reading. Just the muscle memory you've had
since you learned to use a computer.

```
┌─────────────────────────────────────────┐
│  Attention Is All You Need              │
│  …ctures/Transformers/Attention Is…md   │
│ ╭─────────────────────────────────────╮ │
│ │ daily-2026-09-30                    │ │
│ │ Journal/2026/09/daily-2026-09-30.md │ │
│ ╰─────────────────────────────────────╯ │
│  Inference Infra                        │
│  …Interview Prep/System Design/Infra.md │
└─────────────────────────────────────────┘
```

## The gesture

| You do | You get |
| --- | --- |
| **Tap and release** | Bounce straight back to the last tab. The toggle you do a hundred times a day. |
| **Hold and keep tapping** | Walk down the list, one tab per tap, wrapping round at the end. |
| **Let go** | Lands on whatever's highlighted. Done. |

The overlay opens already sitting on your *previous* tab — so the quick tap is
a straight there-and-back, exactly like ⌘Tab between two apps. Keep holding and
it becomes a list you can walk.

Mouse and arrows work too, if you want them: `↑`/`↓` to move, `Enter` to
commit, `Esc` to bail, hover to preview, click to jump.

## Hotkeys

| | Default |
| --- | --- |
| Cycle forward | `Ctrl+Q` |
| Cycle backward | `Ctrl+Shift+Q` |

Rebind them in **Settings → Tabbi** as a chord — `Ctrl+Q`, `Alt+Tab`, `Mod+E`
(`Mod` is ⌘ on macOS, Ctrl elsewhere).

Every chord needs at least one modifier. That modifier *is* the thing you hold,
so a bare key has nothing to release and Tabbi will reject it.

> **One gotcha.** Tabbi sets these as the commands' *default* hotkeys. If you've
> ever customised the Tabbi commands under **Settings → Hotkeys**, that binding
> wins permanently and the plugin's own setting goes inert — Obsidian's API
> offers no way around it. Set your chord in Tabbi's settings, and clear any
> override in Obsidian's hotkey pane.

Don't bind `Mod+Q` on macOS. That quits Obsidian.

## Reading the list

Each row is the note name, with its full vault-relative path underneath.

Long paths truncate from the **left**, never the right — the tail is the part
that tells `Projects/Q3/notes.md` apart from `Archive/2019/notes.md`, so the
tail is what survives. Tabs with no file behind them (graph, canvas) get a type
tag instead.

## Settings

- **Switch on modifier release** — on by default. Turn it off if something on
  your system eats keyup events; the overlay then waits for `Enter` or a click.
- **Maximum entries** — cap the list. `0` shows everything.
- **Show full path** — toggle the second line.
- **Visible rows** — 4–20 before it starts scrolling.

## Install

Not in the community plugin directory yet. Two ways in the meantime.

### Via BRAT (recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs plugins straight
from GitHub and keeps them updated.

1. Install **BRAT** from Obsidian's community plugins and enable it.
2. Run **BRAT: Add a beta plugin for testing** from the command palette.
3. Paste `pujunru/obsidian-tabbi` and confirm.
4. Enable **Tabbi** under **Settings → Community plugins**.

Future releases arrive automatically.

### Manually

Grab `main.js`, `manifest.json`, and `styles.css` from the
[latest release](https://github.com/pujunru/obsidian-tabbi/releases/latest),
drop them into `<your-vault>/.obsidian/plugins/tabbi/`, and enable Tabbi under
**Settings → Community plugins**.

### From source

```sh
git clone https://github.com/pujunru/obsidian-tabbi.git
cd obsidian-tabbi
npm install
npm run build
```

`npm run dev` rebuilds on save.

## Notes

Desktop only — it rides on keyup events that Obsidian mobile doesn't deliver.
Only tabs in the main editing area are tracked; sidebars stay out of it.

## How it works

Obsidian keeps no most-recently-used order of its own, so Tabbi maintains one:
every active-leaf change promotes that leaf to the front, and closed tabs are
pruned lazily whenever the list is read.

The overlay is a plain DOM element on `document.body` rather than a `Modal`,
which keeps Obsidian's focus handling from stealing keys mid-cycle. A
capture-phase `keyup` listener on the document watches the master modifier —
parsed out of your chord, skipping `Shift` since that's usually the
reverse-direction qualifier — and commits the moment it lifts. A window `blur`
commits too, since a modifier release that happens after the OS takes the
keyboard away is a release that never arrives.

## License

MIT
