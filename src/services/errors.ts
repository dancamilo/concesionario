export function describeError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "permission-denied":
      return "No tienes permiso para esta operación. Revisa las reglas de Firestore.";
    case "failed-precondition":
      return "Firestore necesita un índice para esta consulta. Abre la consola del navegador y usa el enlace que aparece para crearlo.";
    case "unavailable":
      return "Sin conexión con Firebase. Revisa tu internet.";
    case "not-found":
      return "El documento no existe.";
    default:
      break;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
