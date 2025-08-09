# Janny POS — Deploy en Railway (1 proyecto)

Este repo incluye **Dockerfile** que construye frontend y backend juntos.
En Railway crearás **un servicio** web y **una base de datos Postgres**.

## Pasos (sin código)

1. **Sube este ZIP a GitHub** (crea un repo nuevo y sube el contenido).
2. En **Railway** → **New Project** → **Deploy from GitHub** → selecciona tu repo.
3. Railway detectará el `Dockerfile` y construirá la imagen.
4. Agrega **PostgreSQL**: dentro del proyecto → **Add** → **Database** → **PostgreSQL**.
5. En el **servicio web** (donde está el Docker): **Variables** → crea `DATABASE_URL` y pega la URL de conexión de tu Postgres (la ves en el servicio de DB → "Connect").
6. (Opcional) Crea `CANCEL_PIN=1111` y `CORS_ORIGIN=*`.
7. **Deploy**. Cuando termine, la URL pública servirá **el frontend** y el backend en la misma dirección.
   - Salud: `GET /api/health`
   - POS: raíz `/`
8. **Semilla** (si quieres crear el sitio "Principal"):
   - Ejecuta: `POST https://TU-URL/api/seed-basic`

> El contenedor corre `node src/server.js` y sirve el build del frontend desde `./dist`.
> Prisma client se genera en el build, y en el arranque usa `DATABASE_URL` para conectar.

## Actualizaciones
Cuando hagas `git push` al repo, Railway reconstruye y despliega solo.

### Notas
- Si ves error de migraciones, ejecuta manualmente en una consola de Railway:
  - `npx prisma migrate deploy`
- Tickets PDF: `GET /api/sales/:id/ticket.pdf`
- Cancelar venta con PIN: `POST /api/sales/:id/cancel` body `{ "pin": "1111" }`
