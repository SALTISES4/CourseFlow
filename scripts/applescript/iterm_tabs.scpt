on run argv
    set repoRoot to item 1 of argv

    tell application "iTerm"
        activate

        if (count of windows) = 0 then
            create window with default profile
        end if

        tell current window
            tell current session
                write text "cd " & quoted form of repoRoot & " && just frontend-dev"
            end tell

            create tab with default profile
            tell session 1 of last tab
                write text "cd " & quoted form of repoRoot & " && just docker-logs"
            end tell
        end tell
    end tell
end run
