// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("hussam-dart-name-fixer.fix", async () =>
    fixNames().then(() =>
      vscode.window.showInformationMessage(
        "Names Fixed Successfully!, Please check the changes."
      )
    )
  );
}

const capitalLettersOrNumbersRegex = /[A-Z0-9]/g;

async function fixNames() {
  const filesUris = vscode.workspace.findFiles("lib/**/**.{dart,g.dart}");
  await filesUris.then(async (uris) => {
    for (const uri of uris) {
      const currentFilePath = vscode.workspace.asRelativePath(uri);
      const oldFileName = uri.path.split("/").pop() ?? "";
      const absoluteFilePath = uri.path.split("lib")[0];

      if (capitalLettersOrNumbersRegex.test(currentFilePath)) {
        const middleFilePath = currentFilePath.replace(
          capitalLettersOrNumbersRegex,
          (match) => `_${match.toLowerCase()}`
        );

        const fileName =
          middleFilePath.split("/")[middleFilePath.split("/").length - 1];

        const finalPath = fileName.startsWith("_")
          ? middleFilePath.replace(fileName, fileName.substring(1))
          : middleFilePath;

        const path = finalPath
          .split("/")
          .map((p) => (p.startsWith("_") ? p.substring(1) : p))
          .join("/");

        console.log(path);

        vscode.window.showInformationMessage(oldFileName);

        const newFile = vscode.Uri.file(absoluteFilePath + path);

        vscode.workspace.fs.rename(uri, newFile, { overwrite: true });

        const finalOldName = oldFileName.replace(".dart", "").replace(".g", "");
        const finalNewName = fileName
          .replace(".dart", "")
          .replace(".g", "")
          .replace("_", "");
        console.log(finalOldName, finalNewName);

        await replaceTextInFiles(finalOldName, finalNewName);
      }
    }
  });
}
async function replaceTextInFiles(oldText: string, newText: string) {
  const filesUris = await vscode.workspace.findFiles("lib/**/**.dart");
  const lineRegex = /^(import|part|part of)\s+['"][^'"]*['"]/;

  for (const uri of filesUris) {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();
    const lines = text.split("\n");
    const edits: [vscode.Range, string][] = [];

    lines.forEach((line, i) => {
      if (lineRegex.test(line) && line.includes(oldText)) {
        const updatedLine = line.replace(oldText, newText);
        edits.push([
          new vscode.Range(
            new vscode.Position(i, 0),
            new vscode.Position(i, line.length)
          ),
          updatedLine,
        ]);
      }
    });

    const edit = new vscode.WorkspaceEdit();
    edits.forEach(([range, newText]) => edit.replace(uri, range, newText));

    await vscode.workspace.applyEdit(edit);
    await document.save();
  }
}
