import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  authListener: undefined as undefined | ((event: string, session: unknown) => void),
}));

vi.mock("@/integrations/supabase/client", () => {
  const query: any = {};
  for (const m of ["select", "eq", "abortSignal"]) query[m] = () => query;
  query.maybeSingle = async () => ({ data: null, error: null });
  return {
    supabase: {
      from: () => query,
      auth: {
        getSession: mocks.getSession,
        onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
          mocks.authListener = cb;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        },
      },
    },
  };
});

import { useAdmin } from "@/hooks/use-admin";

const member = { id: "member-1", email: "member@example.com" };
const saveSignIn = () =>
  localStorage.setItem("sb-test-auth-token", JSON.stringify({ refresh_token: "saved", access_token: "old" }));

describe("members stay signed in", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mocks.getSession.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("keeps waiting instead of showing 'please sign in' while a saved sign-in reconnects", async () => {
    saveSignIn();
    mocks.getSession
      .mockResolvedValueOnce({ data: { session: null } }) // network still waking up
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValue({ data: { session: { user: member } } });
    const { result } = renderHook(useAdmin);

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await act(async () => { await vi.advanceTimersByTimeAsync(4_000); });
    expect(result.current.user?.id).toBe("member-1");
    expect(result.current.loading).toBe(false);
  });

  it("shows signed out right away when this device has no saved sign-in", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(useAdmin);
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("signs the member out when they press Sign Out", async () => {
    saveSignIn();
    mocks.getSession.mockResolvedValue({ data: { session: { user: member } } });
    const { result } = renderHook(useAdmin);
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.user?.id).toBe("member-1");

    localStorage.clear();
    await act(async () => {
      mocks.authListener?.("SIGNED_OUT", null);
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.user).toBeNull();
  });

  it("ignores a momentary empty session without signing the member out", async () => {
    saveSignIn();
    mocks.getSession.mockResolvedValue({ data: { session: { user: member } } });
    const { result } = renderHook(useAdmin);
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    await act(async () => {
      mocks.authListener?.("TOKEN_REFRESHED", null);
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.user?.id).toBe("member-1");
  });
});
