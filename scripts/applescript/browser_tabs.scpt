on run argv

    tell application "Google Chrome"
        activate

        set newWindow to make new window
        (* CF *)
        make new tab at end of tabs of newWindow with properties {URL:"http://localhost:5173/"}

        (* Flower Dashboard *)
        set URL of active tab of newWindow to "http://localhost:5555/"

        (* Kanchi dahsboard *)
        make new tab at end of tabs of newWindow with properties {URL:"http://localhost:3000/"}

        (* OPENAPI *)
        make new tab at end of tabs of newWindow with properties {URL:"http://127.0.0.1:8000/docs/"}

        set active tab index of newWindow to 1
    end tell

end run
