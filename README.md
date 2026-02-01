
# Jira Auto Linker

Convert Jira-style issue keys (PROJECT-123) to clickable links with configurable project mappings.

## Features

- **Automatic link detection**: Scans your notes for Jira-style issue keys (e.g., `PROJ-123`)
- **Configurable project mappings**: Map project keys to your Jira instance URLs
- **Clickable links**: Convert issue keys to interactive links in your vault
- **Editor and Preview**: Works in the Markdown editor as well as in the Preview mode

## Installation

1. Copy `main.js`, `manifest.json`, and `styles.css` (if present) to:
    ```
    <Vault>/.obsidian/plugins/obsidian-jira-auto-linker/
    ```
2. Reload Obsidian
3. Enable the plugin in **Settings → Community plugins**

## Configuration

Open **Settings → Jira Auto Linker** to configure:

- **Project mappings**: Add Jira project keys and their base URLs
  - Example: `PROJ` → `https://jira.company.com/browse/`
- **Preview mode**: Enable or disable the auto-linking in preview mode
- **Edit mode**: Enable or disable the auto-linking in edit mode (default disabled)

## Usage

Simply write Jira issue keys in your notes. They'll automatically become clickable links pointing to your configured Jira instance.

Example: `PROJ-123` becomes a link to `https://jira.company.com/browse/PROJ-123`

## Development

```bash
npm install
npm run dev       # Watch mode
npm run build     # Production build
```

## License

See LICENSE file for details.
