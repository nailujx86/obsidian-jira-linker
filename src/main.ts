import { Plugin } from 'obsidian';
import { EditorView, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Extension, RangeSetBuilder } from '@codemirror/state';
import JiraLinkerSettingTab from './jiraLinkerSettingTab';
import JiraLinkProcessor from './jiraLinkProcessor';

interface JiraLinkerSettings {
	projectMappings: string;
	enablePreview: boolean;
	enableEditMode: boolean;
	cacheEnabled: boolean;
}

const DEFAULT_SETTINGS: JiraLinkerSettings = {
	projectMappings: 'PROJ=https://jira.atlassian.net',
	enablePreview: true,
	enableEditMode: false,
	cacheEnabled: true,
};

export default class JiraLinkerPlugin extends Plugin {
	settings: JiraLinkerSettings;
	public jiraProcessor: JiraLinkProcessor;

	private readonly editorExtensions: Extension[] = [];

	async onload() {
		await this.loadSettings();

		this.jiraProcessor = new JiraLinkProcessor(
			this.parseProjectMappings()
		);

		this.registerMarkdownPostProcessor((element, context) => {
			if (this.settings.enablePreview) {
				this.jiraProcessor.processElement(element, this.parseProjectMappings());
			}
		});

		this.registerEditorExtension(this.editorExtensions);

		this.applyEditorExtension();

		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.classList.contains('jira-link-editor')) {
				const url = target.dataset.jiraUrl;
				if (url) {
					window.open(url, '_blank');
					e.preventDefault();
				}
			}
		});

		this.addSettingTab(new JiraLinkerSettingTab(this.app, this));

		console.log('Jira Linker plugin loaded');
	}

	applyEditorExtension() {
		this.editorExtensions.length = 0;

		if (this.settings.enableEditMode) {
			this.editorExtensions.push(this.createEditorExtension(this.jiraProcessor));
		}

		this.app.workspace.updateOptions();
	}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData()};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private parseProjectMappings(): Record<string, string> {
		const mappings: Record<string, string> = {};
		const lines = this.settings.projectMappings.split('\n').filter(l => l.trim());

		for (const line of lines) {
			const [key, url] = line.split('=').map(s => s.trim());
			if (key && url) {
				mappings[key.toUpperCase()] = url;
			}
		}

		return mappings;
	}

	private createEditorExtension(processor: JiraLinkProcessor) {
		return ViewPlugin.fromClass(
			class {
				decorations: DecorationSet;

				constructor(view: EditorView) {
					this.decorations = this.buildDecorations(view);
				}

				update(update: ViewUpdate) {
					if (update.docChanged || update.viewportChanged) {
						this.decorations = this.buildDecorations(update.view);
					}
				}

				private buildDecorations(view: EditorView): DecorationSet {
					const builder = new RangeSetBuilder<Decoration>();
					const jiraKeyRegex = processor.getJiraKeyRegex();

					for (const { from, to } of view.visibleRanges) {
						const text = view.state.doc.sliceString(from, to);
						let match;

						while ((match = jiraKeyRegex.exec(text)) !== null) {
							const projectKey = match[1] as string;
							const issueKey = match[0];
							const url = processor.getJiraUrl(projectKey, issueKey);

							if (url) {
								const start = from + match.index;
								const end = start + issueKey.length;

								const decoration = Decoration.mark({
									class: 'jira-link-editor jira-link',
									attributes: {
										'data-jira-url': url,
										'data-issue-key': issueKey,
										title: `Open ${issueKey} in Jira`,
									},
								});

								builder.add(start, end, decoration);
							}
						}
					}

					return builder.finish();
				}
			},
			{
				decorations: (v) => v.decorations,
			}
		);
	}

	reloadProjectMappings() {
		const mappings = this.parseProjectMappings();
		this.jiraProcessor.setProjectMappings(mappings);
	}
}


