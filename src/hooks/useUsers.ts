import { useEffect, useState } from "react";
import { listUsers } from "../services/users.service";
import { describeError } from "../services/errors";
import type { UserProfile } from "../types/user";

interface UsersState {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
}

/** Perfiles de los administradores (para filtros y balances). */
export function useUsers(): UsersState {
  const [state, setState] = useState<UsersState>({ users: [], loading: true, error: null });

  useEffect(() => {
    let active = true;
    listUsers()
      .then((users) => {
        if (active) setState({ users, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ users: [], loading: false, error: describeError(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
