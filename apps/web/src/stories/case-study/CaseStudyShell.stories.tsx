import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bell,
  Blocks,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const caseStudySteps = [
  {
    description: "Clarify the user pain, business context and product gap.",
    label: "Problem",
  },
  {
    description: "Capture comparable product behavior and workflow patterns.",
    label: "Research",
  },
  {
    description: "Map the main path, edge cases and recovery states.",
    label: "User Flow",
  },
  {
    description: "Explain data boundaries, API contracts and state ownership.",
    label: "Architecture",
  },
  {
    description: "Show UI tokens, component states and interaction rules.",
    label: "Design System",
  },
  {
    description:
      "Document loading, caching, rendering and scalability choices.",
    label: "Performance",
  },
  {
    description: "Close with trade-offs, lessons learned and next iteration.",
    label: "Retrospective",
  },
];

const featureCaseStudies = [
  {
    accent: "text-emerald-500",
    description:
      "Auth is the trust layer for a project workspace: login, refresh, protected routes and session recovery.",
    icon: KeyRound,
    sourceLabel: "Internal authentication case study notes",
    title: "Authentication",
  },
  {
    accent: "text-blue-500",
    description:
      "Projects and members define ownership, project access, removal cleanup and collaboration boundaries.",
    icon: Users,
    sourceLabel: "Internal projects and members case study notes",
    title: "Projects & Members",
  },
  {
    accent: "text-purple-500",
    description:
      "Kanban packages work hierarchy, grouping, drag-and-drop, quick creation and dense task scanning.",
    icon: ClipboardList,
    sourceLabel: "Internal Kanban case study notes",
    title: "Kanban",
  },
  {
    accent: "text-amber-500",
    description:
      "Notifications summarize collaboration events with snapshots, unread state and task navigation.",
    icon: Bell,
    sourceLabel: "Internal notification case study notes",
    title: "Notification",
  },
];

