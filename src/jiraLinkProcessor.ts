export default class JiraLinkProcessor {
	private projectMappings: Record<string, string>;
	private readonly linkCache: Map<string, string> = new Map();

	constructor(projectMappings: Record<string, string>) {
		this.projectMappings = projectMappings;
	}

	processElement(element: HTMLElement, projectMappings: Record<string, string>) {
		this.projectMappings = projectMappings;
		this.walkTree(element);
	}

	getJiraUrl(projectKey: string, issueKey: string): string | null {
		const cacheKey = `${projectKey}-${issueKey}`;

		if (this.linkCache.has(cacheKey)) {
			return this.linkCache.get(cacheKey) || null;
		}

		const baseUrl = this.projectMappings[projectKey];
		if (!baseUrl) {
			// no project mapping?
			this.linkCache.set(cacheKey, '');
			return null;
		}

		const url = `${baseUrl.replace(/\/$/, '')}/browse/${issueKey}`;
		this.linkCache.set(cacheKey, url);
		return url;
	}

	getJiraKeyRegex(): RegExp {
		return /\b([A-Z]+)-(\d+)\b/g;
	}

	setProjectMappings(mappings: Record<string, string>) {
		this.projectMappings = mappings;
		this.clearCache();
	}

	private walkTree(node: Node) {
		if (node.nodeType === Node.TEXT_NODE) {
			this.processTextNode(node as Text);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			// Skip certain elements that shouldn't be processed
			const element = node as HTMLElement;
			if (this.shouldSkipElement(element)) {
				return;
			}

			// Process children
			const children = Array.from(node.childNodes);
			for (const child of children) {
				this.walkTree(child);
			}
		}
	}

	private processTextNode(textNode: Text) {
		const text = textNode.textContent;
		if (!text) return;

		const matches = Array.from(text.matchAll(this.getJiraKeyRegex()));
		if (matches.length === 0) return;

		// Build a new fragment with links
		const fragment = document.createDocumentFragment();
		let lastIndex = 0;

		for (const match of matches) {
			const fullKey = match[0];
			const projectKey = match[1] as string;
			const startIndex = match.index;

			// Add text before the match
			if (startIndex > lastIndex) {
				fragment.appendChild(
					document.createTextNode(text.substring(lastIndex, startIndex))
				);
			}

			// Add the link
			const url = this.getJiraUrl(projectKey, fullKey);
			if (url) {
				const link = this.createJiraLink(fullKey, url);
				fragment.appendChild(link);
				lastIndex = startIndex + fullKey.length;
			}
		}

		// Add remaining text
		if (lastIndex < text.length) {
			fragment.appendChild(
				document.createTextNode(text.substring(lastIndex))
			);
		}

		// Replace original text node with fragment
		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	private createJiraLink(text: string, url: string): HTMLElement {
		const link = document.createElement('a');
		link.href = url;
		link.textContent = text;
		link.className = 'jira-link';
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.title = `Open ${text} in Jira`;
		return link;
	}

	private shouldSkipElement(element: HTMLElement): boolean {
		const tagName = element.tagName.toLowerCase();

		// Don't process links, code blocks, or metadata
		if (
			tagName === 'a' ||
			tagName === 'code' ||
			tagName === 'pre' ||
			tagName === 'script' ||
			tagName === 'style' ||
			element.classList.contains('jira-link')
		) {
			return true;
		}

		return false;
	}

	clearCache() {
		this.linkCache.clear();
	}
}
