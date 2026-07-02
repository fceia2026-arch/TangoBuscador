# 📋 CHAT_DESARROLLO.md
# Tango en Buenos Aires — Registro completo del proceso de desarrollo

> Documento generado desde la conversación de desarrollo
> con Claude Sonnet 4.6 via OpenRouter + Chatbox
> Fecha: Junio 2026

---

## 📋 Tabla de Contenidos

- [Etapa 1 — Definición del proyecto](#etapa-1--definición-del-proyecto)
- [Etapa 2 — Configuración de servicios](#etapa-2--configuración-de-servicios)
- [Etapa 3 — Estructura de archivos](#etapa-3--estructura-de-archivos)
- [Etapa 4 — Base de datos Supabase](#etapa-4--base-de-datos-supabase)
- [Etapa 5 — Archivos principales](#etapa-5--archivos-principales)
- [Etapa 6 — Cambios de diseño](#etapa-6--cambios-de-diseño)
- [Etapa 7 — Panel de administración](#etapa-7--panel-de-administración)
- [Etapa 8 — Integración Gemini AI](#etapa-8--integración-gemini-ai)
- [Etapa 9 — Selector de fechas](#etapa-9--selector-de-fechas)
- [Etapa 10 — Música de fondo](#etapa-10--música-de-fondo)
- [Etapa 11 — Analytics y KNIME](#etapa-11--analytics-y-knime)
- [Etapa 12 — Documentación](#etapa-12--documentación)
- [Problemas resueltos](#-problemas-resueltos)
- [Problemas pendientes](#-problemas-pendientes)
- [Credenciales necesarias](#-credenciales-necesarias)

---

## Etapa 1 — Definición del proyecto

### Solicitud inicial
```
Quiero elaborar un proyecto basado en la temática de Tango
donde se pueda mediante un buscador con parámetros poder
localizar espectáculos de la cartelera de Buenos Aires.
Tener en cuenta el clima para lo que pueda llegar a ser
al aire libre. Quiero utilizar entre las tecnologías:
Gemini, Vercel, Google AI Studio, Supabase y GitHub.
Con una aplicación web HTML/JS. Tener en cuenta contador
de consultas para integrar esa información con KNIME.
```

### Resultado
```
Se definió la arquitectura completa del proyecto:
- Aplicación web HTML/CSS/JavaScript
- Base de datos Supabase (PostgreSQL)
- Deploy automático en Vercel
- Integración con Gemini AI para búsqueda natural
- API de clima Open-Meteo (gratuita, sin key)
- Mapas con Leaflet.js + CartoDB Light
- Analytics exportable a KNIME
```

### Parámetros del buscador definidos
```
Tipo de espectáculo:
  - baile        → Milongas para ir a bailar
  - cantado      → Orquestas típicas, cantantes en vivo
  - show_completo→ Cena-show clásica

Precio:
  - gratuito     → Eventos GCBA, plazas, centros culturales
  - economico    → Milongas populares, centros culturales
  - premium      → Casas de tango con cena show

Ambiente:
  - aire_libre   → Plazas, anfiteatros, Caminito
  - techado      → Clubs, teatros, salones

Horario:
  - vespertino   → Espectáculos callejeros, clases
  - nocturno     → Milongas, trasnoche

Días: lunes a domingo con selección de fecha
```

---

## Etapa 2 — Configuración de servicios

### Google AI Studio — API Key de Gemini
```
URL: https://aistudio.google.com
Pasos:
1. Sign in with Google
2. Get API Key → Create API Key
3. Copiar key: AIzaSy... (39 caracteres)
4. Probar en navegador:
   https://generativelanguage.googleapis.com/v1beta/models?key=TU_KEY
```

### Supabase — Base de datos
```
URL: https://supabase.com
Pasos:
1. New project → nombre: tangoba
2. Región: South America (São Paulo)
3. Guardar contraseña de BD
4. Copiar de Settings → API:
   - Project URL: https://XXXX.supabase.co
   - anon public key: eyJhbGci... (muy extensa, es un JWT)
```

### GitHub — Repositorio
```
URL: https://github.com
Pasos:
1. New repository → tangoba
2. Public
3. Add README file
4. Create repository
```

### Vercel — Deploy automático
```
URL: https://vercel.com
Pasos:
1. Sign up with GitHub
2. Add New Project → importar tangoba
3. Framework: Other
4. Build Command: (vacío)
5. Deploy
6. Cada push a GitHub redeploya solo
```

### OpenRouter — Acceso a Gemini
```
URL: https://openrouter.ai
Pasos:
1. Crear cuenta
2. Keys → Create Key → nombre: TangoBA
3. Copiar key: sk-or-v1-...
4. Plan prepago — pagar solo por uso
5. Modelo usado: google/gemini-2.0-flash-001
```

---

## Etapa 3 — Estructura de archivos

```
tangoba/
│
├── index.html          → App pública principal
├── login.html          → Acceso al panel admin
├── admin.html          → Panel de administración
├── README.md           → Documentación del proyecto
├── INFORME.md          → Informe técnico en Markdown
├── INFORME_TEXTO.md    → Informe en texto plano
├── CHAT_DESARROLLO.md  → Este archivo
├── vercel.json         → Configuración Vercel
│
├── css/
│   └── styles.css      → Todos los estilos
│
└── js/
    ├── config.js       → Credenciales centrales
    ├── supabase.js     → Base de datos + datos mock
    ├── clima.js        → API Open-Meteo + reloj
    ├── mapa.js         → Leaflet + geolocalización
    ├── gemini.js       → OpenRouter → Gemini
    ├── analytics.js    → Stats + exportación KNIME
    └── app.js          → Lógica principal
```

---

## Etapa 4 — Base de datos Supabase

### SQL ejecutado en Supabase → SQL Editor

```sql
-- Tabla espectáculos
CREATE TABLE IF NOT EXISTS espectaculos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       VARCHAR(255) NOT NULL,
  descripcion  TEXT,
  tipo         VARCHAR(50) CHECK (tipo IN ('baile','cantado','show_completo')),
  precio_tipo  VARCHAR(50) CHECK (precio_tipo IN ('gratuito','economico','premium')),
  precio_valor DECIMAL(10,2) DEFAULT 0,
  ambiente     VARCHAR(50) CHECK (ambiente IN ('aire_libre','techado')),
  horario_tipo VARCHAR(50) CHECK (horario_tipo IN ('vespertino','nocturno')),
  hora_inicio  VARCHAR(10),
  hora_fin     VARCHAR(10),
  direccion    VARCHAR(255),
  barrio       VARCHAR(100),
  latitud      DECIMAL(10,8),
  longitud     DECIMAL(11,8),
  imagen_url   TEXT,
  dias_semana  TEXT[],
  contacto     VARCHAR(255),
  website      VARCHAR(255),
  activo       BOOLEAN DEFAULT true,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- Tabla logs para KNIME
CREATE TABLE IF NOT EXISTS consultas_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha           TIMESTAMP DEFAULT NOW(),
  filtro_tipo     VARCHAR(50),
  filtro_precio   VARCHAR(50),
  filtro_ambiente VARCHAR(50),
  filtro_horario  VARCHAR(50),
  filtro_dia      VARCHAR(20),
  resultados_count INTEGER DEFAULT 0,
  clima_condicion VARCHAR(100),
  clima_temp      DECIMAL(5,2),
  uso_gemini      BOOLEAN DEFAULT false,
  session_id      VARCHAR(100)
);

-- Tabla usuarios admin
CREATE TABLE IF NOT EXISTS admin_users (
  id        UUID REFERENCES auth.users(id) PRIMARY KEY,
  email     VARCHAR(255) NOT NULL,
  nombre    VARCHAR(100),
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Políticas RLS
ALTER TABLE espectaculos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica espectaculos"
  ON espectaculos FOR SELECT USING (true);

CREATE POLICY "Lectura publica consultas"
  ON consultas_log FOR SELECT USING (true);

CREATE POLICY "Insertar consultas"
  ON consultas_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Solo admins insertan"
  ON espectaculos FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Solo admins actualizan"
  ON espectaculos FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Solo admins eliminan"
  ON espectaculos FOR DELETE
  USING (auth.uid() IN (SELECT id FROM admin_users));
```

### Crear usuario administrador
```sql
-- Ejecutar después de crear el usuario en
-- Supabase → Authentication → Users → Add user

INSERT INTO admin_users (id, email, nombre)
SELECT id, email, 'Administrador'
FROM auth.users
WHERE email = 'admin@tangoba.com';
```

### Datos de ejemplo cargados (8 espectáculos)
```
1. Milonga del Indio          → baile, económico, San Telmo
2. Tango en Plaza Dorrego     → show, gratuito, San Telmo
3. Orquesta Típica Ciudad     → cantado, económico, Centro
4. Café de los Angelitos      → show, premium, Balvanera
5. Tango en Caminito          → baile, gratuito, La Boca
6. La Viruta Tango Club       → baile, económico, Palermo
7. Anfiteatro Parque Centenario→ show, gratuito, Caballito
8. Centro Cultural Torquato   → baile, económico, San Telmo
```

---

## Etapa 5 — Archivos principales

### js/config.js — Variables centrales
```javascript
const CONFIG = {
  SUPABASE_URL     : 'https://XXXX.supabase.co',
  SUPABASE_KEY     : 'eyJhbGci...',      // anon public key
  OPENROUTER_KEY   : 'sk-or-v1-...',    // key de openrouter.ai
  OPENROUTER_MODEL : 'google/gemini-2.0-flash-001',
  BA_LAT           : -34.6037,
  BA_LON           : -58.3816,
  CLIMA_URL        : 'https://api.open-meteo.com/v1/forecast'
};
Object.freeze(CONFIG);
```

### js/clima.js — API Open-Meteo
```
Servicio: Open-Meteo (gratuito, sin API key)
Coordenadas: Buenos Aires -34.6037, -58.3816
Actualización: cada hora
Datos: temperatura, humedad, viento, condición

Lógica de alertas:
- Lluvia (códigos WMO 51-99) → alerta azul
- Frío extremo (< 6°C)       → alerta celeste
- Clima ideal (16-26°C)      → badge verde "¡Ideal hoy!"

Reloj en vivo:
- Muestra HH:MM:SS actualizado cada segundo
- Zona horaria: America/Argentina/Buenos_Aires
```

### js/mapa.js — Leaflet
```
Tiles: CartoDB Light Matter (tema claro)
URL: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png

Marcadores por precio:
- Verde  #27AE60 → gratuito
- Azul   #2980B9 → económico
- Dorado #C9A44E → premium

Emojis por tipo:
- 💃 baile
- 🎤 cantado
- 🎭 show_completo
```

---

## Etapa 6 — Cambios de diseño

### Paleta de colores — De rojo a azul
```
ANTES              DESPUÉS
─────────────────────────────────────
--rojo: #8B0000  → #1565C0
--rojo-claro     → #1976D2
Header rojo      → degradado azul
Chips activos    → azul #1565C0
Botones          → azul #1565C0
Fondo           → blanco #F5F5F5
Cards           → blanco #FFFFFF
```

### Mapa — De oscuro a claro
```
ANTES: CartoDB Dark Matter (dark_all)
DESPUÉS: CartoDB Light Matter (light_all)

Cambio en js/mapa.js:
const TILE = 'https://{s}.basemaps.cartocdn.com/light_all/...';
```

### Alertas meteorológicas
```
ANTES: texto claro sobre fondo oscuro (ilegible)
DESPUÉS:
- Lluvia → fondo #BBDEFB (azul claro) + texto negro
- Ideal  → fondo #C8E6C9 (verde claro) + texto negro
- Frío   → fondo #B3E5FC (celeste) + texto negro
```

---

## Etapa 7 — Panel de administración

### Acceso
```
URL: https://tu-proyecto.vercel.app/login.html
```

### Archivos creados
```
login.html  → Formulario de login con Supabase Auth
admin.html  → Panel con 3 pestañas:
              1. Espectáculos (lista + toggle + editar + borrar)
              2. Agregar Nuevo (formulario completo)
              3. Seguridad (cambio de contraseña)
```

### Cómo agregar espectáculos reales
```
Fuentes recomendadas:
- tangauta.com          → agenda milongas
- horastango.com        → horarios
- buenosaires.gob.ar    → eventos gratuitos
- eventbrite.com.ar     → eventos con entrada

Para obtener coordenadas:
1. maps.google.com
2. Buscar la dirección
3. Clic derecho → copiar coordenadas
4. Pegar en latitud y longitud del formulario
```

### Cambiar contraseña
```
OPCIÓN A: Panel admin → Seguridad → Cambiar contraseña
OPCIÓN B: Supabase → Authentication → Users → Reset password
OPCIÓN C: Borrar y recrear el usuario (datos no se pierden)
```

---

## Etapa 8 — Integración Gemini AI

### Estado actual
```
⚠️ La búsqueda con IA fue deshabilitada
   de la interfaz pública porque no se
   pudo resolver la conexión de forma
   estable con todos los modelos probados.

Los filtros manuales cubren el 100%
de los casos de búsqueda.
```

### Problema encontrado
```
Error: "No endpoints found for google/gemini-flash-1.5"
Causa: response_format: { type: 'json_object' }
       no es compatible con la mayoría de modelos
       de Gemini en OpenRouter

Solución aplicada: Se removió el botón de IA
de la interfaz. El archivo gemini.js existe
pero la función buscarConGemini() está vacía.
```

### Modelos probados en OpenRouter
```
❌ google/gemini-flash-1.5
❌ google/gemini-2.0-flash-001
❌ google/gemini-2.5-flash-preview
✅ meta-llama/llama-3.1-8b-instruct:free (alternativa)
```

### Si se quiere reactivar en el futuro
```javascript
// En js/config.js cambiar modelo a:
OPENROUTER_MODEL : 'meta-llama/llama-3.1-8b-instruct:free',

// En js/gemini.js eliminar esta línea del cuerpo:
response_format: { type: 'json_object' }

// En index.html descomentar el bloque:
<!-- <div class="gemini-box"> ... </div> -->
```

---

## Etapa 9 — Selector de fechas

### Evolución del desarrollo
```
INTENTO 1: Chips de días (lunes-domingo)
           → Funcionaba pero solo permitía un día
           → Se cambió a selección múltiple

INTENTO 2: Calendario custom con JS
           → Problema: no mostraba el mes inicial
           → Múltiples intentos de solución fallidos
           → Se abandonó

SOLUCIÓN FINAL: input type="date" nativo
           → Sin problemas de timing del DOM
           → Funciona en todos los navegadores
           → Simple y confiable
```

### Implementación final en index.html
```html
<div class="grupo-filtro grupo-ancho-completo">
  <label class="filtro-label">
    <i class="fas fa-calendar-alt"></i> Fecha
  </label>
  <div class="fecha-selector-wrap">
    <input type="date" id="inputFecha"
           class="input-fecha"
           onchange="onFechaChange()"/>
    <button class="btn-limpiar-fecha"
            onclick="limpiarFecha()">
      <i class="fas fa-times"></i> Limpiar
    </button>
  </div>
  <div class="fecha-dia-resultado" id="fechaDiaResultado"></div>
</div>
```

### Lógica en js/app.js
```javascript
// Convierte fecha seleccionada al día de la semana
function getDiasDesdeCalendario() {
  const input = document.getElementById('inputFecha');
  if (!input || !input.value) return [];
  const [anio, mes, dia] = input.value.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return [DIAS_SEMANA[fecha.getDay()]];
}
```

---

## Etapa 10 — Música de fondo

### Implementación
```
Archivo de audio: tango-fondo.mp3
Fuente recomendada: archive.org (dominio público)
Obras sugeridas:
  - La Cumparsita (Matos Rodríguez, 1948)
  - El Choclo (Ángel Villoldo, 1919)
  - La Morocha (Ángel Villoldo, 1919)
```

### Botón flotante
```
Posición: fixed, bottom: 24px, left: 24px
Estado apagado: azul con ícono 🎵
Estado encendido: verde pulsante con ícono ⏸
Volumen: 25% (ambiente suave)
```

### Nota importante
```
Los navegadores modernos bloquean el autoplay.
El usuario DEBE hacer clic en el botón
para activar la música manualmente.
```

---

## Etapa 11 — Analytics y KNIME

### Datos registrados por consulta
```javascript
{
  fecha           : "2026-06-28T21:30:00",
  filtro_tipo     : "baile",
  filtro_precio   : "gratuito",
  filtro_ambiente : "aire_libre",
  filtro_horario  : "vespertino",
  filtro_dia      : "domingo",
  resultados_count: 3,
  clima_condicion : "Despejado",
  clima_temp      : 18.5,
  uso_gemini      : false,
  session_id      : "sess_1234_abc"
}
```

### Conexión desde KNIME
```
Nodo: HTTP Request
Método: GET
URL: https://TU-PROYECTO.supabase.co/rest/v1/consultas_log
     ?select=*&order=fecha.desc

Headers:
  apikey:        TU_SUPABASE_ANON_KEY
  Authorization: Bearer TU_SUPABASE_ANON_KEY
```

### Exportación CSV
```
Desde la app: Panel Analytics → Exportar CSV para KNIME
Archivo: tangoba_YYYY-MM-DD.csv
Campos: fecha, filtros, resultados, clima, uso_gemini
```

---

## Etapa 12 — Documentación

### Archivos de documentación creados
```
README.md          → Documentación completa en Markdown
                     con badges, tablas, instrucciones
                     de instalación y uso

CHAT_DESARROLLO.md → Este archivo
```

### Herramientas de desarrollo documentadas
```
Claude Sonnet 4.6  → Modelo de IA para desarrollo
OpenRouter         → Plataforma de acceso prepago
Chatbox            → Cliente de escritorio
```

---

## ✅ Problemas resueltos

```
✅ Mapa con fondo negro
   Solución: cambiar dark_all → light_all en mapa.js

✅ Colores rojos en toda la interfaz
   Solución: reemplazar paleta roja por azul en styles.css

✅ Alertas meteorológicas ilegibles
   Solución: fondos claros + texto negro en alertas

✅ Fondo general oscuro
   Solución: cambiar variables CSS a tema claro

✅ Panel admin sin protección
   Solución: Supabase Auth + tabla admin_users

✅ Calendario no mostraba mes inicial
   Solución: reemplazar por input type="date" nativo

✅ Reloj en vivo en widget del clima
   Solución: setInterval cada 1000ms en clima.js

✅ Dos funciones getFiltros() duplicadas
   Solución: reemplazar app.js completo

✅ Rollback de versión en Vercel
   Solución: View logs → identificar versión
             → revertir archivos en GitHub
```

---

## ⚠️ Problemas pendientes

```
⚠️ Búsqueda con IA deshabilitada
   Causa: incompatibilidad response_format
          con modelos Gemini en OpenRouter
   Estado: botón removido de la interfaz
   Solución futura: probar con
   meta-llama/llama-3.1-8b-instruct:free

⚠️ Credenciales en config.js visible
   Causa: repositorio público en GitHub
   Solución futura: usar variables de
   entorno en Vercel

⚠️ Datos de espectáculos son ejemplos
   Causa: no hay conexión automática
          con fuentes externas
   Solución futura: conectar con
   BA Datos Abiertos API
```

---

## 🔑 Credenciales necesarias

```
┌─────────────────────────────────────────────────────┐
│  SERVICIO      DÓNDE OBTENER                        │
├─────────────────────────────────────────────────────┤
│  Supabase URL  supabase.com → Settings → API        │
│  Supabase Key  supabase.com → Settings → API        │
│                (anon public, empieza con eyJhbGci)  │
│  OpenRouter    openrouter.ai/keys                   │
│                (empieza con sk-or-v1-)              │
│  Admin email   el que creaste en Supabase Auth      │
│  Admin pass    la que elegiste al crear el usuario  │
└─────────────────────────────────────────────────────┘
```

---

## 🌐 URLs del proyecto

```
App pública:    https://TU-PROYECTO.vercel.app
Panel admin:    https://TU-PROYECTO.vercel.app/login.html
Repositorio:    https://github.com/TU_USUARIO/tangoba
Supabase:       https://supabase.com/dashboard
Vercel:         https://vercel.com/dashboard
OpenRouter:     https://openrouter.ai/keys
```

---

## 🛠️ Stack tecnológico completo

```
Frontend:    HTML5 + CSS3 + JavaScript ES6+
Base datos:  Supabase (PostgreSQL)
Auth:        Supabase Auth
Hosting:     Vercel (deploy desde GitHub)
Mapas:       Leaflet.js + CartoDB Light
Clima:       Open-Meteo (gratuito, sin key)
IA busqueda: OpenRouter → Gemini (deshabilitado)
Analytics:   Supabase → CSV → KNIME
Desarrollo:  Claude Sonnet 4.6 via OpenRouter
             usando Chatbox como cliente
```

---

*Última actualización: Junio 2026*
*Desarrollado con Claude Sonnet 4.6 via OpenRouter + Chatbox*
