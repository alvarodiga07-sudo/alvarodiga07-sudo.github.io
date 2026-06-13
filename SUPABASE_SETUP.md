# 🔐 Activar cuentas reales (Google/Apple) con Supabase

Todo el código ya está hecho. La app funciona con `localStorage` hasta que se rellenen
los 2 valores de Supabase. Sigue estos pasos UNA vez.

## 1. Crear el proyecto (gratis) — ~3 min
1. https://supabase.com → **Start your project** → entra con GitHub
2. **New project** → nombre `waddle`, contraseña de BD (guárdala), región **Europe (Frankfurt)**
3. Espera a que termine de crearse

## 2. Crear las tablas — ~1 min
1. Menú lateral → **SQL Editor** → **New query**
2. Pega TODO el contenido de `supabase/schema.sql` y pulsa **Run**
3. Debe salir "Success" en verde

## 3. Activar Google — ~5 min
1. Menú → **Authentication → Providers → Google** → activar
2. Necesitas un *Client ID* y *Client secret* de Google Cloud:
   - https://console.cloud.google.com → crear proyecto
   - **APIs & Services → OAuth consent screen** → External → rellenar lo mínimo
   - **Credentials → Create credentials → OAuth client ID → Web application**
   - En **Authorized redirect URIs** pega la que te muestra Supabase
     (algo como `https://xxxxx.supabase.co/auth/v1/callback`)
   - Copia el *Client ID* y *Client secret* → pégalos en Supabase → **Save**
3. En **Authentication → URL Configuration**:
   - **Site URL**: `https://alvarodiga07-sudo.github.io/`
   - **Redirect URLs**: añade `https://alvarodiga07-sudo.github.io/**`

## 4. Pasarme los 2 valores públicos
- Menú → **Project Settings (⚙️) → API**
- Copia **Project URL** y **anon public** key
- Pégamelos en el chat → yo los pongo en `.env`, recompilo y publico

## 5. (Opcional) Apple
Requiere **Apple Developer ($99/año)**. Cuando lo tengas, en Supabase
**Authentication → Providers → Apple** y te ayudo con la config.

---
Cuando termines los pasos 1–4, dime y dejo las cuentas reales funcionando.
