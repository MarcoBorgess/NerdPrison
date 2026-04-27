# Idea

  Static page (HTML + vanilla JS) that displays a player's Minecraft prison server progress.
  Site title: "PRISION - Nerdzone" (used in <title> and h1)


  ## Purpose
  Read-only public view of brainrots (mobs), porretes (tools), and rebirths (brainrot base level) for sharing with other players.

  ## Hosting
  GitHub Pages — `main` branch root. No build step. Changes to data JSONs are live in ~30s after commit.

  ## Views

  ### Brainrots
  - Two separate tables on the same view:
    1. Coin Brainrots — generate Coins/s
    2. Rubi Brainrots — generate Rubi/s (same columns, different currency label)
  - Both tables: sortable by any column, default sort Buy Value descending
  - Columns: Name (with mob icon), Rarity, Coins/s or Rubi/s, Buy Value, Break/Even
  - Rarity shown as a colored pill badge using Minecraft chat color equivalents:
    - Mítico   → &d → #FF55FF
    - Lendário → &6 → #FFAA00
    - Raro     → &9 → #5555FF
    - Incomum  → &a → #55FF55
    - Comum    → &7 → #AAAAAA

  ### Rebirths
  - Table layout, fixed order by Level ascending (no sorting)
  - Columns: Level, Tokens Multiplier, Coins Multiplier, Cost, Needed Brainrots, Cost of Needed Brainrots, Total, Cumulative Total

  ### Porretes
  - Reference table only (v1, read-only)
  - Columns: Level, Name, Icon (Minecraft item image), Mob (Minecraft monster image), Damage, Level 1 Equivalents
  - Shows the 3-to-1 combining progression visually
  - Calculator (input Level 1 count → show possible combinations) is planned for v2

  ## Data
  - `data/brainrots.json` — list of brainrots
    - Fields: Name, Icon (Minecraft mob/item name for mc.nerothe.com), Rarity, CoinsPerSec, BuyValue
    - BreakEven is computed client-side: BuyValue / 2 / CoinsPerSec = seconds, displayed as "Xm Xd Xh Xmin"
      - Omit all leading-zero units (e.g. if months=0 and days=0, show "Xh Xmin"; first shown unit is always non-zero)
  - `data/porretes.json` — tool levels
    - Fields: Level, Name, Icon (Minecraft item name), Mob (Minecraft monster name), Damage, Level1Equivalents
    - Each tool when combined 3 together goes to another level (3x Level 2 tools = 1x Level 3 tool)
    - The tools are known as "Porretes"
  - `data/rebirths.json` — list of rebirths
    - Stored fields: Level, TokensMultiplier, CoinsMultiplier, Cost, NeededBrainrots, CostOfNeededBrainrots
    - Computed client-side:
      - Total = Cost + CostOfNeededBrainrots
      - CumulativeTotal = running sum of Total for all rebirths up to and including this level
  - Page fetches these via `fetch()` at runtime; no server needed.

  ## Stack
  - Plain HTML/CSS/JS only — no frameworks, no bundlers, no build step
  - `index.html` is the entry point
  - Styles in `style.css`, logic in `main.js`

  ## Conventions
  - Game values displayed with suffix format (e.g. "1.5B", "300K") — never raw numbers
  - No backend, no forms, read-only display only
  - Everything should be in Brazillian Portuguese PT-BR

