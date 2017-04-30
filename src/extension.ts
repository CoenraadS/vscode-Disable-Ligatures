import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    const ligatures: string[] =
        [
            ".=",
            ".-",
            ":=",
            "=:=",
            "==",
            "!=",
            "===",
            "!==",
            "=/=",
            "<-<",
            "<<-",
            "<--",
            "<-",
            "<->",
            "->",
            "-->",
            "->>",
            ">->",
            "<=<",
            "<<=",
            "<==",
            "<=>",
            "=>",
            "==>",
            "=>>",
            ">=>",
            ">>=",
            ">>-",
            ">-",
            "<~>",
            "-<",
            "-<<",
            "=<<",
            "<~~",
            "<~",
            "~~",
            "~>",
            "~~>",
            "<<<",
            "<<",
            "<=",
            "<>",
            ">=",
            ">>",
            ">>>",
            "<|||",
            "<||",
            "<|",
            "<|>",
            "|>",
            "||>",
            "|||>",
            "<$",
            "<$>",
            "$>",
            "<+",
            "<+>",
            "+>",
            "<*",
            "<*>",
            "*>",
            "\\\\", // => \\
            "\\\\\\", // => \\\
            "\\*",
            "*/",
            "///",
            "//",
            "<//",
            "<!==",
            "</>",
            "-->",
            "/>",
            ";;",
            "::",
            ":::",
            "..",
            "...",
            "..<",
            "!!",
            "??",
            "%%",
            "&&",
            "||",
            "?.",
            "?:",
            "+",
            "++",
            "+++",
            "-",
            "--",
            "---",
            "*",
            "**",
            "***",
            "~=",
            "~-",
            "www",
            "-~",
            "~@",
            "^=",
            "?=",
            "/=",
            "/==",
            "|=",
            "||=",
            "#!",
            "##",
            "###",
            "####",
            "#{",
            "#[",
            "]#",
            "#(",
            "#?",
            "#_",
            "#_(",
        ]

        ]
    const decoration = vscode.window.createTextEditorDecorationType({ color: "" });
    vscode.window.onDidChangeTextEditorSelection((event) => {
        const editor = event.textEditor;
        const set = new Set<number>();
        event.selections.forEach((selection) => {
            set.add(selection.start.line);
            set.add(selection.end.line);
        });

        const ranges: vscode.Range[] = [];

        set.forEach((lineNumber) => {
            const range = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber + 1, 0));
            const lineLength = editor.document.getText(range).length;
            for (let i = 0; i < lineLength; i++) {
                ranges.push(new vscode.Range(lineNumber, i, lineNumber, i + 1));
            }
        });

        editor.setDecorations(decoration, ranges);
    }, null, context.subscriptions);
}
