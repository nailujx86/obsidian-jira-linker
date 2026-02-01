import JiraLinkerPlugin from './main';
import { PluginSettingTab, App, Setting, MarkdownView } from 'obsidian';

export default class JiraLinkerSettingTab extends PluginSettingTab {
	plugin: JiraLinkerPlugin;

	constructor(app: App, plugin: JiraLinkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const groupElem = containerEl.createDiv({ cls: 'setting-group'});

		const settingsContainer = groupElem.createDiv({ cls: 'setting-items'});

		new Setting(settingsContainer)
			.setName('Project Mappings')
			.setDesc('Define project keys and their Jira URLs. Format: PROJECT_KEY=https://jira.url (one per line)')
			.addTextArea(text => text
				.setPlaceholder('PROJ=https://jira.company.com\nBACK=https://jira.backend.com')
				.setValue(this.plugin.settings.projectMappings)
				.onChange(async (value) => {
					this.plugin.settings.projectMappings = value;
					await this.plugin.saveSettings();
					this.plugin.reloadProjectMappings();
				})
			);

		new Setting(settingsContainer)
			.setName('Enable in Preview Mode')
			.setDesc('Show clickable links in preview/reading mode')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePreview)
				.onChange(async (value) => {
					this.plugin.settings.enablePreview = value;
					await this.plugin.saveSettings();
					this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode.rerender(true);
				})
			);

		new Setting(settingsContainer)
			.setName('Enable in Edit Mode')
			.setDesc('Show clickable links while editing')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableEditMode)
				.onChange(async (value) => {
					this.plugin.settings.enableEditMode = value;
					await this.plugin.saveSettings();
					this.plugin.applyEditorExtension();
				})
			);

		
		containerEl.createEl('hr');
		containerEl.createEl('p', {
			text: '📖 Example: PROJ-123 will link to https://jira.atlassian.net/browse/PROJ-123',
		});
	}
}
