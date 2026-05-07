on run argv
    set repoRoot to item 1 of argv

    tell application "iTerm"
        activate

        if (count of windows) = 0 then
            set targetWindow to (create window with default profile)
        else
            set targetWindow to current window
        end if

        tell targetWindow
            tell current session
                write text "cd " & quoted form of repoRoot & " && just frontend-dev"
            end tell

            set dockerLogsTab to (create tab with default profile)
            tell current session of dockerLogsTab
                write text "cd " & quoted form of repoRoot & " && just docker-logs"
            end tell

        end tell
    end tell
end run
