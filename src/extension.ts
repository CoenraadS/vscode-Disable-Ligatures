import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const decoration = vscode.window.createTextEditorDecorationType({ color: "" });
    let configuration = readConfiguration();

    vscode.workspace.onDidChangeConfiguration((event) => {
        configuration = readConfiguration();
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection((event) => {
        configuration.regex.lastIndex = 0;
        disableLigatures(event);
    }, null, context.subscriptions);

    function disableLigatures(event: vscode.TextEditorSelectionChangeEvent) {
        const editor = event.textEditor;

        const positions = selectionsToMap(event.selections);
        const ranges: vscode.Range[] = [];

        for (const [lineNumber, charPositions] of positions) {
            const text = editor.document.lineAt(lineNumber).text;

            for (const position of charPositions) {
                let match: RegExpExecArray | null;
                // tslint:disable-next-line:no-conditional-assignment
                while ((match = configuration.regex.exec(text)) !== null) {
                    if (configuration.mode === "Line") {
                        ranges.push(...matchLine(lineNumber, match));
                    }
                    else if (configuration.mode === "Cursor") {
                        ranges.push(...matchCursor(lineNumber, position, match));
                    }
                    else {
                        throw new Error("Invalid Mode");
                    }
                }
            }
        }

        editor.setDecorations(decoration, ranges);
    }

    function matchLine(lineNumber: number, match: RegExpExecArray) {
        const ranges: vscode.Range[] = [];
        for (let i = 0; i < match[0].length; i++) {
            const offset = match.index + i;
            ranges.push(new vscode.Range(lineNumber, offset, lineNumber, offset + 1));
        }

        return ranges;
    }

    function matchCursor(lineNumber: number, position: number, match: RegExpExecArray) {
        const ranges: vscode.Range[] = [];
        if (position >= match.index && position <= match.index + match[0].length) {
            for (let i = 0; i < match[0].length; i++) {
                const offset = match.index + i;
                ranges.push(new vscode.Range(lineNumber, offset, lineNumber, offset + 1));
            }
        }

        return ranges;
    }

    function selectionsToMap(selections: vscode.Selection[]) {
        const positions = new Map<number, Set<number>>();

        selections.forEach((selection) => {
            let charPositions = positions.get(selection.start.line);

            if (charPositions) {
                charPositions.add(selection.start.character);
            }
            else {
                positions.set(selection.start.line, new Set<number>([selection.start.character]));
            }

            charPositions = positions.get(selection.end.line);

            if (charPositions) {
                charPositions.add(selection.end.character);
            }
            else {
                positions.set(selection.end.line, new Set<number>([selection.end.character]));
            }
        });

        return positions;
    }

    function readConfiguration(): { mode: string, regex: RegExp } {
        const ligatureConfiguration = vscode.workspace.getConfiguration().get("disableLigatures") as any;
        const ligatures = ligatureConfiguration.ligatures as string[];

        // Match longest first
        ligatures.sort((a, b) => {
            return b.length - a.length;
        });

        const escapeRegex = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < ligatures.length; i++) {
            ligatures[i] = ligatures[i].replace(escapeRegex, "\\$&");
        }

        const mode = ligatureConfiguration.mode as string;
        const regex = new RegExp(ligatures.join("|"), "gi");
        return { mode, regex };
    }
}