const detailedCaseStudies = [
  {
    accent: "text-emerald-500",
    architecture:
      "The frontend keeps session state behind an AuthProvider, while the API owns password validation, refresh tokens and /me recovery. Protected routes render only after the real session has been checked.",
    decisions: [
      "Replace mock login with real API authentication so incorrect passwords cannot enter the app.",
      "Recover the current user after refresh instead of trusting stale local UI state.",
      "Keep logout simple and visible from the user menu, because auth failure should feel recoverable.",
    ],
    icon: KeyRound,
    outcome:
      "The trust promise is easy to verify: wrong password fails, refresh keeps the session, and logout clears the app context.",
    problem:
      "A project tool loses credibility if any password works or a reload forgets who the user is. Authentication had to feel boring in the best way: predictable, secure enough for a portfolio product and hard to misunderstand.",
    proof: [
      "Login error state",
      "Refresh recovery",
      "Protected routes",
      "User menu logout",
    ],
    retrospective:
      "The biggest lesson was that auth is UX, not only security. The interface had to explain what happened without exposing implementation details.",
    title: "Authentication",
    tradeoff:
      "The implementation avoids advanced enterprise auth for now, focusing on a clean token contract that can later support invitations, roles and SSO.",
    userFlow:
      "The user signs in, lands in the workspace, refreshes without losing context, and can safely leave through logout.",
  },
  {
    accent: "text-blue-500",
    architecture:
      "Projects, members and users are separated in the API so one user can belong to many projects. The UI reads project membership to drive filters, assignee dropdowns and member management.",
    decisions: [
      "Show owner first so project accountability is clear before scanning the rest of the team.",
      "Allow removing a member only through an explicit confirmation that explains task reassignment.",
      "Keep historical activity readable even after a user leaves the project.",
    ],
    icon: Users,
    outcome:
      "The project shell now behaves like a collaborative space: users can be added, counted, inspected, removed and reflected across task assignment controls.",
    problem:
      "A workspace is not useful until ownership and access are visible. The app needed a way to explain who belongs to a project, what they can touch and what happens when someone leaves.",
    proof: [
      "Project member dialog",
      "Add people flow",
      "Owner/member roles",
      "Removal cleanup",
    ],
    retrospective:
      "Membership touched more UI than expected. The useful rule became: every place that shows people should use the same avatar and membership source.",
    title: "Projects & Members",
    tradeoff:
      "The first version keeps project roles simple. That made the interaction clear while leaving room for a deeper permission system in Saga 3.",
    userFlow:
      "A project owner opens the member list, adds a teammate, sees them appear in assignment controls, then removes them with a clear cleanup warning.",
  },
  {
    accent: "text-purple-500",
    architecture:
      "Kanban combines API-backed tasks, columns, hierarchy rules and optimistic UI. The board keeps drag state local while persisting final moves through workflow endpoints.",
    decisions: [
      "Treat epics, tasks, bugs and subtasks as different work item types with explicit hierarchy rules.",
      "Keep drag feedback lightweight so moving cards does not trigger unnecessary API calls.",
      "Make grouped views read-only for column reorder to avoid ambiguous cross-group behavior.",
    ],
    icon: ClipboardList,
    outcome:
      "The board supports dense daily work: quick create, drag across columns, group by assignee/epic/subtask and open detail without losing context.",
    problem:
      "Kanban is where users spend the most time. It needed to feel fast under heavy interaction while still respecting complex work hierarchy and API persistence.",
    proof: [
      "Column drag",
      "Work item drag",
      "Group modes",
      "Quick create",
      "Task detail",
    ],
    retrospective:
      "The hard part was not rendering cards. It was removing tiny sources of jitter, stale state and confusing placeholder feedback until the board felt calm.",
    title: "Kanban",
    tradeoff:
      "The board stays custom for now because the current behavior is stable. A future library migration remains optional rather than required.",
    userFlow:
      "A user creates work, moves it through columns, changes grouping to understand ownership, then opens a task for status, comments and activity history.",
  },
  {
    accent: "text-amber-500",
    architecture:
      "The backend stores notification type, actor, recipient and metadata snapshots. The frontend renders human-readable copy from those facts so old notifications stay meaningful.",
    decisions: [
      "Use snapshot metadata for task code, title and status so old notifications do not drift when the task later changes.",
      "Group repeated updates by task to reduce noise while preserving the timeline when expanded.",
      "Mark read and unread filtering stay in the dropdown because a full notification page is not necessary yet.",
    ],
    icon: Bell,
    outcome:
      "Velora now feels collaborative: assignment, comments, membership and task changes create readable notifications that lead back to the relevant task or project.",
    problem:
      "Collaboration breaks down when users must inspect every project manually. Notifications needed to answer who did what, where it happened and whether it requires attention.",
    proof: [
      "Unread badge",
      "Grouped updates",
      "Task navigation",
      "Mark all read",
      "Responsive dropdown",
    ],
    retrospective:
      "Notification copy mattered as much as the data model. Small wording changes made the experience feel less robotic and more like a teammate updating you.",
    title: "Notification Center",
    tradeoff:
      "Polling and a dropdown-first interface keep the feature lightweight. Realtime delivery and a dedicated archive can arrive when notification volume proves the need.",
    userFlow:
      "A teammate changes a task, the recipient sees an unread badge, opens the dropdown, expands grouped updates, then clicks the task title to jump back into work.",
  },
];

const evidenceCards = [
  {
    icon: LayoutDashboard,
    label: "UI evidence",
    text: "Use Product stories for actual component states instead of duplicating screenshots.",
  },
  {
    icon: GitBranch,
    label: "Decision trail",
    text: "Reference architecture and trade-off notes when the story needs implementation depth.",
  },
  {
    icon: Palette,
    label: "Design system",
    text: "Tie each case study to shared tokens, avatar rules, spacing and interactive states.",
  },
  {
    icon: Zap,
    label: "Performance",
    text: "Call out optimistic updates, local state boundaries and expensive interaction fixes.",
  },
];

