import { useEffect, useMemo, useState } from 'react';
import type {
  SessionPassport,
  SessionSummary,
  SupportedPlatform,
  UserPreferences,
  UserProfile,
} from '@context-passport/shared';
import { DEFAULT_PREFERENCES } from '@context-passport/shared';
import { Bot, Download, LogOut, RefreshCcw, Save, Search, Settings, Sparkles, Trash2 } from 'lucide-react';
import { sendMessage } from '../utils/chrome';
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
  error?: string;
}

type SessionDetail = SessionSummary & {
  passport: SessionPassport;
  rawHistory: Array<{ role: string; content: string }>;
};

const platformOptions: Array<SupportedPlatform | 'all'> = [
  'all',
  'claude',
  'chatgpt',
  'gemini',
  'perplexity',
  'copilot',
  'grok',
];

const emptyState: AppState = {
  user: null,
  sessions: [],
  preferences: DEFAULT_PREFERENCES,
};

export const PopupApp = () => {
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SupportedPlatform | 'all'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 2800);
  };

  const refreshState = async () => {
    setLoading(true);
    const response = await sendMessage<RuntimeResponse<AppState>>({ type: 'GET_APP_STATE' });
    setState(response.data);
    setLoading(false);
  };

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.theme === 'dark');
  }, [state.preferences.theme]);

  const filteredSessions = useMemo(() => {
    return state.sessions.filter((session) => {
      const matchesPlatform = platformFilter === 'all' ? true : session.platform === platformFilter;
      const haystack = `${session.title} ${session.entities.projectName} ${session.tags.join(' ')}`.toLowerCase();
      const matchesQuery = haystack.includes(search.toLowerCase());
      return matchesPlatform && matchesQuery;
    });
  }, [platformFilter, search, state.sessions]);

  const stats = useMemo(() => {
    return {
      totalSessions: state.sessions.length,
      platformsUsed: new Set(state.sessions.map((session) => session.platform)).size,
    };
  }, [state.sessions]);

  const handleSignIn = async () => {
    try {
      const auth = await signInWithGoogle();
      await sendMessage<RuntimeResponse<UserProfile>>({ type: 'SET_AUTH', payload: auth });
      await sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'FETCH_SESSIONS' });
      await refreshState();
      showToast({ kind: 'success', message: 'Signed in and synced successfully.' });
    } catch (error) {
      showToast({ kind: 'error', message: error instanceof Error ? error.message : 'Sign-in failed.' });
    }
  };

  const handleManualSave = async () => {
    try {
      await sendMessage<RuntimeResponse<SessionSummary>>({ type: 'SAVE_ACTIVE_TAB_CHAT' });
      await refreshState();
      showToast({ kind: 'success', message: 'Current chat saved.' });
    } catch (error) {
      showToast({ kind: 'error', message: error instanceof Error ? error.message : 'Save failed.' });
    }
  };

  const togglePreference = async (key: 'autoCapture' | 'autoInject') => {
    const nextPreferences = {
      ...state.preferences,
      [key]: !state.preferences[key],
    };
    await sendMessage<RuntimeResponse<UserProfile>>({ type: 'UPDATE_PREFERENCES', payload: nextPreferences });
    setState((current) => ({ ...current, preferences: nextPreferences }));
  };

  const handleExport = async (sessionId: string) => {
    const response = await sendMessage<RuntimeResponse<SessionDetail>>({
      type: 'GET_SESSION_DETAIL',
      payload: { id: sessionId },
    });
    const markdown = buildSessionMarkdown(response.data);
    triggerDownload(`${response.data.title.replace(/\s+/g, '-').toLowerCase()}.md`, markdown, 'text/markdown');
    showToast({ kind: 'success', message: 'Session exported.' });
  };

  const handleDelete = async (sessionId: string) => {
    await sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'DELETE_SESSION', payload: { id: sessionId } });
    await refreshState();
    showToast({ kind: 'success', message: 'Session deleted.' });
  };

  const handleResume = async (sessionId: string) => {
    await sendMessage<RuntimeResponse<string>>({ type: 'RESUME_SESSION', payload: { id: sessionId } });
    showToast({ kind: 'success', message: 'Passport injected into the active chat.' });
  };

  const handleLogout = async () => {
    await sendMessage<RuntimeResponse<null>>({ type: 'LOG_OUT' });
    setState(emptyState);
  };

  if (loading) {
    return <div className="h-[600px] animate-pulse bg-slate-950/60" />;
  }

  if (!state.user) {
    return (
      <div className="flex h-[600px] w-[400px] flex-col justify-between p-6 text-slate-100">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-electric/40 bg-electric/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-electric">
            ContextPassport
          </div>
          <h1 className="text-3xl font-semibold">Resume any AI session without losing your place.</h1>
          <p className="mt-3 text-sm text-slate-300">
            Capture context when you hit limits, switch tools, or change Google accounts. Your next AI session picks up exactly where the last one stopped.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel backdrop-blur">
          <button
            onClick={() => void handleSignIn()}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-electric px-4 py-3 font-semibold text-white transition hover:bg-blue-400"
          >
            <Sparkles className="h-4 w-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-[400px] overflow-hidden p-4 text-slate-100">
      {toast ? (
        <div
          className={`absolute right-4 top-4 z-20 rounded-2xl px-4 py-3 text-sm shadow-panel ${
            toast.kind === 'success' ? 'bg-emerald text-white' : 'bg-rose-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <div className="flex h-full flex-col gap-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-panel backdrop-blur">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-electric">Session Handoff</div>
            <h1 className="text-lg font-semibold">Welcome back, {state.user.displayName.split(' ')[0]}</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-electric hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => void handleLogout()}
              className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-rose-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Saved Sessions</div>
            <div className="mt-2 text-2xl font-semibold">{stats.totalSessions}</div>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Platforms Used</div>
            <div className="mt-2 text-2xl font-semibold">{stats.platformsUsed}</div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => void handleManualSave()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-electric px-4 py-3 font-medium transition hover:bg-blue-400"
          >
            <Save className="h-4 w-4" />
            Save Current Chat
          </button>
          <button
            onClick={() =>
              void sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'FETCH_SESSIONS' }).then(refreshState)
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium transition hover:border-electric"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </section>

        <section className="grid grid-cols-2 gap-3 text-sm">
          <button
            onClick={() => void togglePreference('autoCapture')}
            className={`rounded-2xl px-3 py-3 text-left transition ${
              state.preferences.autoCapture ? 'bg-emerald/20 text-emerald-100' : 'bg-white/5 text-slate-300'
            }`}
          >
            Auto-capture
          </button>
          <button
            onClick={() => void togglePreference('autoInject')}
            className={`rounded-2xl px-3 py-3 text-left transition ${
              state.preferences.autoInject ? 'bg-electric/20 text-blue-100' : 'bg-white/5 text-slate-300'
            }`}
          >
            Auto-inject
          </button>
        </section>

        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-electric"
            />
          </div>
          <div className="flex gap-2 overflow-auto pb-1">
            {platformOptions.map((platform) => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platform)}
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${
                  platformFilter === platform ? 'bg-electric text-white' : 'bg-white/5 text-slate-300'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredSessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
              <Bot className="h-10 w-10 text-electric" />
              <h2 className="mt-3 text-lg font-semibold">No passports yet</h2>
              <p className="mt-2 text-sm text-slate-300">
                Save your current AI chat or wait for auto-capture when a platform limit is detected.
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <article key={session.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-electric">{session.platform}</div>
                    <h2 className="mt-1 text-sm font-semibold">{session.title}</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {session.messageCount} messages - {new Date(session.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void handleResume(session.id)}
                    className="flex-1 rounded-2xl bg-electric px-3 py-2 text-sm font-medium transition hover:bg-blue-400"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => void handleExport(session.id)}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-slate-300 transition hover:border-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(session.id)}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};
