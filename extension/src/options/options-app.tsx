import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { SessionPassport, SessionSummary, UserPreferences, UserProfile } from '@context-passport/shared';
import { APP_NAME, DEFAULT_PREFERENCES } from '@context-passport/shared';
import {
  AlertTriangle,
  Database,
  Download,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  WandSparkles,
} from 'lucide-react';
import { isExtensionApiAvailable, sendMessage } from '../utils/chrome';
import { triggerDownload } from '../utils/session-export';

interface OptionsState {
  user: UserProfile | null;
  sessions: SessionSummary[];
  preferences: UserPreferences;
}

interface RuntimeResponse<T> {
  success: boolean;
  data: T;
}

interface ToastState {
  kind: 'success' | 'error';
  message: string;
}

type SessionDetail = SessionSummary & {
  passport: SessionPassport;
  rawHistory: Array<{ role: string; content: string }>;
};

const previewMode = !isExtensionApiAvailable();
const defaultState: OptionsState = {
  user: null,
  sessions: [],
  preferences: DEFAULT_PREFERENCES,
};

const expiryOptions: Array<{ value: UserPreferences['sessionExpiryDays']; label: string }> = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: -1, label: 'Never' },
];

export const OptionsApp = () => {
  const [state, setState] = useState<OptionsState>(defaultState);
  const [toast, setToast] = useState<ToastState | null>(null);

  const refresh = async () => {
    const response = await sendMessage<RuntimeResponse<OptionsState>>({ type: 'GET_APP_STATE' });
    setState(response.data);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.theme === 'dark');
  }, [state.preferences.theme]);

  const showToast = (next: ToastState) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 2600);
  };

  const usage = useMemo(
    () => ({
      sessions: state.sessions.length,
      resumes: state.user?.totalResumes ?? 0,
      platforms: new Set(state.sessions.map((session) => session.platform)).size,
    }),
    [state.sessions, state.user],
  );

  const updatePreferences = async (payload: Partial<UserPreferences>) => {
    const preferences = { ...state.preferences, ...payload };
    await sendMessage<RuntimeResponse<UserProfile>>({ type: 'UPDATE_PREFERENCES', payload: preferences });
    setState((current) => ({
      ...current,
      preferences,
      user: current.user ? { ...current.user, preferences } : current.user,
    }));
    showToast({ kind: 'success', message: 'Preferences updated.' });
  };

  const exportAllData = async () => {
    const details = await Promise.all(
      state.sessions.map(async (session) => {
        const response = await sendMessage<RuntimeResponse<SessionDetail>>({
          type: 'GET_SESSION_DETAIL',
          payload: { id: session.id },
        });
        return response.data;
      }),
    );

    triggerDownload(
      'context-passport-export.json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          preferences: state.preferences,
          sessions: details,
        },
        null,
        2,
      ),
      'application/json',
    );

    showToast({ kind: 'success', message: 'Export generated.' });
  };

  const deleteAllData = async () => {
    if (!window.confirm('Delete all saved sessions for this workspace?')) {
      return;
    }

    await Promise.all(
      state.sessions.map((session) =>
        sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'DELETE_SESSION', payload: { id: session.id } }),
      ),
    );

    await refresh();
    showToast({ kind: 'success', message: 'All sessions deleted.' });
  };

  return (
    <div className="min-h-screen px-6 py-8 text-[var(--text-primary)] md:px-8">
      <div className="mx-auto max-w-6xl">
        {toast ? (
          <div
            className={clsx(
              'mb-4 rounded-[18px] border px-4 py-3 text-sm backdrop-blur',
              toast.kind === 'success' ? 'border-emerald-300/20 bg-emerald-400/15' : 'border-rose-300/20 bg-rose-400/15',
            )}
          >
            {toast.message}
          </div>
        ) : null}

        <header className="premium-panel surface-glow p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {APP_NAME}
                </div>
                <div className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]', previewMode ? 'bg-[var(--warning-soft)]' : 'bg-[var(--success-soft)]')}>
                  {previewMode ? 'Preview mode' : 'Extension live'}
                </div>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
                Settings that feel like product operations, not browser extension leftovers.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Tune automation, restore behavior, data retention, and interface tone from one control plane built for people actively shipping across multiple AI tools.
              </p>
            </div>
            <div className="premium-elevated min-w-[260px] rounded-[26px] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Connected identity</div>
              <div className="mt-2 text-lg font-semibold">{state.user?.displayName ?? 'Preview operator'}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">{state.user?.email ?? 'founder@contextpassport.app'}</div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="premium-panel p-5">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Workspace health</div>
              <div className="mt-4 grid gap-3">
                <MetricTile label="Saved sessions" value={String(usage.sessions)} />
                <MetricTile label="Resumes completed" value={String(usage.resumes)} />
                <MetricTile label="Platforms in use" value={String(usage.platforms)} />
              </div>
            </section>

            <section className="premium-panel p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <div className="text-lg font-semibold">Trust posture</div>
              </div>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                Session payloads are designed to move as structured passports rather than loose summaries, which gives teams more control over continuity and storage policy.
              </div>
            </section>

            <section className="premium-panel p-5">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-[var(--accent)]" />
                <div className="text-lg font-semibold">Export center</div>
              </div>
              <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                Download everything tied to this workspace as a portable JSON archive.
              </div>
              <button
                onClick={() => void exportAllData()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)] px-4 py-3 font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                Export all sessions
              </button>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="premium-panel p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <div className="text-lg font-semibold">Automation controls</div>
                  <div className="text-sm text-[var(--text-secondary)]">Decide when capture happens and how restoration behaves on re-entry.</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ToggleCard
                  label="Auto-capture"
                  detail={state.preferences.autoCaptureTrigger === 'limit-detected' ? 'Capture when limits are detected' : 'Manual-only mode'}
                  active={state.preferences.autoCapture}
                  onClick={() => void updatePreferences({ autoCapture: !state.preferences.autoCapture })}
                />
                <ToggleCard
                  label="Auto-inject"
                  detail={state.preferences.autoInjectBehavior === 'always' ? 'Always restore on open' : 'Ask before injecting'}
                  active={state.preferences.autoInject}
                  onClick={() => void updatePreferences({ autoInject: !state.preferences.autoInject })}
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SelectCard
                  label="Compression level"
                  value={state.preferences.compressionLevel}
                  options={['fast', 'balanced', 'thorough']}
                  onChange={(value) => void updatePreferences({ compressionLevel: value as UserPreferences['compressionLevel'] })}
                />
                <SelectCard
                  label="Capture trigger"
                  value={state.preferences.autoCaptureTrigger}
                  options={['limit-detected', 'manual']}
                  onChange={(value) => void updatePreferences({ autoCaptureTrigger: value as UserPreferences['autoCaptureTrigger'] })}
                />
                <SelectCard
                  label="Restore behavior"
                  value={state.preferences.autoInjectBehavior}
                  options={['always', 'ask-first']}
                  onChange={(value) => void updatePreferences({ autoInjectBehavior: value as UserPreferences['autoInjectBehavior'] })}
                />
              </div>
            </section>

            <section className="premium-panel p-6">
              <div className="flex items-center gap-3">
                <WandSparkles className="h-5 w-5 text-[var(--warning)]" />
                <div>
                  <div className="text-lg font-semibold">Presentation and retention</div>
                  <div className="text-sm text-[var(--text-secondary)]">Shape the way operators experience the product across popup and settings surfaces.</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ThemeCard
                  active={state.preferences.theme === 'dark'}
                  title="Dark mode"
                  icon={Moon}
                  description="Cinematic, launch-ready interface for day-to-day operator use."
                  onClick={() => void updatePreferences({ theme: 'dark' })}
                />
                <ThemeCard
                  active={state.preferences.theme === 'light'}
                  title="Light mode"
                  icon={Sun}
                  description="Brighter review environment for settings and exported data checks."
                  onClick={() => void updatePreferences({ theme: 'light' })}
                />
              </div>

              <div className="mt-6 max-w-sm">
                <label className="mb-2 block text-sm text-[var(--text-secondary)]">Session retention</label>
                <select
                  value={String(state.preferences.sessionExpiryDays)}
                  onChange={(event) =>
                    void updatePreferences({
                      sessionExpiryDays: Number(event.target.value) as UserPreferences['sessionExpiryDays'],
                    })
                  }
                  className="premium-input"
                >
                  {expiryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="premium-panel border-rose-400/20 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
                <div>
                  <div className="text-lg font-semibold">Danger zone</div>
                  <div className="text-sm text-[var(--text-secondary)]">Use destructive actions sparingly, especially when sessions represent long-running product work.</div>
                </div>
              </div>

              <button
                onClick={() => void deleteAllData()}
                className="mt-5 flex items-center justify-center gap-2 rounded-[20px] border border-rose-300/25 bg-rose-400/10 px-4 py-3 font-semibold text-rose-100 transition hover:bg-rose-400/15"
              >
                <AlertTriangle className="h-4 w-4" />
                Delete all saved sessions
              </button>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

const MetricTile = ({ label, value }: { label: string; value: string }) => (
  <div className="metric-tile">
    <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</div>
    <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">{value}</div>
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
      'rounded-[24px] border p-4 text-left transition',
      active ? 'border-blue-300/20 bg-[var(--accent-soft)]' : 'border-[var(--surface-border)] bg-[var(--surface-elevated)]',
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-base font-semibold">{label}</div>
        <div className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{detail}</div>
      </div>
      <div className={clsx('rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]', active ? 'bg-black/20' : 'bg-white/5 text-[var(--text-muted)]')}>
        {active ? 'On' : 'Off'}
      </div>
    </div>
  </button>
);

const SelectCard = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm text-[var(--text-secondary)]">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="premium-input">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const ThemeCard = ({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: typeof Moon;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'rounded-[24px] border p-4 text-left transition',
      active ? 'border-blue-300/20 bg-[var(--accent-soft)]' : 'border-[var(--surface-border)] bg-[var(--surface-elevated)]',
    )}
  >
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-white/10 p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-base font-semibold">{title}</div>
    </div>
    <div className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</div>
  </button>
);
