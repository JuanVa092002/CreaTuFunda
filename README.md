# CreaTuFunda — Fundas Personalizadas para iPhone

Tienda e-commerce de fundas personalizadas construida con **Next.js 15 (App Router)**, **React 19**, **Prisma 6**, **Neon Postgres**, **Clerk**, **Cloudinary**, **Wompi** y **Brevo**, desplegada en **Vercel**.

🌐 **Producción:** [https://creatufunda.vercel.app/](https://creatufunda.vercel.app/)

---

## Stack Tecnológico

| Capa | Tecnología | Uso en el proyecto |
| --- | --- | --- |
| **Framework** | Next.js `15.5` (App Router) | Server Components, Server Actions y Route Handlers |
| **Frontend & UI** | React `19`, Tailwind CSS, shadcn/ui | Interfaz responsiva, animaciones y componentes accesibles |
| **Base de Datos** | PostgreSQL (Neon) + Prisma `6.19` | Adaptador serverless (`@prisma/adapter-neon`) |
| **Autenticación** | Clerk (`@clerk/nextjs`) | Sesiones, middleware y protección de `/dashboard` |
| **Imágenes** | Cloudinary | Subida directa firmada desde el navegador y recortes PNG |
| **Pagos** | Wompi | Checkout en COP, firma de integridad y webhooks |
| **Correos** | Brevo (principal) / Resend (respaldo) | Confirmación transaccional de pedidos con React Email |
| **Hosting** | Vercel | Despliegue continuo y funciones serverless |

---

## Primeros pasos en local

```bash
pnpm install
cp .env.example .env    # configurar variables de entorno
pnpm exec prisma migrate deploy
pnpm dev
```

Abre `http://localhost:3000` en tu navegador.

---

## Variables de entorno

| Variable | Requerida | Propósito |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión pooled de Neon usada en tiempo de ejecución (`pgbouncer=true`). |
| `DIRECT_URL` | Sí | Conexión directa de Neon para `prisma migrate` y `prisma db push`. |
| `CLOUDINARY_CLOUD_NAME` | Sí | Nombre de cuenta en Cloudinary. |
| `CLOUDINARY_API_KEY` | Sí | API key para firmar subidas directas. |
| `CLOUDINARY_API_SECRET` | Sí | Secreto de servidor para firma de subidas (nunca expuesto al cliente). |
| `CLOUDINARY_FOLDER` | No | Carpeta raíz de assets (ej. `creatufunda/uploads` y `creatufunda/designs`). |
| `NEXT_PUBLIC_SERVER_URL` | Sí | URL pública base (`https://creatufunda.vercel.app` en producción). |
| `ADMIN_EMAIL` | No | Correo autorizado para acceder al panel `/dashboard`. |
| `PAYMENTS_ENABLED` | No | Interruptor para habilitar/pausar el checkout (`"true"` / `"false"`). |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Sí | Llave pública de Wompi para el flujo de pago. |
| `WOMPI_PRIVATE_KEY` | Sí | Llave privada de Wompi en servidor. |
| `WOMPI_INTEGRITY_SECRET` | Sí | Secreto de integridad para firmar transacciones de Wompi. |
| `WOMPI_EVENTS_SECRET` | Sí | Secreto para verificar la firma de eventos en `/api/webhooks/wompi`. |
| `WOMPI_USD_TO_COP_RATE` | No | Tasa de conversión USD → COP para cálculos en checkout (por defecto `4000`). |
| `BREVO_API_KEY` | Sí | API key de Brevo para envío de correos de confirmación. |
| `BREVO_SENDER_EMAIL` | Sí | Correo remitente verificado en Brevo. |
| `BREVO_SENDER_NAME` | No | Nombre del remitente (por defecto `CreaTuFunda`). |
| `RESEND_API_KEY` | No | Proveedor de respaldo para correos transaccionales. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sí | Llave pública de Clerk. |
| `CLERK_SECRET_KEY` | Sí | Llave secreta de Clerk en servidor. |

---

## Arquitectura y Funcionalidades

### 1. Base de datos (Neon + Prisma)
- Esquema definido en `prisma/schema.prisma` con modelos para `User`, `Configuration`, `Order`, `ShippingAddress` y `BillingAddress`.
- Soporte para modelos desde **iPhone X** hasta la línea **iPhone 16 / 16 Pro / 16 Pro Max**, acabados (liso / texturizado), materiales (silicona / policarbonato) y colores adaptativos.

### 2. Pipeline de imágenes y diseñador interactivo
- **`/configure/upload`:** Solicita una firma temporal en servidor, sube la imagen directo a Cloudinary con barra de progreso y crea el registro `Configuration`.
- **`/configure/design`:** Lienzo interactivo (`react-rnd`) para posicionar, redimensionar y combinar el color de la funda con detección automática de color dominante; exporta el recorte en PNG y guarda `croppedImageUrl`.

### 3. Checkout, pagos con Wompi y correos
- **`/configure/preview`:** Resumen del diseño configurado, formulario de dirección de envío y creación de orden en base de datos.
- **Pagos con Wompi:** Generación de firma de integridad SHA-256 en servidor y recepción de eventos en `POST /api/webhooks/wompi` para marcar `Order.isPaid = true` y disparar el correo de confirmación.
- **Notificaciones:** Envío de comprobante de pedido con plantilla React Email a través de **Brevo** (con Resend como respaldo).

### 4. Soporte bilingüe (ES / EN)
- Diccionario completo en español e inglés con detección y cambio dinámico desde la barra de navegación.

### 5. Panel administrativo (`/dashboard`)
- Protegido mediante sesión de Clerk y validación de `ADMIN_EMAIL`.
- Métricas de ventas (semanales y mensuales) y actualización del estado de envío de cada pedido (`awaiting_shipment`, `shipped`, `fulfilled`).

---

## Scripts disponibles

| Script | Acción |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo |
| `pnpm build` | Ejecuta `prisma generate` y genera el build de producción |
| `pnpm start` | Inicia el servidor en modo producción |
| `pnpm typecheck` | Verificación estricta de tipos (`tsc --noEmit`) |
| `pnpm db:migrate` | Ejecuta migraciones en desarrollo |
| `pnpm db:push` | Sincroniza el esquema con la base de datos |
| `pnpm db:studio` | Abre Prisma Studio |

---

## Despliegue en Vercel

La aplicación está configurada y desplegada en **Vercel** en [https://creatufunda.vercel.app/](https://creatufunda.vercel.app/):

1. Conectar el repositorio en Vercel y configurar el comando de build (`pnpm build`).
2. Registrar las variables de entorno en **Project Settings → Environment Variables**.
3. Configurar el webhook de eventos en el panel de **Wompi** apuntando a `https://creatufunda.vercel.app/api/webhooks/wompi`.
