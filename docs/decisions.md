# Decisions

| Area           | Choice                                                     | Why                                                                                                                      |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Architecture   | Static site, no backend                                    | Published on GitHub Pages; recipes change rarely and need no server.                                                     |
| Language       | TypeScript only                                            | No process boundary, so no second language or generated contracts. Types come from Zod via `z.infer`.                    |
| Schema         | Zod 4                                                      | Validates YAML in scripts and `catalog.json` in the browser; `z.toJSONSchema` gives editor schemas without another tool. |
| Data format    | YAML in block style, one folder per recipe                 | Readable and diffable. `yaml` library keeps comments, which the formatter relies on.                                     |
| Vocabularies   | Lists in `data/`, referenced by id                         | One language shared by recipes, UI and validation; labels and ordering are not in code.                                  |
| Derived values | Computed at runtime from taxonomy                          | Nutrition, schedule and shopping never go stale and are never stored twice.                                              |
| UI             | shadcn/ui (Radix, vega style) + Tailwind v4 + lucide-react | Required by the brief. Primitives live in `lib/ui`.                                                                      |
| Routing        | `react-router` hash router                                 | Deep links and refresh work on Pages with no server rewrites.                                                            |
| Scripts        | `tsx`                                                      | Runs the same TypeScript the app uses, including `lib/recipe/validate.ts`.                                               |
| Lint/format    | Biome (code), custom formatter (data)                      | Biome does not format YAML; `format-data` keeps block style consistent.                                                  |
| Tests          | Vitest + Testing Library                                   | Standard for Vite; logic and components are tested in `lib/`.                                                            |
| Mealie import  | Script flattens the backup, skill converts                 | Mealie ingredients are free text, so mapping them to the taxonomy needs judgement.                                       |
| Dev port       | OS-assigned (port 0)                                       | Never collides with another project on 5173.                                                                             |
