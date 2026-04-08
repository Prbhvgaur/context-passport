import { useEffect, useState } from 'react';
import type { SessionPassport, SessionSummary, UserPreferences, UserProfile } from '@context-passport/shared';
import { DEFAULT_PREFERENCES } from '@context-passport/shared';
import { AlertTriangle, Database, Moon, ShieldCheck, Sun } from 'lucide-react';
import { sendMessage } from '../utils/chrome';
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

type SessionDetail = SessionSummary & {
  passport: SessionPassport;
  rawHistory: Array<{ role: string; content: string }>;
};

const defaultState: OptionsState = {
  user: null,
  sessions: [],
  preferences: DEFAULT_PREFERENCES,
};

export const OptionsApp = () => {
  const [state, setState] = useState<OptionsState>(defaultState);

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

  const updatePreferences = async (payload: Partial<UserPreferences>) => {
    const next = { ...state.preferences, ...payload };
    await sendMessage<RuntimeResponse<UserProfile>>({ type: 'UPDATE_PREFERENCES', payload: next });
    setState((current) => ({ ...current, preferences: next }));
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
  };

  const deleteAllData = async () => {
    await Promise.all(
      state.sessions.map((session) =>
        sendMessage<RuntimeResponse<SessionSummary[]>>({ type: 'DELETE_SESSION', payload: { id: session.id } }),
      ),
    );
    await refresh();
  };

  return (
    <div className="min-h-screen p-8 text-slate-100">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-panel">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-electric">Preferences</div>
            <h1 className="mt-2 text-3xl font-semibold">Control how ContextPassport captures and restores your work.</h1>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
            Connected account: <span className="font-medium text-white">{state.user?.email ?? 'Not connected'}</span>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald" />
              <h2 className="text-xl font-semibold">Automation</h2>
            </div>
            <div className="mt-5 space-y-4">
              <ToggleRow
                label="Auto-capture"
                value={state.preferences.autoCapture}
                onToggle={() => void updatePreferences({ autoCapture: !state.preferences.autoCapture })}
              />
              <ToggleRow
                label="Auto-inject"
                value={state.preferences.autoInject}
                onToggle={() => void updatePreferences({ autoInject: !state.preferences.autoInject })}
              />
              <SelectRow
                label="Compression level"
                value={state.preferences.compressionLevel}
                options={['fast', 'balanced', 'thorough']}
                onChange={(value) => void updatePreferences({ compressionLevel: value as UserPreferences['compressionLevel'] })}
              />
              <SelectRow
                label="Capture trigger"
                value={state.preferences.autoCaptureTrigger}
                options={['limit-detected', 'manual']}
                onChange={(value) => void updatePreferences({ autoCaptureTrigger: value as UserPreferences['autoCaptureTrigger'] })}
              />
              <SelectRow
                label="Inject behavior"
                value={state.preferences.autoInjectBehavior}
                options={['always', 'ask-first']}
                onChange={(value) => void updatePreferences({ autoInjectBehavior: value as UserPreferences['autoInjectBehavior'] })}
              />
              <SelectRow
                label="Session expiry"
                value={String(state.preferences.sessionExpiryDays)}
                options={['7', '30', '90', '-1']}
                onChange={(value) => void updatePreferences({ sessionExpiryDays: Number(value) as UserPreferences['sessionExpiryDays'] })}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              {state.preferences.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-electric" />
              ) : (
                <Sun className="h-5 w-5 text-amber-300" />
              )}
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => void updatePreferences({ theme: 'dark' })}
                className={`rounded-2xl p-4 text-left ${state.preferences.theme === 'dark' ? 'bg-electric text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                Dark mode
              </button>
              <button
                onClick={() => void updatePreferences({ theme: 'light' })}
                className={`rounded-2xl p-4 text-left ${state.preferences.theme === 'light' ? 'bg-amber-200 text-slate-900' : 'bg-slate-800 text-slate-300'}`}
              >
                Light mode
              </button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-300">
              The popup stays under 400px wide and syncs your theme choice across extension surfaces.
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-electric" />
              <h2 className="text-xl font-semibold">Data export</h2>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Download all sessions and preferences as a JSON archive tied to your current Google identity.
            </p>
            <button
              onClick={() => void exportAllData()}
              className="mt-5 rounded-2xl bg-electric px-4 py-3 font-medium text-white transition hover:bg-blue-400"
            >
              Export all sessions
            </button>
          </section>

          <section className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              <h2 className="text-xl font-semibold">Danger zone</h2>
            </div>
            <p className="mt-3 text-sm text-rose-100/80">
              Delete every saved session currently synced to this extension account.
            </p>
            <button
              onClick={() => void deleteAllData()}
              className="mt-5 rounded-2xl border border-rose-300/40 px-4 py-3 font-medium text-rose-100 transition hover:bg-rose-500/20"
            >
              Delete all data
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3 text-left"
  >
    <span>{label}</span>
    <span className={`rounded-full px-3 py-1 text-xs ${value ? 'bg-emerald text-white' : 'bg-slate-700 text-slate-300'}`}>
      {value ? 'On' : 'Off'}
    </span>
  </button>
);

const SelectRow = ({
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
    <span className="mb-2 block text-sm text-slate-300">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);
