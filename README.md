# 🎵 Tango — Buscador de Espectáculos en Buenos Aires


Bienvenido a la aplicación web gratuita que permite buscar y descubrir espectáculos de tango en la Ciudad de Buenos Aires.
> **Encontrá el show de tango perfecto en Buenos Aires.**
> Filtrá por tipo, precio, horario y clima en tiempo real.
> Desarrollado 100% con asistencia de Inteligencia Artificial.  Claude Sonnet 4.6 y Gemini 3.5 Flash.

Combina tres tecnologías clave para ofrecer una experiencia única e inteligente:

```
🤖 Inteligencia Artificial  →  Búsqueda en lenguaje natural
🌤️ Clima en tiempo real     →  Recomendaciones según el tiempo
🗺️ Geolocalización          →  Mapa interactivo 
```
---

### ¿Para quién esta destinado?

| Perfil | Beneficio |
|---|---|
| Turista en BA | Descubrí los mejores shows sin perderte nada |
| Bailarín local | Encontrá milongas por barrio, día y precio |
| Amante del tango | Seguí la agenda completa de orquestas y cantantes |
| Analista de datos | Exportá métricas de uso para análisis en KNIME 






---

## 🌐 Demo y Accesos

| Enlace | Descripción |
|---|---|
| 🌍 [Ver aplicación](https://tango-buscador.vercel.app) | Sitio público |
| 🔐 [Panel Admin](https://tango-buscador.vercel.app/login.html) | Gestión de espectáculos |
| 🐙 [Repositorio](https://github.com/fceia2026-arch/TangoBuscador) | Código fuente |

---
### Denominaremos este Buscador como TangoBA o Buscador Tanguero, indistintamente.

---

## Manual Técnico, de Arquitectura, Operación y Despliegue de la Plataforma


---

## Tabla de Contenidos
1. [Introducción y Propósito del Proyecto](#1-introducción-y-propósito-del-proyecto)
2. [Arquitectura General y Stack Tecnológico](#2-arquitectura-general-y-stack-tecnológico)
3. [Modelo de Datos y Tipos de Datos Definidos](#3-modelo-de-datos-y-tipos-de-datos-definidos)
4. [Instalación, Configuración y Despliegue](#4-instalación-configuración-y-despliegue)
5. [Módulo de Mapas Interactivos (Leaflet Deep-Dive)](#5-módulo-de-mapas-interactivos-leaflet-deep-dive)
6. [Motor de Filtrado Inteligente y Adaptabilidad Climática](#6-motor-de-filtrado-inteligente-y-adaptabilidad-climática)
7. [Panel de Administración (Seguridad y Ciclo de Vida de Sesión)](#7-panel-de-administración-seguridad-y-ciclo-de-vida-de-sesión)
8. [Sistema de Analíticas y Logs de Búsqueda](#8-sistema-de-analíticas-y-logs-de-búsqueda)
9. [Respaldo de Información (Backup, Import & Export de Datos)](#9-respaldo-de-información-backup-import--export-de-datos)
10. [Guía de Usuario y Flujos Operativos](#10-guía-de-usuario-y-flujos-operativos)

---

## 1. Introducción y Propósito del Proyecto

Este Buscador Tanguero nace con el objetivo de unificar, geolocalizar y contextualizar esta rica oferta cultural. La plataforma no es un simple directorio estático. Se concibe como una herramienta inteligente que ayuda tanto al turista internacional como al vecino porteño a descubrir espectáculos en base a:
- Sus preferencias (baile, canto o show integral de escenario).
- Su presupuesto (desde propuestas gratuitas de calle o centros culturales estatales hasta cenas show de alta gama).
- Su disponibilidad horaria y de calendario (días de la semana, horarios vespertinos o nocturnos).
- Las condiciones climáticas en tiempo real: Factor crítico en una ciudad con fuerte actividad de tango callejero y milongas al aire libre (como la Glorieta de Belgrano o plazas de San Telmo).
- Mientras se realiza la busqueda se puede activar el reproductor de sonido para ir oyendo de fondo el tango La Cumparsita.

Con esta propuesta, el Buscador TangoBA une la tradición porteña con la ingeniería de software moderna, entregando una interfaz de usuario fluida, interactiva y de alto impacto visual.

---

## 2. Arquitectura General y Stack Tecnológico

TangoBA está construido bajo un enfoque de desarrollo ágil y de alta fidelidad visual. El ecosistema tecnológico se divide de la siguiente manera:

```
                  +----------------------------------------------+
                  |               CLIENTE (SPA)                  |
                  |  [React 18 / Vite / Tailwind CSS / Lucide]   |
                  +-------+--------------------+-----------------+
                          |                    |
            Consumo HTTP  |                    | Consultas directas
            (Open-Meteo)  |                    | / Supabase Client
                          v                    v
                  +-------+--------+   +-------+-----------------+
                  |  API METEOROL. |   |   SUPABASE DATABASE     |
                  |  (Open-Meteo)  |   | [PostgreSQL Cloud / RLS]|
                  +----------------+   +-------------------------+
```

### 2.1. Frontend Core
- **React 18**: Biblioteca principal para la creación de componentes declarativos, manejando un estado central robusto y ciclos de vida óptimos de renderizado.
- **Vite**: Herramienta de compilación ultrarrápida (Bundler) para el desarrollo moderno en entornos web front-end.
- **Tailwind CSS (V4)**: Motor de diseño utilitario para estructurar una interfaz limpia.
- **Framer Motion (`motion/react`)**: Biblioteca para dotar a la plataforma de transiciones dinámicas suavizadas al filtrar elementos, abrir paneles o desplegar ventanas de diálogo modal.

### 2.2. Cartografía y Geolocalización
- **Leaflet.js**: Librería de mapas interactivos de código abierto, elegida por su ligereza y nulo impacto en el rendimiento móvil en comparación con soluciones pesadas o costosas de mapas comerciales.
- **Carto Voyager Tiles**: Proveedor de mosaicos vectorizados de diseño sobrio y minimalista, ideales para resaltar marcadores temáticos de color sobre un mapa limpio, sin contaminación de textos publicitarios ajenos a la cartelera de espectáculos.

### 2.3. Capa de Servicios y APIs
- **Open-Meteo API**: Utilizada para consultar la temperatura, la humedad, la velocidad del viento y las precipitaciones actuales en la Ciudad de Buenos Aires de manera síncrona. Los espectáculos se etiquetan dinámicamente según la aptitud del clima.
- **Supabase (PostgreSQL Cloud)**: Backend como servicio (BaaS) encargado de proveer autenticación de administradores, almacenamiento relacional persistente para los espectáculos y resguardo para las métricas de consultas de los usuarios.

---

## 3. Modelo de Datos y Tipos de Datos Definidos

La robustez del proyecto descansa en su sistema de tipos riguroso desarrollado en TypeScript, lo que minimiza errores de integración en tiempo de ejecución. El modelo reside en `src/types.ts`.

### 3.1. Enums y Tipos de Dominio
```typescript
export type TipoEspectaculo = 'baile' | 'cantado' | 'show_completo';
export type TipoPrecio = 'gratuito' | 'economico' | 'premium';
export type TipoAmbiente = 'aire_libre' | 'techado';
export type TipoHorario = 'vespertino' | 'nocturno';
```

### 3.2. Estructura del Espectáculo (`Espectaculo`)
Cada espectáculo cultural del catálogo de TangoBA responde a la siguiente estructura relacional y de interfaz:

| Campo | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `string` | No | Identificador único (UUID en Supabase o hash local). |
| `nombre` | `string` | No | Título principal del espectáculo (ej: "Milonga de San Telmo"). |
| `descripcion` | `string` | No | Resumen estilístico, artistas involucrados o detalles particulares. |
| `tipo` | `TipoEspectaculo` | No | Categoría artística: milonga o clase (`baile`), concierto (`cantado`), u obra de teatro con cena (`show_completo`). |
| `precio_tipo` | `TipoPrecio` | No | Escala económica: gratis, costo moderado o tarifa premium. |
| `precio_valor` | `number` | No | Valor numérico real expresado en pesos argentinos o USD. |
| `ambiente` | `TipoAmbiente` | No | Tipo de locación física: exterior (`aire_libre`) o interior (`techado`). |
| `horario_tipo` | `TipoHorario` | No | Rango general: antes de las 19:00 hs (`vespertino`) o noche tardía (`nocturno`). |
| `hora_inicio` | `string` | No | Hora exacta de inicio (formato de 24 horas `HH:MM`). |
| `hora_fin` | `string` | No | Hora aproximada de finalización (`HH:MM`). |
| `direccion` | `string` | No | Calle y número donde se realiza el show. |
| `barrio` | `string` | No | Comuna o barrio de CABA (ej: "Balvanera", "San Telmo", "Boedo"). |
| `latitud` | `number` | No | Coordenada geográfica para posicionado en Leaflet. |
| `longitud` | `number` | No | Coordenada geográfica para posicionado en Leaflet. |
| `imagen_url` | `string` | Sí | Enlace a una imagen ilustrativa o fotografía del evento. |
| `dias_semana` | `string[]` | No | Lista de días activos (ej: `['lunes', 'sabado', 'domingo']`). |
| `contacto` | `string` | Sí | Teléfono o correo de reservas y consultas generales. |
| `website` | `string` | Sí | Enlace al portal web oficial o red social de reservas. |
| `activo` | `boolean` | No | Interruptor de visibilidad para suspender shows temporalmente. |
| `creado_en` | `string` | Sí | Fecha de creación del registro. |

### 3.3. Estructura de Estado Climático (`ClimaState`)
Esta interfaz guarda la información meteorológica procesada de Buenos Aires que interactúa de manera reactiva con los filtros de lluvia.



### 3.4. Registro de Estadísticas de Uso (`ConsultaLog`)
Cada vez que un usuario realiza una búsqueda en el mapa u organiza un itinerario, la aplicación genera y guarda una métrica anónima para que los administradores identifiquen los intereses y barrios con mayor demanda de tango.




---

## 4. Instalación, Configuración y Despliegue

La plataforma está diseñada con una estructura estándar que simplifica su instalación local y compilación para producción.

### 4.1. Requisitos Previos
- **Node.js**: Versión 18.0.0 o superior recomendada.
- **NPM**: Versión 9.0.0 o superior.
- **Acceso a Internet**: Necesario tanto para la carga interactiva de mosaicos geográficos (Leaflet CartoDB tiles) como para consultar la API de clima de Open-Meteo.

### 4.2. Declaración de Variables de Entorno (`.env.example`)
Crea un archivo `.env` en la raíz del proyecto para alojar las claves del entorno de desarrollo o producción:
```env
# URL de API de tu proyecto Supabase
VITE_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co

# Clave pública anónima de API de Supabase para transacciones del cliente
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

*Nota: La aplicación dispone de un modo "fallback" (Local Storage) sumamente refinado en caso de que las variables de Supabase no estén configuradas o no se pueda establecer contacto con la base de datos remota, garantizando que el sistema sea siempre utilizable.*

### 4.3. Scripts de Comando
La ejecución y mantenimiento de la aplicación se gestiona mediante los siguientes scripts definidos en el archivo de manifiesto `package.json`:

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar el servidor local de desarrollo con HMR (Hot Module Replacement)
# Por defecto se levanta en el puerto 3000 de acuerdo a las directivas del proxy de Cloud Run
npm run dev

# 3. Validar sintaxis y detectar errores en código TypeScript (Linter de Tipos)
npm run lint

# 4. Compilar la aplicación optimizada para producción
# Genera los archivos estáticos listos en el directorio /dist
npm run build

# 5. Previsualizar la build de producción de manera local
npm run preview
```

---

## 5. Módulo de Mapas Interactivos (Leaflet Deep-Dive)

El mapa interactivo representa el componente central sobre el cual el usuario consume la información de espectáculos. Su montaje e inicialización se realiza en el hook `useEffect` principal en `src/App.tsx`.


### 5.1. Inicialización Robusta del Mapa
Para evitar errores clásicos de Leaflet como `Map container is already initialized`, el código de TangoBA emplea referencias de React (`useRef`) para encapsular de manera persistente las instancias cartográficas.
Cuando el mapa se levanta en la interfaz, se asocia al elemento del DOM identificado con el ID único `'mapa-principal'.


### 5.2. Georreferenciación y Marcadores Personalizados de Usuario
El mapa detecta la posición real del usuario haciendo uso de las capacidades nativas del navegador mediante `navigator.geolocation.getCurrentPosition`. 
Para evitar comportamientos inesperados de posicionamiento en dispositivos de pruebas o servidores remotos que retornen coordenadas nulas o corrompidas, el código sanitiza exhaustivamente las variables geográficas antes de mapear la posición.


### 5.3. Encuadre Automático de Espectáculos (FlyToBounds)
Al actualizar el catálogo según los filtros activos, la interfaz geográfica no permanece estática. Se calcula en tiempo real un marco geográfico (`bounding box`) conteniendo todos los espectáculos que cumplen con el criterio seleccionado, ajustando el nivel de zoom y el centro del mapa mediante un deslizamiento fluido (`flyToBounds`).


### 5.4. El Desafío del Minimapa en Modales
Cuando un usuario selecciona un espectáculo de la cartelera, se abre un diálogo modal detallado con la información expandida. Para brindar un contexto geográfico inmediato, el modal incluye su propio mini-mapa interactivo independiente de ID `'minimapa-modal'`.

Este escenario plantea dos retos principales para la estabilidad del navegador:
1. El modal puede montarse antes de que su contenedor HTML esté disponible en el DOM, ocasionando fallos de inicialización.
2. Al cerrar el modal, las referencias del mapa anterior quedan retenidas en memoria activa, gatillando errores si se intenta volver a abrir otro detalle.

Para superar este comportamiento problemático, se estructuró un flujo asincrónico coordinado y protegido en un efecto secundario de ciclo de vida (`useEffect`), garantizando que se limpie la memoria existente y que los valores lat/long sean estrictamente analizados antes de intentar montar el minimapa.


## 6. Motor de Filtrado Inteligente y Adaptabilidad Climática

El valor distintivo de TangoBA es su capacidad para combinar las consultas tradicionales con eventos del mundo físico, interactuando activamente con factores climatológicos.

```
+------------------------------------------------------------+
|  FILTRO DE ENTRADA (Tipo, Precio, Ambiente, Horario, Día)  |
+------------------------------------------------------------+
                             |
                             v
+------------------------------------------------------------+
|  ¿HAY LLUVIA DETECTADA POR OPEN-METEO?                      |
|  [Sí / No]                                                 |
+------------------------------------------------------------+
        |                                            |
        | Sí                                         | No
        v                                            v
+--------------------------------------------+ +--------------------------------------------+
|  Recomendar Espectáculos Techados          | |  Mostrar todos los shows aplicando el     |
|  - Alerta de suspensión al aire libre      | |  criterio regular de búsqueda             |
+--------------------------------------------+ +--------------------------------------------+
```

### 6.1. Integración en Tiempo Real con Open-Meteo
La aplicación realiza una consulta asíncrona a la estación meteorológica georreferenciada en Buenos Aires para estructurar un reporte climático en tiempo real:

```typescript
const fetchWeather = async () => {
  const lat = -34.6037;
  const lon = -58.3816;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=America%2FArgentina%2FBuenos_Aires`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const current = data.current;

    const precipitacion = current.precipitation || 0;
    const temp = current.temperature_2m || 15;
    const codigoClima = current.weather_code || 0;

    // Determinar si hay indicios activos de precipitaciones o lloviznas
    const esLluvia = precipitacion > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(codigoClima);
    
    setClima({
      temperatura: Math.round(temp),
      humedad: current.relative_humidity_2m || 70,
      precipitacion: precipitacion,
      viento: Math.round(current.wind_speed_10m || 10),
      codigo: codigoClima,
      condicion: weatherDescriptions[codigoClima] || 'Despejado',
      emoji: weatherEmojis[codigoClima] || '☀️',
      esLluvia,
      esFrio: temp < 15,
      esIdeal: !esLluvia && temp >= 18 && temp <= 26
    });
  } catch (err) {
    console.error('Error al consultar clima en tiempo real:', err);
  }
};
```

### 6.2. Filtro Inteligente Anti-Lluvia e Itinerario Sugerido
Si `clima.esLluvia` es verdadero:
1. La plataforma muestra un **Banner de Alerta Climatológica** en la parte superior, recomendando a locales y turistas optar por milongas y salones techados tradicionales (como los famosos clubes de barrio porteños o confiterías).
2. Se inyecta una bandera visual `tagClima: 'alerta'` en aquellos espectáculos cuyo atributo de `ambiente` sea `'aire_libre'`, advirtiendo al usuario de su posible suspensión debido a las lluvias.
3. Se agrega un acceso directo para **"Filtrar Shows Bajo Techo"** que re-configura instantáneamente la interfaz para proteger al usuario de las inclemencias del tiempo.

### 6.3. Buscador Inteligente por Lenguaje Natural (Gemini API & Heurística de Respaldo)
TangoBA incorpora un avanzado buscador por lenguaje natural que simplifica drásticamente la experiencia del usuario.

#### 6.3.1. Arquitectura y Consulta Asíncrona a la API de Gemini
Cuando el usuario escribe una frase de búsqueda (por ejemplo, *"quiero un show de baile el sabado a la noche"*), la aplicación realiza una solicitud `POST` asíncrona hacia el endpoint seguro de backend `/api/gemini/search`. Este servicio está impulsado por el SDK `@google/genai` empleando el modelo de última generación **`gemini-3.5-flash`**.

El backend configura instrucciones de sistema detalladas y un esquema de respuesta estricto (`responseSchema`) en formato JSON para mapear la entrada en filtros relacionales:
- `tipo`: `'baile'` (milongas, clases), `'cantado'` (conciertos), o `'show_completo'` (cenas-show).
- `precio`: `'gratuito'` (sin costo), `'economico'` (accesibles), o `'premium'` (cena show premium).
- `ambiente`: `'aire_libre'` (plazas, calles, Caminito) o `'techado'` (salones, teatros).
- `horario`: `'vespertino'` (tarde) o `'nocturno'` (noche, trasnoche).
- `dias`: Lista de días de la semana en minúsculas (`lunes` a `domingo`).

#### 6.3.2. Mapeo Temporal Inteligente y Sincronización de Calendario
La consulta envía la fecha y hora actual del cliente (`clientDate`) para permitir que la IA deduzca dinámicamente referencias relativas del lenguaje natural, tales como *"hoy"*, *"mañana"*, *"este fin de semana"* o *"esta noche"*. 
Al retornar los filtros interpretados:
1. Los días detectados se mapean automáticamente a las fechas correspondientes en el mes actual del calendario interactivo del cliente.
2. Tanto los chips de filtros manuales como el **Calendar Picker** de la interfaz se sincronizan visualmente para dar un feedback inmediato y transparente al usuario.

#### 6.3.3. Sistema de Heurística de Respaldo (Modo Offline Activo)
Para garantizar una alta disponibilidad de la plataforma y evitar fallas críticas de ejecución, el servidor incorpora un sofisticado analizador heurístico local. En caso de que la clave de API `GEMINI_API_KEY` no esté configurada:
- El backend escanea la frase mediante expresiones regulares y búsquedas de palabras clave en español (por ejemplo, identificando *"gratis"* o *"libre"* para el precio gratuito; *"finde"* o *"fin de semana"* para activar el sábado y domingo; y *"hoy"* o *"mañana"* calculando el índice de día actual mediante ciclos `Date`).
- Retorna un set de filtros estructurados junto con una explicación que notifica que el **Modo Offline** está activo.

---

## 7. Panel de Administración (Seguridad y Ciclo de Vida de Sesión)

Para garantizar la actualización constante de la agenda de espectáculos, TangoBA incluye un panel de control con accesos protegidos.

### 7.1. Resolución del Acceso Automatizado No Deseado
Anteriormente, al acceder al panel de administración, campos de credenciales de sesión se completaban automáticamente con valores por defecto de demostración, permitiendo que cualquier persona ingresara sin autenticación efectiva.

Para corregir esta vulnerabilidad, se rediseñó el ciclo de vida de los estados del login. Ahora, la aplicación **blanquea por completo** el estado de las credenciales del formulario tanto al cerrar la sesión como al iniciar un nuevo intento de acceso. De este modo, los campos de entrada quedan limpios y exigen que la persona con privilegios escriba manualmente los datos reales cada vez que acceda al panel:

```typescript
// 1. Asegurar limpieza absoluta de campos al cerrar sesión
const handleAdminLogout = async () => {
  try {
    await logoutAdmin();
  } catch (err) {
    console.warn('Error al cerrar sesión de Supabase:', err);
  }
  // Borrar variables en memoria del estado de login
  setAdminEmail('');
  setAdminPassword('');
  setAdminLoggedIn(false);
  triggerToast('Sesión cerrada correctamente', 'info');
};

// 2. Asegurar limpieza absoluta de campos al abrir el Modal de Autenticación
// Vinculado al botón de acceso al panel
const openLoginModal = () => {
  setAdminEmail('');
  setAdminPassword('');
  setAdminShowLoginModal(true);
};
```

### 7.2. Eliminación de Contraseñas del Formulario de Inicio de Sesión
Como medida complementaria de seguridad para evitar que las credenciales queden en memoria del cliente o se expongan en herramientas de desarrollo, el sistema remueve la contraseña del estado inmediatamente después de procesar el intento de inicio de sesión:

```typescript
const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const user = await loginAdmin(adminEmail, adminPassword);
    setAdminLoggedIn(true);
    setAdminShowLoginModal(false);
    setAdminPassword(''); // Blanquear contraseña por seguridad
    triggerToast('Sesión de administrador iniciada con Supabase', 'success');
    loadAllAdminShows();
  } catch (err: any) {
    // Si falla Supabase, comprobar credenciales de respaldo local
    if (adminEmail === 'admin@tangoba.com' && adminPassword === 'admin') {
      setAdminLoggedIn(true);
      setAdminShowLoginModal(false);
      setAdminPassword(''); // Blanquear contraseña por seguridad
      triggerToast('Sesión iniciada con credenciales demo (Local)', 'success');
      loadAllAdminShows();
    } else {
      setAdminPassword(''); // Blanquear contraseña por seguridad en caso de error
      triggerToast(err.message || 'Credenciales incorrectas de administrador', 'error');
    }
  }
};
```

### 7.3. Sanitización Estricta de Entradas Numéricas Geográficas (CRUD)
Un error recurrente al registrar espectáculos de manera manual es el ingreso de coordenadas con coma decimal en lugar de punto (ej: `-34,603` en vez de `-34.603`). Este error corrompe los objetos LatLng en Leaflet, congelando el navegador con un error fatal en la consola (`Invalid LatLng object: (NaN, NaN)`).

El panel de TangoBA previene este error antes de la persistencia transformando las entradas y aplicando valores de control en caso de que los datos ingresados sean incorrectos:

```typescript
const cleanLat = String(formLatitud).replace(',', '.').trim();
const cleanLng = String(formLongitud).replace(',', '.').trim();

const parsedLat = cleanLat === '' ? -34.6037 : Number(cleanLat);
const parsedLng = cleanLng === '' ? -58.3816 : Number(cleanLng);

const finalLat = isNaN(parsedLat) ? -34.6037 : parsedLat;
const finalLng = isNaN(parsedLng) ? -58.3816 : parsedLng;
```

---

## 8. Sistema de Analíticas y Logs de Búsqueda

A diferencia de las aplicaciones estáticas que no procesan la interacción del usuario, TangoBA implementa un motor de auditoría integrado que procesa los filtros aplicados por el público.

### 8.1. Registro Silencioso de Consultas
Cada vez que un usuario ajusta un criterio en los filtros de búsqueda, se genera una llamada asincrónica en un segundo plano (evitando retrasos de hilos en la UI principal) que envía un registro detallado hacia la tabla `consulta_logs`:

```typescript
const registrarLogBusqueda = async (filtros: FiltrosState, totalResultados: number) => {
  // Generar o recuperar UUID persistente de la sesión del visitante en LocalStorage
  let sessionId = localStorage.getItem('tangoba_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('tangoba_session_id', sessionId);
  }

  const logPayload: ConsultaLog = {
    filtro_tipo: filtros.tipo || null,
    filtro_precio: filtros.precio || null,
    filtro_ambiente: filtros.ambiente || null,
    filtro_horario: filtros.horario || null,
    filtro_dia: filtros.dias.length > 0 ? filtros.dias.join(',') : null,
    resultados_count: totalResultados,
    clima_condicion: clima ? clima.condicion : null,
    clima_temp: clima ? clima.temperatura : null,
    uso_gemini: false,
    session_id: sessionId
  };

  try {
    await saveConsultaLog(logPayload);
  } catch (e) {
    console.warn('Fallo registro silencioso de analíticas (Modo Offline activo):', e);
  }
};
```

### 8.2. Tablero de Estadísticas de Administrador
El panel de control lee y analiza estos datos de uso históricos para presentar gráficos integrados con métricas agregadas que resumen:
- El porcentaje de demanda según el tipo de espectáculo (Milongas frente a Shows con cena).
- Las búsquedas realizadas en días de lluvia versus jornadas de buen clima.
- El volumen histórico diario de consultas para medir la afluencia turística estacional.

---

## 9. Respaldo de Información (Backup, Import & Export de Datos)

En la gestión cultural de eventos dinámicos, es crucial contar con copias de respaldo de la cartelera para evitar la pérdida de información debido a migraciones de bases de datos o fallos de conexión.

### 9.1. Motor de Exportación en Formato JSON
El sistema consolida el catálogo activo de espectáculos en memoria, crea un archivo Blob, genera una URL temporal y dispara una descarga automática en el navegador del administrador:

```typescript
const exportarCarteleraBackup = () => {
  try {
    const dataStr = JSON.stringify(espectaculos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const fecha = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `tangoba_backup_${fecha}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    triggerToast('Backup exportado exitosamente', 'success');
  } catch (err) {
    triggerToast('Error al exportar los datos', 'error');
  }
};
```

### 9.2. Importador con Validación Estricta de Campos
Para restaurar información, el administrador puede cargar cualquier archivo `.json` de respaldo anterior. El lector parsea y verifica la integridad del archivo para confirmar que contiene las propiedades mínimas requeridas antes de actualizar los registros:

```typescript
const importarCarteleraBackup = (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      
      if (!Array.isArray(json)) {
        throw new Error('El archivo de respaldo debe contener una lista válida.');
      }

      // Validar propiedades esenciales de la interfaz Espectaculo
      const validados = json.filter(item => {
        return item.nombre && item.direccion && item.dias_semana && Array.isArray(item.dias_semana);
      });

      if (validados.length === 0) {
        throw new Error('No se encontraron espectáculos válidos en el archivo.');
      }

      // Guardar espectáculos validados en la base de datos
      await saveImportedShows(validados);
      triggerToast(`Importación exitosa: ${validados.length} shows restablecidos`, 'success');
      fetchEspectaculosList();
    } catch (err: any) {
      triggerToast(`Fallo la importación: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
};
```

---

## 10. Guía de Usuario y Flujos Operativos





---

### 10.1. El Itinerario del Espectador


1. **Acceso Inicial**: Al abrir la aplicación, el usuario ve el mapa centrado en Buenos Aires junto a una tarjeta con el estado climático en tiempo real.
2. **Exploración Visual**: El espectador puede navegar libremente, hacer clic en los marcadores de colores (verde para shows gratuitos, naranja para opciones económicas, rojo para propuestas de categoría premium) y ver los resúmenes flotantes.
3. **Búsqueda Filtrada**: Haciendo uso de la barra de filtros, el visitante puede reducir los resultados a, por ejemplo, "Espectáculos los sábados" que tengan "Ambiente techado".
4. **Reproductor de Sonido**: Haciendo clic en el reproductor se puede oir el tango La Cumparsita como musica de fondo acompañando las diferentes busquedas.

### 10.2. Flujo de Trabajo para el Administrador
1. **Acceso Seguro**: El gestor presiona el botón **"Admin"** de la barra superior. Se le despliega el formulario limpio de autenticación, donde ingresa sus credenciales.
2. **Alta de Nuevo Evento**: Presiona **"Crear Espectáculo"**, completa el formulario, detalla el barrio porteño, asigna el tipo de tarifa y define el itinerario de días de la semana en los que se repite el show.
3. **Control Cartográfico Directo**: Al ingresar las coordenadas, el sistema realiza una previsualización interactiva sobre el minimapa del formulario para corroborar que la ubicación coincide con la dirección física real.
4. **Mantenimiento Periódico**: Al finalizar la jornada o cambiar los precios, el administrador edita los valores directamente en la grilla y exporta un respaldo en formato JSON para mayor seguridad.

---


### 10.3   Funcionalidades detalladas

###  Buscador con filtros múltiples

Filtrá espectáculos combinando cualquiera de estos criterios:

#### Tipo de espectáculo

| Opción | Descripción |
|---|---|
| 💃 Solo Baile / Milonga | Pistas de baile, milongas para ir a bailar |
| 🎤 Cantado / Concierto | Orquestas típicas, cantantes en vivo |
| 🎭 Show Completo | Cena-show clásica con todo incluido |

#### Precio

| Opción | Descripción | Ejemplos |
|---|---|---|
| ✅ Gratuito | Sin costo | Eventos GCBA, plazas, centros culturales |
| 💙 Económico | Accesible | Milongas populares, centros culturales barriales |
| ⭐ Premium | Alto valor | Casas de tango con cena show para turistas |

#### Ambiente

| Opción | Descripción |
|---|---|
| ☀️ Al Aire Libre | Plazas, anfiteatros, Caminito, calles emblemáticas |
| 🏛️ Techado / Salón | Clubs de barrio, teatros, salones |

#### Horario

| Opción | Descripción |
|---|---|
| 🌅 Vespertino | Ideal para espectáculos callejeros y clases iniciales |
| 🌙 Nocturno / Trasnoche | El horario fuerte de las milongas porteñas |

#### Calendario seleccionando fechas
---

### Búsqueda con Inteligencia Artificial

Gracias a la integración con **Google Gemini AI** podés buscar escribiendo en lenguaje natural sin usar los filtros manuales.

**Ejemplos de búsquedas válidas:**

```
"Quiero ver tango gratis este domingo"
"Milonga para bailar el sábado a la noche"
"Show con cena que no sea muy caro"
"Algo al aire libre si hace buen tiempo"
"Orquesta típica en vivo esta semana"
"Tango gratuito en plaza"
"Milonga de trasnoche en Palermo"
```

La IA interpreta el texto y aplica los filtros correctos
mostrando además una explicación de lo que encontró.

---

### Integración inteligente con el clima

El sistema consulta el clima de Buenos Aires en **tiempo real** y toma decisiones automáticas:

| Condición | Acción del sistema |
|---|---|
| ☀️ Clima ideal (16°C–26°C, sin lluvia) | Destaca eventos al aire libre con **"¡Ideal para hoy!"** |
| 🌧️ Lluvia detectada | Alerta en eventos al aire libre: **"Podría suspenderse"** |
| 🥶 Frío extremo (menos de 6°C) | Recomienda eventos en espacios techados |

El widget del clima en el encabezado muestra:
- Temperatura actual en grados Celsius
- Descripción del estado del tiempo
- Porcentaje de humedad
- Velocidad del viento en km/h

---

### Mapa interactivo con geolocalización

- Mapa con todos los espectáculos encontrados
- Marcadores de colores según precio del evento
- Popup informativo al hacer clic en cada marcador
- Mini-mapa en el detalle de cada espectáculo
- Botón para centrar el mapa en tu ubicación actual
- Zoom automático para mostrar todos los resultados
- Estilo de mapa claro y legible

---

### Panel de análisis para KNIME

Cada búsqueda realizada queda registrada automáticamente con datos del filtro usado, resultados obtenidos.

Desde el panel que esta integrado al acceder con usuario y contraseña, con acceso solo para el Administrador podés:
- Filtrar el rango de fecha de la informacion requerida
- Identificar los filtros más utilizados en graficos dinamicos de barras horizontales
- Contabilizar la cantidad de consultas
- Exportar CSV para importar en KNIME
- Obtener la URL de la API REST de Supabase

---

### Panel de administración protegido

Sistema completo para gestionar el contenido de la app:
- Login con email y contraseña (Supabase Auth) para uso exclusivo del administrador
- Formulario para cargar nuevos espectáculos 
- Lista de todos los eventos con edición y borrado
- Toggle para activar o desactivar eventos
- Panel de análisis para KNIME
- Cambio de contraseña con indicador de fortaleza
- Acceso desde cualquier dispositivo o navegador

---
###  __Readme desarrollado con IA y adaptado segun criterio personal__





