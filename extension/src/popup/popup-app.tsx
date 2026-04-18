import { clsx } from 'clsx';
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type {
  SessionPassport,
  SessionSummary,
  SupportedPlatform,
  UserPreferences,
  UserProfile,
} from '@context-passport/shared';
import { APP_NAME, DEFAULT_PREFERENCES, SUPPORTED_PLATFORMS } from '@context-passport/shared';
import {
  ArrowRight,
  Bot,
  Download,
  LogOut,
  RefreshCcw,
  Save,
  Search,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { isExtensionApiAvailable, sendMessage } from '../utils/chrome';
import { signInWithGoogle } from '../utils/firebase';
import { buildSessionMarkdown, triggerDownload } from '../utils/session-export';

interface AppState {
  user: UserProfile | null;
  sessions: SessionSummary[];
  preferences: UserPreferences;
}

interface ToastState {
  kind: 'success' | 'error';
  message: string;
}

interface RuntimeResponse<T> {
  success: boolean;
  data: T;
}

type SessionDetail = SessionSummary & {
  passport: SessionPassport;
  rawHistory: Array<{ role: string; content: string }>;
};

const previewMode = !isExtensionApiAvailable();
const emptyState: AppState = { user: null, sessions: [], preferences: DEFAULT_PREFERENCES };
const platformOptions: Array<SupportedPlatform | 'all'> = ['all', ...SUPPORTED_PLATFORMS];
const platformMeta: Record<SupportedPlatform, { label: string; short: string; tone: string }> = {
  claude: { label: 'Claude', short: 'Cl', tone: 'from-orange-400/25 to-orange-200/10 text-orange-100' },
  chatgpt: { label: 'ChatGPT', short: 'Cg', tone: 'from-emerald-400/25 to-emerald-200/10 text-emerald-100' },
  gemini: { label: 'Gemini', short: 'Ge', tone: 'from-sky-400/25 to-sky-200/10 text-sky-100' },
  perplexity: { label: 'Perplexity', short: 'Px', tone: 'from-cyan-400/25 to-cyan-200/10 text-cyan-100' },
  copilot: { label: 'Copilot', short: 'Co', tone: 'from-indigo-400/25 to-indigo-200/10 text-indigo-100' },
  grok: { label: 'Grok', short: 'Gr', tone: 'from-fuchsia-400/25 to-fuchsia-200/10 text-fuchsia-100' },
};

const formatRelative = (value: string) => {
  const diff = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, size] of ranges) {
    if (Math.abs(diff) >= size || unit === 'minute') {
      return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(diff / size), unit);
    }
  }

  return 'just now';
};

