import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { requireActor } from "./auth.service";
import { logAction } from "./audit.service";
import { describeError } from "./errors";
import type { Expense, ExpenseFilters, ExpenseInput } from "../types/expense";
import type { UserProfile } from "../types/user";
import { sortExpensesByDate } from "../utils/calculations";

const EXPENSES = "expenses";

/**
 * Consultas soportadas (ver README, sección "Consultas e índices"):
 *  - activos / archivados ............ { archived }
 *  - de un vehículo .................. { archived, vehicleId }
 *  - de un usuario ................... { archived, userId }
 *  - de un vehículo y usuario ........ { archived, vehicleId, userId }
 *  - por categoría ................... { archived, category }
 *  - por fechas ...................... { archived, from, to }  (requiere índice compuesto)
 * Solo igualdades: no necesitan índice compuesto. `from`/`to` combinados con
 * otras igualdades sí (están en firestore.indexes.json).
 */
function buildConstraints(filters: ExpenseFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where("archived", "==", filters.archived)];
  if (filters.vehicleId !== undefined) constraints.push(where("vehicleId", "==", filters.vehicleId));
  if (filters.userId !== undefined) constraints.push(where("userId", "==", filters.userId));
  if (filters.category !== undefined) constraints.push(where("category", "==", filters.category));
  if (filters.from) constraints.push(where("date", ">=", Timestamp.fromDate(filters.from)));
  if (filters.to) constraints.push(where("date", "<=", Timestamp.fromDate(filters.to)));
  return constraints;
}

export function subscribeToExpenses(
  filters: ExpenseFilters,
  onData: (expenses: Expense[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, EXPENSES), ...buildConstraints(filters)),
    (snapshot) => {
      const expenses = snapshot.docs.map((item) => ({
        ...(item.data({ serverTimestamps: "estimate" }) as Omit<Expense, "id">),
        id: item.id,
      }));
      onData(sortExpensesByDate(expenses));
    },
    (error) => onError(describeError(error)),
  );
}

/** userId = auth.currentUser.uid y userName = perfil. El formulario no puede cambiarlos. */
export async function createExpense(input: ExpenseInput, profile: UserProfile | null): Promise<string> {
  const actor = requireActor(profile);
  const created = await addDoc(collection(db, EXPENSES), {
    vehicleId: input.vehicleId,
    userId: actor.uid,
    userName: actor.name,
    category: input.category,
    description: input.description.trim(),
    amount: input.amount,
    date: Timestamp.fromDate(input.date),
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logAction(actor, "expense.create", { vehicleId: input.vehicleId, expenseId: created.id });
  return created.id;
}

/** Editar nunca toca userId ni userName: el gasto sigue siendo de quien lo registró. */
export async function updateExpense(
  id: string,
  input: ExpenseInput,
  profile: UserProfile | null,
): Promise<void> {
  const actor = requireActor(profile);
  await updateDoc(doc(db, EXPENSES, id), {
    vehicleId: input.vehicleId,
    category: input.category,
    description: input.description.trim(),
    amount: input.amount,
    date: Timestamp.fromDate(input.date),
    updatedAt: serverTimestamp(),
  });
  await logAction(actor, "expense.update", { vehicleId: input.vehicleId, expenseId: id });
}

/** Nunca se borra físicamente: archived true/false. */
export async function setExpenseArchived(
  expense: Pick<Expense, "id" | "vehicleId">,
  archived: boolean,
  profile: UserProfile | null,
): Promise<void> {
  const actor = requireActor(profile);
  await updateDoc(doc(db, EXPENSES, expense.id), { archived, updatedAt: serverTimestamp() });
  await logAction(actor, archived ? "expense.archive" : "expense.restore", {
    vehicleId: expense.vehicleId,
    expenseId: expense.id,
  });
}
