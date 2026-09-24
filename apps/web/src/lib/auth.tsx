import * as React from "react";
import { api, AUTH_EXPIRED_EVENT } from "@/lib/api";
import type { AdminInfo, Permission } from "@/lib/types";

interface AuthState {
  ready: boolean;
  authed: boolean;
  needsSetup: boolean;
  admin: AdminInfo | null;
  username: string | null;
  can: (perm: Permission) => boolean;
  isOwner: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [authed, setAuthed] = React.useState(false);
  const [needsSetup, setNeedsSetup] = React.useState(false);
  const [admin, setAdmin] = React.useState<AdminInfo | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const status = await api.status();
      setNeedsSetup(!status.setup);
      if (status.setup) {
        try {
          const me = await api.me();
          setAuthed(true);
          setAdmin(me.admin);
        } catch {
          setAuthed(false);
          setAdmin(null);
        }
      } else {
        setAuthed(false);
      }
    } finally {
      setReady(true);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // When any API call returns 401 (e.g. another session changed the password
  // and invalidated our token), drop back to the login screen automatically.
  React.useEffect(() => {
    const onExpired = () => {
      setAuthed(false);
      setAdmin(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = React.useCallback(
    async (u: string, p: string) => {
      await api.login(u, p);
      await refresh();
    },
    [refresh],
  );

  const setup = React.useCallback(
    async (u: string, p: string) => {
      await api.setup(u, p);
      await refresh();
    },
    [refresh],
  );

  const logout = React.useCallback(async () => {
    await api.logout();
    setAuthed(false);
    setAdmin(null);
  }, []);

  const can = React.useCallback(
    (perm: Permission) =>
      admin?.role === "owner" || (admin?.permissions.includes(perm) ?? false),
    [admin],
  );

  return (
    <AuthContext.Provider
      value={{
        ready,
        authed,
        needsSetup,
        admin,
        username: admin?.username ?? null,
        can,
        isOwner: admin?.role === "owner",
        refresh,
        login,
        setup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
