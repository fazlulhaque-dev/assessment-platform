"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess, setLoading } from "@/store/slices/authSlice";
import { Profile } from "@/types";

export default function AuthHydrator({
  children,
  initialProfile,
}: {
  children: React.ReactNode;
  initialProfile: Profile | null;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (initialProfile) {
      dispatch(loginSuccess(initialProfile));
    } else {
      dispatch(setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
