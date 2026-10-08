# Concesionario

Control de inventario, gastos, inversión y rentabilidad por vehículo para dos administradores (Rodrigo y John).
React + TypeScript + Vite · Firebase Authentication · Cloud Firestore · React Router · GitHub Pages.

## Ejecutar

```bash
npm install
cp .env.example .env     # completa las 6 variables VITE_FIREBASE_*
npm run dev              # http://localhost:5173/concesionario/
npm run build            # verifica TypeScript y genera dist/
```

## Firebase (una sola vez)

1. Authentication → activar **Correo/contraseña** y crear las dos cuentas.
2. Firestore Database → crear en modo producción (ID `(default)`).
3. Crear los perfiles `users/{UID}` con `uid, name, email, role: "admin", active: true, createdAt`
   (a mano o con el script de migración). Los perfiles NO se crean desde la app.
4. Pestaña **Reglas** → pegar el contenido de `firestore.rules` → Publicar.
5. (Opcional) Índices: `firebase deploy --only firestore:indexes` (ver abajo).

## Modelo

`users/{uid}` · `vehicles/{id}` · `expenses/{id}` (con `vehicleId` y `userId`) · `auditLogs/{id}`.
Nada se borra: archivar = `archived: true`. La inversión total y la utilidad **no se guardan**, se calculan
(`src/utils/calculations.ts`): inversión = compra + gastos activos · utilidad = venta − inversión · rentabilidad = utilidad / inversión × 100.

## Seguridad

- `expense.userId` = `auth.currentUser.uid` y `userName` = perfil; el formulario no puede cambiarlos.
- `firestore.rules`: solo administradores activos; al crear un gasto `userId == request.auth.uid`; un gasto existente no puede cambiar de dueño;
  no hay borrado; los perfiles no se crean desde el cliente; la auditoría exige `userId == request.auth.uid` y hora del servidor.
- Las claves `VITE_FIREBASE_*` de la web no son secretas; lo que protege los datos son las reglas y Authentication.

## Consultas e índices

`subscribeToExpenses(filters)` en `src/services/expenses.service.ts`:

| Consulta | Filtros | Índice compuesto |
|---|---|---|
| Activos / archivados | `{ archived }` | No |
| De un vehículo | `{ archived, vehicleId }` | No |
| De un usuario | `{ archived, userId }` | No |
| De un vehículo y usuario | `{ archived, vehicleId, userId }` | No |
| Por categoría | `{ archived, category }` | No |
| Por fechas (con cualquiera de las anteriores) | `+ from / to` | Sí: `firestore.indexes.json` |

Las pantallas actuales filtran fechas en memoria, por eso funcionan sin índices. Si una consulta pide uno, la consola del navegador
muestra un enlace que lo crea con un clic. Índices definidos: `(archived, date)`, `(vehicleId, date)`, `(userId, date)`, `(category, date)`,
`(vehicleId, archived, date)`, `(userId, archived, date)` — todos ascendentes sobre la colección `expenses`.

## Publicar en GitHub Pages

1. Crear el repositorio `concesionario` y subir el código (`.env` no se sube; sí `package-lock.json`).
2. Settings → Secrets and variables → Actions → crear 6 secrets con los mismos nombres y valores de tu `.env`.
3. Settings → Pages → Source: **GitHub Actions**.
4. Firebase → Authentication → Settings → **Authorized domains** → agregar `TU_USUARIO.github.io`.
5. Cada push a `main` despliega en `https://TU_USUARIO.github.io/concesionario/`.

Se usa `HashRouter` (las rutas se ven como `/#/vehicles`) porque GitHub Pages da 404 al recargar rutas internas.
Si cambias el nombre del repositorio, actualiza `base` en `vite.config.ts`.

## Estructura

`src/pages` pantallas · `src/components` UI por dominio · `src/services` Firebase · `src/hooks` datos en tiempo real ·
`src/utils` dinero, fechas y cálculos · `src/types` modelos · `src/contexts` sesión y notificaciones.
