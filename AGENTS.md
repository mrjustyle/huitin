<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:database-agent-rules -->
# Database & Code Modification Rules

Whenever you make any modifications to the code logic or the database (e.g., adding new features, modifying schema, fixing triggers, etc.), you MUST:
1. **Update the Migration Scripts**: If making DB changes, ensure that the `.sql` migration files in `supabase/migrations/` are fully updated so that a fresh database spin-up will have the exact same logic. Do NOT just execute SQL in the database without updating the scripts.
2. **Update the Documentation**: Update any relevant documentation (e.g., `ROADMAP.md`, `README.md`, or specific `.md` files in the docs if they exist) to reflect the new state, logic, or features.
<!-- END:database-agent-rules -->

<!-- BEGIN:docs-agent-rules -->
# System Knowledge & Documentation Rules (ALL DOMAINS)

This `AGENTS.md` file is strictly for high-level AI behavioral rules, NOT for detailed project documentation.

1. **Read Before Acting:** The `docs/` directory is the central knowledge base for this project. If you are asked to work on ANY domain (e.g., Authentication, Database, Core Logic, UI Components), you MUST first check the `docs/` folder for existing architectural guidelines (e.g., `docs/auth-architecture.md`) and read them.
2. **Document After Changing:** Whenever you implement a new feature, change an architectural pattern, or modify existing core logic in ANY domain, you MUST:
   - Update the existing markdown files in `docs/` or create a new one to reflect your changes.
   - Update the `README.md` to reflect any new high-level features or setup instructions.
   - Update the `ROADMAP.md` if a milestone or feature is completed.
   Do NOT leave the system undocumented.
<!-- END:docs-agent-rules -->
