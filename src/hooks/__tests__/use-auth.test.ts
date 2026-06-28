import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// --- mocks ---

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// typed re-imports so we can control return values in each test
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

// --- helpers ---

const PROJECT_STUB = { id: "proj-1", name: "Test", createdAt: new Date(), updatedAt: new Date() };

function defaultMocks() {
  mockSignInAction.mockResolvedValue({ success: true });
  mockSignUpAction.mockResolvedValue({ success: true });
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([PROJECT_STUB]);
  mockCreateProject.mockResolvedValue(PROJECT_STUB as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  defaultMocks();
});

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});

// ─────────────────────────────────────────────────────────────
// signIn
// ─────────────────────────────────────────────────────────────

describe("signIn", () => {
  test("returns the result from the server action", async () => {
    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("a@b.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns failure result without navigating", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("bad@b.com", "wrong");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("sets isLoading to true while in-flight then resets to false", async () => {
    let resolveSignIn!: (v: any) => void;
    mockSignInAction.mockReturnValue(new Promise((r) => (resolveSignIn = r)));

    const { result } = renderHook(() => useAuth());

    // kick off without awaiting
    act(() => { result.current.signIn("a@b.com", "password123"); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => resolveSignIn({ success: false }));
    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading even when the action throws", async () => {
    mockSignInAction.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("calls signInAction with the provided credentials", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "s3cr3t");
    });

    expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "s3cr3t");
  });

  test("does not call signInAction more than once per call", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockSignInAction).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────
// signUp
// ─────────────────────────────────────────────────────────────

describe("signUp", () => {
  test("returns the result from the server action", async () => {
    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("new@b.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns failure result without navigating", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("exists@b.com", "password123");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already registered" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("sets isLoading to true while in-flight then resets to false", async () => {
    let resolveSignUp!: (v: any) => void;
    mockSignUpAction.mockReturnValue(new Promise((r) => (resolveSignUp = r)));

    const { result } = renderHook(() => useAuth());

    act(() => { result.current.signUp("new@b.com", "password123"); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => resolveSignUp({ success: false }));
    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading even when the action throws", async () => {
    mockSignUpAction.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@b.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("calls signUpAction with the provided credentials", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "mypassword");
    });

    expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "mypassword");
  });
});

// ─────────────────────────────────────────────────────────────
// Post-auth navigation (handlePostSignIn)
// ─────────────────────────────────────────────────────────────

describe("post-auth navigation", () => {
  test("migrates anon work: creates project, clears anon data, navigates to new project", async () => {
    const anonMessages = [{ id: "1", role: "user", content: "Hello" }];
    const anonFsData = { "/App.jsx": { type: "file", content: "export default () => <div />" } };

    mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: anonFsData });
    mockCreateProject.mockResolvedValue({ id: "new-proj", name: "migrated" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonMessages,
        data: anonFsData,
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalledTimes(1);
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/new-proj");
  });

  test("skips anon migration when anonWork.messages is empty, goes to existing project", async () => {
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([
      { id: "proj-a", name: "A", createdAt: new Date(), updatedAt: new Date() },
      { id: "proj-b", name: "B", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/proj-a"); // most recent = first in list
  });

  test("skips anon migration when getAnonWorkData returns null, goes to existing project", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([PROJECT_STUB]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(`/${PROJECT_STUB.id}`);
  });

  test("navigates to most recent project (index 0) when multiple projects exist", async () => {
    const projects = [
      { id: "recent", name: "Recent", createdAt: new Date(), updatedAt: new Date() },
      { id: "older", name: "Older", createdAt: new Date(), updatedAt: new Date() },
    ];
    mockGetProjects.mockResolvedValue(projects);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent");
  });

  test("creates a new blank project and navigates when user has no existing projects", async () => {
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new", name: "New Design" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });

  test("signUp also triggers post-auth navigation", async () => {
    mockGetProjects.mockResolvedValue([PROJECT_STUB]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@b.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith(`/${PROJECT_STUB.id}`);
  });

  test("does not navigate when signIn fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "bad creds" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "wrong");
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  test("does not navigate when signUp fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "taken" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("taken@b.com", "password123");
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockCreateProject).not.toHaveBeenCalled();
  });
});