export const PopupApp = () => {
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SupportedPlatform | 'all'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const deferredSearch = useDeferredValue(search);

  const showToast = (next: ToastState) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 2600);
  };

  const refreshState = async () => {
    try {
      setLoading(true);
      const response = await sendMessage<RuntimeResponse<AppState>>({ type: 'GET_APP_STATE' });
      startTransition(() => {
        setState(response.data);
        setLoading(false);
      });
    } catch (error) {
      setLoading(false);
      showToast({ kind: 'error', message: error instanceof Error ? error.message : 'Refresh failed.' });
    }
  };

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.theme === 'dark');
  }, [state.preferences.theme]);

  const filteredSessions = useMemo(() => {
    const query = deferredSearch.toLowerCase();
    return state.sessions.filter((session) => {
      const platformMatch = platformFilter === 'all' || session.platform === platformFilter;
      const haystack = `${session.title} ${session.entities.projectName} ${session.entities.nextStep} ${session.tags.join(' ')}`.toLowerCase();
      return platformMatch && (!query || haystack.includes(query));
    });
  }, [deferredSearch, platformFilter, state.sessions]);

  const stats = useMemo(
    () => ({
      sessions: state.sessions.length,
      resumes: state.user?.totalResumes ?? 0,
      platforms: new Set(state.sessions.map((session) => session.platform)).size,
    }),
    [state.sessions, state.user],
  );

  const savePreferences = async (payload: Partial<UserPreferences>) => {
    const preferences = { ...state.preferences, ...payload };
    await sendMessage<RuntimeResponse<UserProfile>>({ type: 'UPDATE_PREFERENCES', payload: preferences });
    setState((current) => ({
      ...current,
      preferences,
      user: current.user ? { ...current.user, preferences } : current.user,
    }));
  };

  const handleSignIn = async () => {
    const auth = await signInWithGoogle();
    await sendMessage<RuntimeResponse<UserProfile>>({ type: 'SET_AUTH', payload: auth });
    await refreshState();
    showToast({ kind: 'success', message: previewMode ? 'Preview unlocked.' : 'Signed in.' });
  };

  const handleSave = async () => {
    await sendMessage<RuntimeResponse<SessionSummary>>({ type: 'SAVE_ACTIVE_TAB_CHAT' });
    await refreshState();
    showToast({ kind: 'success', message: previewMode ? 'Preview session captured.' : 'Current chat saved.' });
  };

  const handleExport = async (id: string) => {
    const response = await sendMessage<RuntimeResponse<SessionDetail>>({ type: 'GET_SESSION_DETAIL', payload: { id } });
    const markdown = buildSessionMarkdown(response.data);
    triggerDownload(`${response.data.title.replace(/\s+/g, '-').toLowerCase()}.md`, markdown, 'text/markdown');
    showToast({ kind: 'success', message: 'Session exported.' });
  };

  const handleResume = async (id: string) => {
    await sendMessage<RuntimeResponse<string>>({ type: 'RESUME_SESSION', payload: { id } });
    showToast({ kind: 'success', message: previewMode ? 'Passport generated.' : 'Passport injected.' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this saved passport?')) {
      return;
    }

    await sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'DELETE_SESSION', payload: { id } });
    await refreshState();
    showToast({ kind: 'success', message: 'Session deleted.' });
  };

  const openOptions = () => {
    if (globalThis.chrome?.runtime?.openOptionsPage) {
      void globalThis.chrome.runtime.openOptionsPage();
      return;
    }

    window.open('/options.html', '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="h-[600px] w-[400px] p-4">
        <div className="premium-panel flex h-full flex-col gap-4 p-4">
          <div className="h-24 rounded-[24px] bg-white/5" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="metric-tile h-24 animate-pulse bg-white/5" />
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="premium-elevated h-32 animate-pulse bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="h-[600px] w-[400px] p-4 text-[var(--text-primary)]">
        <div className="premium-panel surface-grid relative flex h-full flex-col justify-between overflow-hidden p-5">
          <div className="absolute right-[-40px] top-[-24px] h-40 w-40 rounded-full bg-[var(--accent-soft)] blur-3xl" />
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
                {APP_NAME}
              </div>
              <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                {previewMode ? 'Preview' : 'Live'}
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.04em]">
                Premium AI session continuity for serious builders.
              </h1>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Turn raw conversations into resumable passports with project context, decisions, files, and next-step clarity.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                'Switch tools or accounts without losing momentum.',
                'Resume with project state, not just a summary.',
                'Use the browser preview to demo the full product surface.',
              ].map((item) => (
                <div key={item} className="premium-elevated flex items-center gap-3 p-3">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm text-[var(--text-secondary)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => void handleSignIn()}
            className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-3.5 font-semibold text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)]"
          >
            <Sparkles className="h-4 w-4" />
            {previewMode ? 'Open interactive preview' : 'Sign in with Google'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-[400px] p-4 text-[var(--text-primary)]">
      <div className="premium-panel surface-glow relative flex h-full flex-col overflow-hidden p-4">
        {toast ? (
          <div
            className={clsx(
              'absolute right-4 top-4 z-20 rounded-[18px] border px-4 py-3 text-sm backdrop-blur',
              toast.kind === 'success' ? 'border-emerald-300/20 bg-emerald-400/15' : 'border-rose-300/20 bg-rose-400/15',
            )}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
                {APP_NAME}
              </div>
              <div className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]', previewMode ? 'bg-[var(--warning-soft)]' : 'bg-[var(--success-soft)]')}>
                {previewMode ? 'Preview mode' : 'Extension live'}
              </div>
            </div>
            <div className="mt-2 text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">Command surface</div>
            <h1 className="mt-1 text-[19px] font-semibold tracking-[-0.03em]">Welcome back, {state.user.displayName.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar user={state.user} />
            <button onClick={openOptions} className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-elevated)] p-2">
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => void sendMessage<RuntimeResponse<null>>({ type: 'LOG_OUT' }).then(() => setState(emptyState))}
              className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-elevated)] p-2"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="premium-elevated mt-4 rounded-[28px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                <span className="pulse-ring h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                Session continuity ready
              </div>
              <h2 className="mt-3 text-[22px] font-semibold leading-[1.04] tracking-[-0.04em]">
                Resume work with project memory already organized.
              </h2>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/10 px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Last active</div>
              <div className="mt-1 text-sm font-semibold">{formatRelative(state.user.lastActiveAt)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Sessions" value={String(stats.sessions)} detail="saved context" />
            <Metric label="Resumes" value={String(stats.resumes)} detail="handoffs done" />
            <Metric label="Platforms" value={String(stats.platforms)} detail="tools covered" />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => void handleSave()}
            className="flex items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-3.5 font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            Save current chat
          </button>
          <button
            onClick={() => void refreshState()}
            className="flex items-center justify-center gap-2 rounded-[22px] border border-[var(--surface-border)] bg-[var(--surface-elevated)] px-4 py-3.5 font-semibold"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh sync
          </button>
        </section>

        <section className="premium-elevated mt-4 rounded-[24px] p-3">
          <div className="grid grid-cols-2 gap-3">
            <ToggleCard
              label="Auto-capture"
              detail={state.preferences.autoCaptureTrigger === 'limit-detected' ? 'Limit detection' : 'Manual only'}
              active={state.preferences.autoCapture}
              onClick={() => void savePreferences({ autoCapture: !state.preferences.autoCapture })}
            />
            <ToggleCard
              label="Auto-inject"
              detail={state.preferences.autoInjectBehavior === 'always' ? 'Always restore' : 'Ask first'}
              active={state.preferences.autoInject}
              onClick={() => void savePreferences({ autoInject: !state.preferences.autoInject })}
            />
          </div>
        </section>

        <section className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by project, tag, or next step"
              className="premium-input pl-11"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {platformOptions.map((platform) => (
              <button
                key={platform}
                data-active={platformFilter === platform}
                onClick={() => setPlatformFilter(platform)}
                className="segmented-pill shrink-0"
              >
                {platform === 'all' ? 'All tools' : platformMeta[platform].label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 flex-1 overflow-y-auto pr-1">
          {filteredSessions.length === 0 ? (
            <div className="premium-elevated flex h-full flex-col items-center justify-center rounded-[28px] p-6 text-center">
              <Bot className="h-8 w-8 text-[var(--accent)]" />
              <div className="mt-4 text-lg font-semibold">No passports in this view</div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Save the current chat or widen your filters to surface stored project continuity.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onResume={() => void handleResume(session.id)}
                  onExport={() => void handleExport(session.id)}
                  onDelete={() => void handleDelete(session.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const Avatar = ({ user }: { user: UserProfile }) => (
  user.photoURL ? (
    <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full border border-white/10 object-cover" />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--surface-elevated)] text-sm font-semibold">
      {user.displayName.slice(0, 1).toUpperCase()}
    </div>
  )
);

const Metric = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <div className="metric-tile">
    <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</div>
    <div className="mt-2 text-[22px] font-semibold tracking-[-0.04em]">{value}</div>
    <div className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</div>
  </div>
);

const ToggleCard = ({
  label,
  detail,
  active,
  onClick,
}: {
  label: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'rounded-[22px] border p-3 text-left transition',
      active ? 'border-blue-300/20 bg-[var(--accent-soft)]' : 'border-[var(--surface-border)] bg-black/10',
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</div>
      </div>
      <div className={clsx('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]', active ? 'bg-black/20' : 'bg-white/5 text-[var(--text-muted)]')}>
        {active ? 'On' : 'Off'}
      </div>
    </div>
  </button>
);

const SessionCard = ({
  session,
  onResume,
  onExport,
  onDelete,
}: {
  session: SessionSummary;
  onResume: () => void;
  onExport: () => void;
  onDelete: () => void;
}) => {
  const meta = platformMeta[session.platform];

  return (
    <article className="premium-elevated rounded-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br text-sm font-semibold', meta.tone)}>
            {meta.short}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                {meta.label}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{formatRelative(session.updatedAt)}</span>
            </div>
            <h2 className="mt-2 text-[15px] font-semibold leading-6 tracking-[-0.02em]">{session.title}</h2>
            <div className="mt-1 text-sm text-[var(--text-secondary)]">{session.entities.projectName}</div>
          </div>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-black/10 px-3 py-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Messages</div>
          <div className="mt-1 text-sm font-semibold">{session.messageCount}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Where we left off</div>
          <div className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{session.entities.lastAction}</div>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Next step</div>
          <div className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{session.entities.nextStep}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
        <button
          onClick={onResume}
          className="flex items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-3 text-sm font-semibold text-white"
        >
          Resume session
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={onExport} className="rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface-elevated)] px-3 py-3">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface-elevated)] px-3 py-3">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};
