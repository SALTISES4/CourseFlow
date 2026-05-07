# Cursor / agent instructions (project)

Use this file as a **paste-in appendix** for Cursor chat or cloud prompts. **Authoritative machine-readable rules** for the workspace also live under [`.cursor/rules/`](../.cursor/rules/).

## Preserve developer comments

- **Do not delete or remove** developer comments, questions, uncertainty notes (e.g. “not sure about this”), TODOs, or FIXMEs—unless the user **explicitly** asks to remove or rewrite them.
- **Do not** assume such comments are obsolete or irrelevant.
- **Allowed:** add new comments when useful; **edit comments only** when a code change makes the old wording factually wrong (e.g. after a rename). When in doubt, **keep the comment** or ask the user.

See also: [`.cursor/rules/preserve-developer-comments.mdc`](../.cursor/rules/preserve-developer-comments.mdc).
