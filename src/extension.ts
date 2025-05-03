import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

function checkShellAvailability(shell: string): boolean {
  try {
    // Special check for PowerShell
    if (shell.toLowerCase() === "powershell") {
      child_process.execSync("pwsh --version", { stdio: "ignore" });
    } else {
      child_process.execSync(`${shell} --version`, { stdio: "ignore" });
    }
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

      // Updated shell options with PowerShell
      const shellOptions = ["Bash", "Zsh", "Fish", "PowerShell"];
      const availableShells = shellOptions.filter((shell) => {
        const shellName = shell.toLowerCase();
        if (shellName === "powershell") {
          return checkShellAvailability("pwsh") || checkShellAvailability("powershell");
        }
        return checkShellAvailability(shellName);
      });

      if (availableShells.length === 0) {
        vscode.window.showErrorMessage(
          "No available shells (Bash, Zsh, Fish, or PowerShell) found on your system."
        );
        return;
      }

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

      const profileName = `${selectedShell.toLowerCase()}-ws-local`;

      // Generate shell config based on selection
      let shellConfig = "";
      let historyFile = "";
      let rcFile = "";
      let shellPath = "";
      let shellArgs: string[] = [];

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
          shellPath = "/bin/zsh";
          shellArgs = ["--rcfile", `\${workspaceFolder}/.vscode/${rcFile}`];
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
          shellPath = "/usr/bin/fish";
          shellArgs = [
            "--init-command",
            "set -gx fish_history $PWD/.vscode/" + historyFile,
          ];
          break;

        case "PowerShell":
          rcFile = "profile.ps1";
          historyFile = `powershell_history`;
          shellConfig = `
# Load user's profile if it exists
if (Test-Path -Path $PROFILE) { . $PROFILE }
# Set workspace-specific history
Set-PSReadLineOption -HistorySavePath "$PWD\\.vscode\\${historyFile}"
Set-PSReadLineOption -MaximumHistoryCount 10000
Write-Host "Workspace Local PowerShell Terminal"
`.trim();
          // Try pwsh first, fall back to powershell
          shellPath = checkShellAvailability("pwsh") ? "pwsh" : "powershell";
          shellArgs = [
            "-NoExit",
            "-Command",
            `Set-PSReadLineOption -HistorySavePath "$PWD\\.vscode\\${historyFile}"`,
          ];
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
          shellPath = "/bin/bash";
          shellArgs = ["--rcfile", `\${workspaceFolder}/.vscode/${rcFile}`];
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

      // Windows/Linux/macOS profile configuration
      const profilesKey = process.platform === "win32"
        ? "terminal.integrated.profiles.windows"
        : "terminal.integrated.profiles.linux";

      settings = {
        ...settings,
        [profilesKey]: {
          ...(settings[profilesKey] || {}),
          [profileName]: {
            path: shellPath,
            args: shellArgs,
          },
        },
        "terminal.integrated.defaultProfile.linux": profileName,
        "terminal.integrated.defaultProfile.windows": profileName,
        "terminal.integrated.defaultProfile.osx": profileName,
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