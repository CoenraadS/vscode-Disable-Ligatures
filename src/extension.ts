import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const decoration = vscode.window.createTextEditorDecorationType({ color: "" });
    let configuration = readConfiguration();

    if (vscode.window.activeTextEditor) {
        disableGlobalLigatures(vscode.window.activeTextEditor);
    }

    vscode.workspace.onDidChangeConfiguration((event) => {
        configuration = readConfiguration();

        if (vscode.window.activeTextEditor) {
            disableGlobalLigatures(vscode.window.activeTextEditor);
        }
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorSelection((event) => {
        disableLigatures(event);
    }, null, context.subscriptions);

    function addGlobalRangesToEditor(ranges: vscode.Range[], editor: vscode.TextEditor) {
        const firstLineNumber = 0;
        const lastLineNumber = editor.document.lineCount - 1;

        for (let lineNumber = firstLineNumber; lineNumber <= lastLineNumber; lineNumber++) {
            const text = editor.document.lineAt(lineNumber).text;
            let match: RegExpExecArray | null;
            configuration.globalRegex.lastIndex = 0;
            // tslint:disable-next-line:no-conditional-assignment
            while ((match = configuration.globalRegex.exec(text)) !== null) {
                ranges.push(...matchLine(lineNumber, match));
            }
        }
    }

    function disableGlobalLigatures(editor: vscode.TextEditor) {
        const ranges: vscode.Range[] = [];

        addGlobalRangesToEditor(ranges, editor);

        editor.setDecorations(decoration, ranges);
    }

    function disableLigatures(event: vscode.TextEditorSelectionChangeEvent) {
        const editor = event.textEditor;

        const positions = selectionsToMap(event.selections);
        const ranges: vscode.Range[] = [];

        addGlobalRangesToEditor(ranges, editor);

        configuration.regex.lastIndex = 0;
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

    function readConfiguration(): { mode: string, regex: RegExp, globalRegex: RegExp } {
        const ligatureConfiguration = Object(vscode.workspace.getConfiguration().get("disableLigatures")) as any;
        const globalLigatures = Array.from(ligatureConfiguration.globalLigatures || []) as string[];
        const ligatures = Array.from(ligatureConfiguration.ligatures || []) as string[];
        const sortByLongestFirst = (a: any, b: any) => b.length - a.length;

        // Match longest first
        globalLigatures.sort(sortByLongestFirst);
        ligatures.sort(sortByLongestFirst);

        const escapeRegex = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < ligatures.length; i++) {
            globalLigatures[i] = globalLigatures[i].replace(escapeRegex, "\\$&");
            ligatures[i] = ligatures[i].replace(escapeRegex, "\\$&");
        }

        const mode = (ligatureConfiguration.mode || '') as string;
        const globalHashMap = globalLigatures.reduce((hashMap, string) => Object.assign(hashMap, { [string]: true }), {});
        const globalRegex = new RegExp(globalLigatures.join("|") || "[^\\W\\w]", "gi");
        const regex = new RegExp(ligatures.filter(string => !globalHashMap[string]).join("|") || "[^\\W\\w]", "gi");
        return { mode, regex, globalRegex };
    }
}
