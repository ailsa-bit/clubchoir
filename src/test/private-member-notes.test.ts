import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePrivateMemberNotes } from "@/hooks/use-private-member-notes";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), authChanged: undefined as undefined | (() => void) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: mocks.rpc,
  auth: { onAuthStateChange: (callback: () => void) => { mocks.authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } },
} }));

describe("private member notes access", () => {
  beforeEach(() => mocks.rpc.mockReset());
  it("allows Ailsa after the server confirms note ownership", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const { result } = renderHook(usePrivateMemberNotes);
    await waitFor(() => expect(result.current).toBe(true));
    expect(mocks.rpc).toHaveBeenCalledWith("can_manage_private_member_notes");
  });
  it("does not grant Martin access when the server denies note ownership", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    const { result } = renderHook(usePrivateMemberNotes);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
  it("revokes access when the signed-in account changes", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValue({ data: false, error: null });
    const { result } = renderHook(usePrivateMemberNotes);
    await waitFor(() => expect(result.current).toBe(true));
    act(() => mocks.authChanged?.());
    await waitFor(() => expect(result.current).toBe(false));
  });
  it("fails closed when the ownership check errors", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: { message: "offline" } });
    const { result } = renderHook(usePrivateMemberNotes);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});