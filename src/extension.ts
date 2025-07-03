import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('vsc-dotfiles is active');

	const wordUnderCursor = (): [string, vscode.Range] | [undefined, undefined] => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return [undefined, undefined];
		}
		const document = editor.document;
		const position = editor.selection.active;
		const wordRange = document.getWordRangeAtPosition(position);
		if (!wordRange) {
			return [undefined, undefined];
		}
		const word = document.getText(wordRange);
		return [word, wordRange];
	};

	context.subscriptions.push(
		vscode.commands.registerCommand('vsc-dotfiles.searchWordUnderCursor', () => {
			const [word, _] = wordUnderCursor();
			if (!word) {
				console.error('No word under cursor');
				return;
			}

			vscode.commands.executeCommand('workbench.action.findInFiles', {
				query: word
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vsc-dotfiles.searchSelection', () => {
			const selection = vscode.window.activeTextEditor?.selection;
			if (!selection || selection.isEmpty) {
				console.error('No selection');
				return;
			}

			const selectionRange = new vscode.Range(selection.start, selection.end);
			const selectedText = vscode.window.activeTextEditor?.document.getText(selectionRange);

			if (!selectedText) {
				console.error('No selected text');
				return;
			}

			vscode.commands.executeCommand('workbench.action.findInFiles', {
				query: selectedText
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('vsc-dotfiles.toggleCasing', () => {
			let replacingSelection = false;
			let range: vscode.Range | undefined = undefined;
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}
			let selectedText: string | undefined;
			if (editor.selection.isEmpty) {
				[selectedText, range] = wordUnderCursor();
			} else {
				selectedText = editor.document.getText(editor.selection);
				replacingSelection = true;
			}

			if (!selectedText) {
				console.error('No selection or word under cursor');
				return;
			}

			const isSnakeCase = (str: string) => str.includes('_');
			const toCamelCase = (str: string) =>
				str.replace(/_([a-zA-Z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (m) => m.toUpperCase());
			const toSnakeCase = (str: string) =>
				str.replace(/([A-Z])/g, '_$1').replace(/^_/, '').toLowerCase();

			let toggled: string;
			if (isSnakeCase(selectedText)) {
				toggled = toCamelCase(selectedText);
			} else {
				toggled = toSnakeCase(selectedText);
			}

			let selection: vscode.Selection = editor.selection;
			if (!replacingSelection) {
				if (range) {
					selection = new vscode.Selection(range.start, range.end);
				} else {
					vscode.window.showErrorMessage('No range available for selection');
				}
			}
			editor.edit(editBuilder => {
				editBuilder.replace(selection, toggled);
			});
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
