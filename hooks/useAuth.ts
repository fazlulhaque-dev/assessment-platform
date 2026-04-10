"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginSuccess,
  logout as logoutAction,
  setLoading,
} from "@/store/slices/authSlice";
import { resetSession } from "@/store/slices/examSessionSlice";
import { Profile } from "@/types";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading } = useAppSelector(
    (s) => s.auth,
  );

  const hydrateSession = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const { data } = await axiosInstance.get<{
        user: unknown;
        profile: Profile | null;
      }>("/auth/session");
      if (data.profile) {
        dispatch(loginSuccess(data.profile));
      } else {
        dispatch(setLoading(false));
      }
    } catch {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      expectedRole: "employer" | "candidate",
    ) => {
      const { data } = await axiosInstance.post<{ profile: Profile }>(
        "/auth/login",
        {
          email,
          password,
        },
      );
      if (data.profile.role !== expectedRole) {
        throw new Error(`This account is not an ${expectedRole} account.`);
      }
      dispatch(loginSuccess(data.profile));
      if (expectedRole === "employer") {
        router.push("/employer/dashboard");
      } else {
        router.push("/candidate/dashboard");
      }
    },
    [dispatch, router],
  );

  const logout = useCallback(async () => {
    await axiosInstance.post("/auth/logout");
    dispatch(logoutAction());
    dispatch(resetSession());
    router.push("/");
  }, [dispatch, router]);

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hydrateSession,
  };
}