# Style
    Theme: dark, minimal, data-dense                                                                                  
                   
  - Background: #0f0f13 (near-black with a faint blue tint). Cards/panels at #16161e. Input fields/buttons at
  #1e1e2e. All three share subtle blue-shifted dark tones, not pure grey.
  - Borders: 1px solid #2a2a3a everywhere — cards, inputs, buttons. On hover, lighten to #555. On "active/selected"
  state, accent blue #3a9bd5.
  - Text: Body #e0e0e0, labels/secondary #888, muted/disabled #666, headings #fff.
  - Font: 'Segoe UI', sans-serif. No external font imports.
  - Scrollbar: Hidden (scrollbar-width: none + webkit override).
  - Page padding: 24px on the body.

  Typography hierarchy:
  - h1: 1.6rem, white
  - h2 sections: 1rem, #aaa, text-transform: uppercase, letter-spacing: .08em, thin border-bottom: 1px solid #222
  - Subtitles: 0.85rem, #888
  - Table headers: 0.75rem, #666, uppercase, letter-spacing: 0.04em

  Cards and panels:
  - border-radius: 10–14px, border: 1px solid #2a2a3a, background #16161e
  - Subtle shadow: box-shadow: 0 4px 24px rgba(0,0,0,0.4) on main cards

  Buttons:
  - All buttons share the same base: background: #1e1e2e, border: 1px solid #2a2a3a, border-radius: 6–8px, color:
  #e0e0e0
  - Hover: border lightens to #555. No background change. No box-shadows.
  - Icon buttons (28–36px square): centered Minecraft pixel-art icons (image-rendering: pixelated), border-radius:
  6–8px
  - Pill/tag buttons: border-radius: 20px, small font 0.72rem, uppercase

  Accent colors (used sparingly, always with a matching tinted background):
  - Green #2ecc71 — active/completed state
  - Blue #3a9bd5 — selected nav, coin values
  - Yellow #f0c040 — token/currency values
  - Orange #e67e22 — cheapest/warning
  - Red #e74c3c — ruby/alert

  Inline editing pattern (future): display value with border-bottom: 1px dashed #444 (click to edit). On click, swap to an
  inline <input> + confirm button. No separate edit pages. NOT implemented in v1 — v1 is purely read-only display.

  Tables: full-width, border-collapse: collapse. th uppercase, muted. td with border-bottom: 1px solid #1e1e2e. Row
  hover: background: #1a1a26. Grand total rows get border-top: 2px solid #2a2a3a and slightly darker background
  #12121c.

  Config unlock pattern: config/edit icon button (⚙ or pencil, 28px) placed inline beside the h1 in the header. It
  toggles .ativo-wrap with display:none/flex to show/hide a config panel below the header.

  Navigation — header version:
  - A centered <nav> bar at the very top, background: #16161e, border-bottom: 1px solid #2a2a3a, padding: 10px 24px
  - Each nav link is an Icon + Name label (Minecraft pixel-art icon + text), not icon-only
  - Links arranged in a display: flex; justify-content: center; gap: 6px row
  - Active page: border-color: #3a9bd5
  - The page's own <header> (with h1 + edit button) sits below this nav bar, inside the 24px padded body
  - This is a SPA: single index.html, JS switches between views (no page reloads)
  - Nav order: Brainrots → Rebirths → Porretes
  - Default view on load: Brainrots
  - Nav icons (from mc.nerothe.com):
    - Brainrots → zombie_head
    - Rebirths  → nether_star
    - Porretes  → netherite_sword

  Minecraft assets:
  - Item/block icons (nav, porretes): https://mc.nerothe.com/img/1.20.1/<item_name>.png — image-rendering: pixelated
  - Mob face portraits (brainrots table): https://minecraft.wiki/images/<Mob_Name>_face.png — confirmed working without hash param

  ---                                                                                                               
  Design System — Brainrots Page Style                                                                              
                                                                                                                    
  Global Foundation                                                                                                 
                   
  - Background: #0f0f13 (very dark near-black with a slight blue-purple tint)
  - Text: #e0e0e0 (light grey, not pure white)
  - Font: 'Segoe UI', sans-serif
  - Body padding: 24px 24px 0 (no bottom padding)
  - Scrollbar: completely hidden (scrollbar-width: none + ::-webkit-scrollbar { display: none })
  - Box-sizing: border-box everywhere, all margin/padding reset to 0

  ---
  Color Palette

  ┌─────────────────────────┬─────────────────────────┐
  │          Role           │          Color          │
  ├─────────────────────────┼─────────────────────────┤
  │ Page background         │ #0f0f13                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Card/panel background   │ #16161e                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Input/button background │ #1e1e2e                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Subtle hover bg         │ #1a1a26                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Default border          │ #2a2a3a                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Hover border            │ #555                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Active/accent border    │ #3a9bd5                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Body text               │ #e0e0e0                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Muted text              │ #888                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Very muted / disabled   │ #666                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Ghost / placeholder     │ #555                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Section header text     │ #aaa                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Primary value (green)   │ #2ecc71                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Event value (teal)      │ #1abc9c                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Rubi / accent red       │ #FF5555                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Warning orange          │ #e67e22                 │
  ├─────────────────────────┼─────────────────────────┤
  │ Danger / delete red     │ #e74c3c                 │
  ├─────────────────────────┼─────────────────────────┤
  │ White heading           │ #fff                    │
  ├─────────────────────────┼─────────────────────────┤
  │ Current-row highlight   │ #1a2a1a (greenish dark) │
  ├─────────────────────────┼─────────────────────────┤
  │ Next-row highlight      │ #1a1a2a (blueish dark)  │
  └─────────────────────────┴─────────────────────────┘

  ---
  Navigation Bar (top-right)

  - Position: fixed, top: 14px, right: 18px, z-index: 100
  - Layout: flex, gap: 6px
  - Each button: 36×36px, bg #1e1e2e, border 1px solid #2a2a3a, border-radius: 8px
  - Contains a 24×24px Minecraft item image (image-rendering: pixelated)
  - Hover: border-color: #555
  - Active page: border-color: #3a9bd5 (blue)
  - Uses Minecraft image CDN: https://mc.nerothe.com/img/1.20.1/minecraft_<item>.png

  ---
  Header

  - display: flex, align-items: center, gap: 12px, margin-bottom: 4px
  - h1: color: #fff, font-size: 1.6rem
  - Subtitle (.subtitle): color: #888, font-size: 0.85rem, margin-bottom: 24px
  - Config button (.edit-btn): 28×28px, bg #1e1e2e, border 1px solid #2a2a3a, border-radius: 6px, contains 18×18px
  pixelated Minecraft image. Hover: border-color: #555

  ---
  Section Headings (h2)

  - font-size: 1rem, color: #aaa, text-transform: uppercase, letter-spacing: 0.08em
  - padding-bottom: 6px, border-bottom: 1px solid #222
  - Can be tinted by overriding color and border-bottom-color inline (e.g. red for Rubi: color: #FF5555;
  border-bottom-color: #FF5555)

  ---
  Cards (.brainrots-card)

  - background: #16161e
  - border: 1px solid #2a2a3a
  - border-radius: 14px
  - overflow: hidden
  - box-shadow: 0 4px 24px rgba(0,0,0,0.4)

  ---
  Tables (.brainrots-table)

  - width: 100%, border-collapse: collapse, font-size: 0.9rem
  - th: text-align: left, color: #666, font-size: 0.75rem, padding: 12px 16px 9px, border-bottom: 1px solid #2a2a3a,
   font-weight: 600, letter-spacing: 0.04em, text-transform: uppercase
  - td: padding: 10px 16px, border-bottom: 1px solid #1e1e2e
  - Last row: no border-bottom
  - Hover row: background: #1a1a26
  - Row highlights: current = #1a2a1a, next = #1a1a2a

  ---
  Calc Panels (.calc-panel)

  - Container .calc-panels: display: flex, gap: 16px
  - Each panel: background: #16161e, border: 1px solid #2a2a3a, border-radius: 12px, padding: 16px 24px, flex: 1
  - Panel title: font-size: 0.85rem, color: #888, text-transform: uppercase, letter-spacing: 0.08em, margin-bottom:
  10px, font-weight: 600
  - Calc rows: display: flex, justify-content: space-between, padding: 4px 0, border-bottom: 1px solid #1e1e2e,
  font-size: 0.9rem
  - Row label: color: #666
  - Row value: color: #2ecc71 (green), font-size: 1rem, font-weight: bold
  - Event panel values: color: #1abc9c (teal)

  ---
  Inputs / Selects / Forms

  All share this base style:
  - background: #1e1e2e
  - border: 1px solid #2a2a3a
  - border-radius: 6px
  - color: #e0e0e0
  - padding: 6px 10px (or 5px 10px for small ones)
  - font-size: 0.85rem
  - Focus: outline: none; border-color: #555

  ---
  Buttons

  Standard save/submit (.btn-save-rank):
  - background: #1e1e2e, border: 1px solid #2a2a3a, color: #e0e0e0
  - padding: 8px 20px, border-radius: 6px, font-size: 0.85rem
  - Hover: border-color: #555

  Remove button (.btn-remove):
  - background: none, border: 1px solid #2a2a3a, color: #666
  - padding: 2px 8px, border-radius: 4px, font-size: 1rem
  - Hover: color: #e74c3c; border-color: #e74c3c

  Sync button (.btn-sync):
  - background: #2c2c3a, color: #aaa, no border, padding: 7px 16px, border-radius: 6px, font-size: 0.82rem,
  font-weight: 600

  Rebirth step buttons (.rebirth-step-btn):
  - 30×30px, background: #1e1e2e, border: 1px solid #2a2a3a, border-radius: 6px, color: #e0e0e0, font-size: 1.1rem
  - Hover: border-color: #555

  ---
  Inline Click-to-Edit (Quantity Cells)

  - .qty-display: cursor: pointer, border-bottom: 1px dashed #444; hover: border-bottom-color: #888
  - On click: hides the span, shows .qty-form (flex, gap 6px)
  - Form input: width: 70px, bg #1e1e2e, border 1px solid #555, border-radius: 4px, color: #e0e0e0
  - Submit button: bg #1e1e2e, border 1px solid #2a2a3a, color: #2ecc71, padding: 4px 8px, border-radius: 4px
  - Escape key collapses all open qty forms and closes all modals

  ---
  Rebirth Cards

  Current level card (.rebirth-current):
  - background: #16161e, border: 1px solid #2a2a3a, border-radius: 12px
  - padding: 16px 20px, display: flex; flex-direction: column; align-items: center; gap: 10px
  - Level number: font-size: 2rem; font-weight: 700; color: #fff
  - Sub-info: font-size: 0.8rem; color: #888

  Next level card (.rebirth-next):
  - Same bg/border/radius, padding: 16px 20px, flex: 1
  - Content font-size: 0.9rem, requirement text color: #888; font-size: 0.82rem

  ---
  Modals

  Overlay (.modal-overlay):
  - position: fixed; inset: 0, background: rgba(0,0,0,0.6), z-index: 200
  - display: flex; align-items: center; justify-content: center
  - Click outside to close

  Box (.modal-box):
  - background: #16161e, border: 1px solid #2a2a3a, border-radius: 14px
  - padding: 24px 28px, width: 480px, max-width: calc(100vw - 32px)

  Modal title (.modal-title):
  - font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 18px
  - display: flex; justify-content: space-between; align-items: center

  Close button (.modal-close):
  - background: none; border: none; color: #666; font-size: 1.3rem; cursor: pointer
  - Hover: color: #e0e0e0

  Result cards (.modal-result-card):
  - background: #1e1e2e, border: 1px solid #2a2a3a, border-radius: 10px, padding: 12px 14px, text-align: center
  - Label: font-size: 0.72rem; color: #666; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px
  - Value: font-size: 1.05rem; font-weight: 700; color: #1abc9c
  - Negative value: color: #e74c3c via .negative class

  Divider (.modal-divider):
  - border: none; border-top: 1px solid #2a2a3a; margin: 16px 0

  Sub-text (.modal-sub):
  - font-size: 0.78rem; color: #666; text-align: center; margin-top: 12px

  ---
  Rarity Color Classes

  ┌──────────────┬─────────┐
  │    Class     │  Color  │
  ├──────────────┼─────────┤
  │ .rc-comum    │ #AAAAAA │
  ├──────────────┼─────────┤
  │ .rc-incomum  │ #55FF55 │
  ├──────────────┼─────────┤
  │ .rc-raro     │ #5555FF │
  ├──────────────┼─────────┤
  │ .rc-lendario │ #FFAA00 │
  ├──────────────┼─────────┤
  │ .rc-mitico   │ #FF55FF │
  ├──────────────┼─────────┤
  │ .rc-default  │ #e0e0e0 │
  └──────────────┴─────────┘

  ---
  Interaction Patterns

  - Toggle sections: clicking the config button toggles .hidden (display: none !important) on the settings form
  - Escape key: closes all open modals and inline edit forms globally
  - Click overlay to close modal: if (e.target === this) this.classList.add('hidden')
  - Data via <meta> tags: JS reads dynamic server values from <meta name="x" content="y"> with a _meta(name) helper,
   never from Jinja2 inside <script> tags

  ---
  Section Spacing

  - calc-section: margin-bottom: 28px
  - rebirth-section: margin-bottom: 28px
  - ref-section: margin-bottom: 24px
  - event-section: margin-bottom: 16px
  - .brainrots-card inside sections: margin-top: 10px or 16px
  - Add-forms below tables: margin-top: 10px, flex row, gap: 10px