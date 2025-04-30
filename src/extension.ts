import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

function checkShellAvailability(shell: string): boolean {
  try {
    // Check if shell exists by running the command with --version flag
    child_process.execSync(`${shell} --version`, { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.commands.registerCommand(
    "workspaceLocalTerminal.setup",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const vscodeDir = path.join(rootPath, ".vscode");
      const settingsPath = path.join(vscodeDir, "settings.json");

      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir);
      }

      // Shell options with availability check
      const shellOptions = ["Bash", "Zsh", "Fish"];
      const availableShells = shellOptions.filter((shell) =>
        checkShellAvailability(shell.toLowerCase())
      );

      if (availableShells.length === 0) {
        vscode.window.showErrorMessage(
          "No available shells (Bash, Zsh, or Fish) found on your system."
        );
        return;
      }
      // If only one shell is available, skip the selection prompt
      const selectedShell =
        availableShells.length === 1
          ? availableShells[0]
          : await vscode.window.showQuickPick(availableShells, {
            placeHolder: "Select your preferred shell",
          });

      if (!selectedShell) {
        vscode.window.showErrorMessage("No shell selected.");
        return;
      }

      // Capitalize profileName
      const profileName = `${selectedShell.toLowerCase()}-ws-local`;

      // Generate shell config based on selection
      let shellConfig = "";
      let historyFile = "";
      let rcFile = "";
      switch (selectedShell) {
        case "Zsh":
          rcFile = ".zshrc";
          historyFile = `.zsh_history`;
          shellConfig = `
[ -f ~/.zshrc ] && source ~/.zshrc
export HISTFILE="$PWD/.vscode/${historyFile}"
export HISTSIZE=10000
export SAVEHIST=20000
autoload -Uz add-zsh-hook
add-zsh-hook precmd history -a
echo "Workspace Local Terminal"
        `.trim();
          break;
        case "Fish":
          rcFile = "config.fish";
          historyFile = `fish_history`;
          shellConfig = `
set -gx fish_history "$PWD/.vscode/${historyFile}"
set -g history_size 10000
set -g history_file "$PWD/.vscode/${historyFile}"
echo "Workspace Local Terminal" "$HISTFILE"
        `.trim();
          break;
        default: // Bash
          rcFile = ".bashrc";
          historyFile = `.bash_history`;
          shellConfig = `
[ -f ~/.bashrc ] && source ~/.bashrc
HISTFILE="$PWD/.vscode/${historyFile}"
HISTSIZE=10000
HISTFILESIZE=20000
HISTCONTROL=ignoreboth
trap 'history -a' EXIT
echo "Workspace Local Terminal" "$HISTFILE"
        `.trim();
          break;
      }

      // Write shell-specific config file
      const shellConfigPath = path.join(vscodeDir, rcFile);
      fs.writeFileSync(shellConfigPath, shellConfig);

      // Ensure the history file exists
      const historyPath = path.join(vscodeDir, historyFile);
      if (!fs.existsSync(historyPath)) {
        fs.writeFileSync(historyPath, "");
      }

      // Update settings.json for the selected shell
      let settings: Record<string, any> = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      }

      settings = {
        ...settings,
        "terminal.integrated.profiles.linux": {
          ...(settings["terminal.integrated.profiles.linux"] || {}),
          [profileName]: {
            path: selectedShell === "Fish" ? "/usr/bin/fish" : "/bin/bash",
            args:
              selectedShell === "Fish"
                ? [
                  "--init-command",
                  "set -gx fish_history $PWD/.vscode/" + historyFile,
                ]
                : ["--rcfile", `\${workspaceFolder}/.vscode/${rcFile}`],
          },
        },
        "terminal.integrated.defaultProfile.linux": profileName,
      };

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

      vscode.window.showInformationMessage(
        `Workspace ${selectedShell} History configured!`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() { }