const meta = {
  title: "Case Study/Foundation",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A reusable case study shell for turning internal notes into polished Storybook narratives without duplicating long markdown content.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function CaseStudyCard({
  study,
}: {
  study: (typeof detailedCaseStudies)[number];
}) {
  const Icon = study.icon;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-muted p-3">
            <Icon className={`size-5 ${study.accent}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Feature case study
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">
              {study.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {study.problem}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 border-border p-6 md:border-r">
          <div>
            <h4 className="text-sm font-semibold text-foreground">User flow</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {study.userFlow}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Architecture choice
            </h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {study.architecture}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Trade-off</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {study.tradeoff}
            </p>
          </div>
        </div>

        <div className="space-y-5 bg-muted/30 p-6">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Product decisions
            </h4>
            <ul className="mt-3 space-y-2">
              {study.decisions.map((decision) => (
                <li
                  key={decision}
                  className="flex gap-2 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              UI proof points
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {study.proof.map((proof) => (
                <span
                  key={proof}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {proof}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <h4 className="text-sm font-semibold text-foreground">Outcome</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {study.outcome}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background p-6">
        <h4 className="text-sm font-semibold text-foreground">Retrospective</h4>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {study.retrospective}
        </p>
      </div>
    </article>
  );
}

export const NarrativeShell: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-8 py-10">
        <section className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Velora case study system"
              title="A repeatable story structure for Saga 1-2 features"
              description="This shell turns internal product notes into a public-facing story, then uses Storybook to show inspectable UI evidence."
            />
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border bg-background p-4">
                <Sparkles className="mb-3 size-5 text-primary" />
                <div className="font-semibold">Portfolio ready</div>
                <div className="mt-1 text-muted-foreground">
                  Clear narrative, real UI states.
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <ShieldCheck className="mb-3 size-5 text-primary" />
                <div className="font-semibold">Regression aware</div>
                <div className="mt-1 text-muted-foreground">
                  Stories double as UI checks.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Narrative flow"
            title="Problem to retrospective"
            description="Every feature case study follows the same seven-part arc, so the story feels consistent even when the underlying feature is technical."
          />

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
            {caseStudySteps.map((step, index) => (
              <div
                key={step.label}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="font-semibold">{step.label}</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Saga 1-2 feature set"
            title="Case studies ready for product review"
            description="15.5 fills the shell with concrete feature narratives while keeping private notes out of the public Storybook UI."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {featureCaseStudies.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-3">
                      <Icon className={`size-5 ${feature.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                      <div className="mt-3 rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
                        {feature.sourceLabel}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            eyebrow="Evidence model"
            title="What Storybook should show"
            description="The story should stay visual and inspectable. Long prose remains in private notes; Storybook highlights the proof points."
          />

          <div className="grid gap-4 md:grid-cols-4">
            {evidenceCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <Icon className="mb-4 size-5 text-primary" />
                  <div className="font-semibold">{card.label}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {card.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
          <div className="flex items-start gap-4">
            <Blocks className="mt-1 size-5 text-primary" />
            <div>
              <h3 className="font-semibold">Source of truth rule</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Storybook should read from internal documentation first, then
                inspect source code only when it needs exact component API or
                behavior. Public stories should explain product decisions
                without exposing private file structure.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  ),
};

export const FeatureMap: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <SectionHeading
          eyebrow="Case study index"
          title="Feature story map"
          description="A compact map for deciding which feature story to open or update after a large phase changes product behavior."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {featureCaseStudies.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
              >
                <Icon className={`mt-1 size-5 ${feature.accent}`} />
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    {feature.sourceLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ),
};

function ProductNarrativesStory() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 py-10">
        <section className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <SectionHeading
            eyebrow="Saga 1-2 case studies"
            title="Four product stories with implementation evidence"
            description="These cards present each feature as a product story: clear user problem, visible product decisions, credible engineering trade-offs and a short retrospective."
          />
        </section>

        <div className="space-y-6">
          {detailedCaseStudies.map((study) => (
            <CaseStudyCard key={study.title} study={study} />
          ))}
        </div>
      </main>
    </div>
  );
}

export const RecruiterNarratives: Story = {
  name: "Product Narratives",
  render: () => <ProductNarrativesStory />,
};
