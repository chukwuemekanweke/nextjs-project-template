# Repository Instructions

## Third-party license notices

- Keep required third-party copyright and license notices in the relevant
  package-level license or notices file, such as `LICENSE.tailadmin` or
  `LICENSE.solid`.
- Do not add repetitive copyright, attribution, provenance, or license banners
  to individual source files when the applicable package-level notice already
  satisfies the dependency's license requirements.
- Preserve existing package-level third-party license and notices files when
  copying, adapting, packaging, or distributing third-party-derived work.
- Add a source-file notice only when the upstream license expressly requires
  one in that file or when legal guidance for the repository requires it.

## Pull request descriptions

- When generating a pull request title or description, always use the repository
  pull request template from `.github/pull_request_template.md` as the structure.
- Always return the description as Markdown and keep it ready to paste directly
  into GitHub or a PR editor.
- When summarizing changes for a branch, review all commits on that branch and
  reflect the full scope of work in the PR content.
- Use concise, professional language and tailor the summary to the actual files,
  features, and impact introduced by the branch.
- Prefer a title that clearly states the main change and affected area, such as
  `feat(scope): summary of the change`.

## Architecture documentation

- Treat the Markdown files under `docs/architecture/` as living descriptions of
  the architecture that is actually implemented in the repository.
- When implementing or materially changing an epic, review the affected
  architecture documents and update them in the same change when component
  ownership, package boundaries, runtime flow, configuration, dependencies,
  deployment boundaries, or developer extension points have changed.
- Describe current behaviour from the source code. Do not present planned epic
  work, placeholder navigation, or unimplemented integrations as existing
  architecture.
- When a later epic extends an earlier architectural area, refine the existing
  document instead of creating a competing explanation. Add a new document only
  when the epic introduces a genuinely separate architectural concern.
- Preserve historical reasoning that remains relevant, but remove or rewrite
  statements that the implementation has made inaccurate.
- Keep `docs/architecture/README.md` as the index and recommended reading order.
  Update it whenever an architecture document is added, removed, or renamed.
- Architecture documentation should explain responsibilities and interactions,
  not merely list files. Include concrete repository paths and short code
  examples where they make an abstraction easier to understand.
- Use Mermaid diagrams when they materially clarify application boundaries,
  dependency direction, composition, or runtime flow. Keep diagrams consistent
  with the source and avoid decorative diagrams.
- Record important constraints and ownership rules, including the distinction
  between application-specific composition under `apps/` and reusable
  infrastructure under `packages/`.
- For each completed epic, document the implemented outcome, major decisions,
  extension points, and any deliberate placeholders owned by future epics.
- Before finishing architecture-documentation changes, verify referenced paths,
  commands, package names, ports, and dependency relationships against the
  repository. Run relevant checks when documentation accompanies code changes.