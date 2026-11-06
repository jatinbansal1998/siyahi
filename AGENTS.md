# Siyahi: agent instructions

Siyahi is the shared component library and design language for The Book, Dash and other apps.

- **Design:** follow [DESIGN.md](DESIGN.md) for every component, example and catalogue page. It ships in the
  package as `@siyahi/ui/DESIGN.md`, and the `siyahi` skill sends consuming apps' agents to it, so a design rule
  belongs there, not in each app.
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) has the code rules (never edit shadcn core, registry
  headers, `pnpm generate`, `pnpm check`); [.claude/skills/release](.claude/skills/release/SKILL.md) has the release.
