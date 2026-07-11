import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK to fail gracefully if the key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada. Por favor añádela en la sección Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// AI Natural Language Search endpoint
app.post('/api/gemini/search', async (req, res) => {
  const { query, clientDate } = req.body;

  if (!query) {
    res.status(400).json({ error: 'La consulta no puede estar vacía' });
    return;
  }

  // Fallback heuristic search if GEMINI_API_KEY is not configured
  if (!process.env.GEMINI_API_KEY) {
    const queryLower = query.toLowerCase();
    
    let tipo = '';
    if (queryLower.includes('baile') || queryLower.includes('milonga') || queryLower.includes('pista')) {
      tipo = 'baile';
    } else if (queryLower.includes('cantado') || queryLower.includes('concierto') || queryLower.includes('orquesta') || queryLower.includes('cantante') || queryLower.includes('música') || queryLower.includes('musica')) {
      tipo = 'cantado';
    } else if (queryLower.includes('cena') || queryLower.includes('completo') || queryLower.includes('show') || queryLower.includes('espectáculo') || queryLower.includes('espectaculo')) {
      tipo = 'show_completo';
    }
    
    let precio = '';
    if (queryLower.includes('gratis') || queryLower.includes('gratuito') || queryLower.includes('sin costo') || queryLower.includes('libre')) {
      precio = 'gratuito';
    } else if (queryLower.includes('económico') || queryLower.includes('economico') || queryLower.includes('barato') || queryLower.includes('accesible')) {
      precio = 'economico';
    } else if (queryLower.includes('premium') || queryLower.includes('caro') || queryLower.includes('lujo') || queryLower.includes('internacional')) {
      precio = 'premium';
    }
    
    let ambiente = '';
    if (queryLower.includes('aire libre') || queryLower.includes('plaza') || queryLower.includes('calle') || queryLower.includes('afuera') || queryLower.includes('caminito') || queryLower.includes('parque')) {
      ambiente = 'aire_libre';
    } else if (queryLower.includes('techado') || queryLower.includes('salón') || queryLower.includes('salon') || queryLower.includes('adentro') || queryLower.includes('teatro') || queryLower.includes('club')) {
      ambiente = 'techado';
    }
    
    let horario = '';
    if (queryLower.includes('tarde') || queryLower.includes('vespertino') || queryLower.includes('día') || queryLower.includes('dia')) {
      horario = 'vespertino';
    } else if (queryLower.includes('noche') || queryLower.includes('nocturno') || queryLower.includes('trasnoche') || queryLower.includes('madrugada')) {
      horario = 'nocturno';
    }
    
    const dias: string[] = [];
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    diasSemana.forEach(d => {
      const normD = d === 'miercoles' ? 'miércoles' : d === 'sabado' ? 'sábado' : d;
      if (queryLower.includes(d) || queryLower.includes(normD)) {
        dias.push(d);
      }
    });
    if (queryLower.includes('finde') || queryLower.includes('fin de semana')) {
      if (!dias.includes('sabado')) dias.push('sabado');
      if (!dias.includes('domingo')) dias.push('domingo');
    }
    
    // Check if query implies "today" or "tomorrow"
    if (queryLower.includes('hoy') || queryLower.includes('esta noche')) {
      const todayIdx = new Date().getDay();
      const todayName = diasSemana[(todayIdx + 6) % 7];
      if (!dias.includes(todayName)) dias.push(todayName);
    } else if (queryLower.includes('mañana') || queryLower.includes('manana')) {
      const tomorrowIdx = (new Date().getDay() + 1) % 7;
      const tomorrowName = diasSemana[(tomorrowIdx + 6) % 7];
      if (!dias.includes(tomorrowName)) dias.push(tomorrowName);
    }

    const labelsTipo: Record<string, string> = { baile: 'Solo Baile / Milonga 💃', cantado: 'Cantado / Concierto 🎤', show_completo: 'Cena Show 🎭' };
    const labelsPrecio: Record<string, string> = { gratuito: 'Gratuito 🟢', economico: 'Económico 🔵', premium: 'Premium 🟡' };
    const labelsAmbiente: Record<string, string> = { aire_libre: 'Al Aire Libre ☀️', techado: 'Sala Techada 🏛️' };
    const labelsHorario: Record<string, string> = { vespertino: 'Vespertino 🌅', nocturno: 'Nocturno 🌙' };

    const detectedFiltrosDesc = [
      tipo ? `Tipo: ${labelsTipo[tipo]}` : '',
      precio ? `Precio: ${labelsPrecio[precio]}` : '',
      ambiente ? `Ambiente: ${labelsAmbiente[ambiente]}` : '',
      horario ? `Horario: ${labelsHorario[horario]}` : '',
      dias.length > 0 ? `Días: ${dias.join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    const explicacion = `Búsqueda inteligente local (Modo Offline): ${detectedFiltrosDesc || 'Todos los espectáculos'}`;

    res.json({ tipo, precio, ambiente, horario, dias, explicacion, isOffline: true });
    return;
  }

  try {
    const ai = getGeminiClient();
    
    // Provide system instruction and strict response schema
    const systemInstruction = `Eres TangoBA, un buscador inteligente de espectáculos de tango en Buenos Aires. 
Analizas la consulta del usuario en lenguaje natural y extraes los filtros adecuados.
La fecha local actual del cliente es: ${clientDate || new Date().toISOString()}. Úsala para deducir días como "hoy", "mañana", "esta noche" o "este fin de semana" (sábado y domingo).
Devuelve el resultado estrictamente en formato JSON que coincida con el esquema indicado. No inventes otros valores de filtros.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analiza esta búsqueda de tango: "${query}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipo: { 
              type: Type.STRING, 
              description: "Tipo de show: 'baile' (pistas, milongas), 'cantado' (conciertos, orquestas típicas), 'show_completo' (cena-show clásica), o vacío '' si no se indica." 
            },
            precio: { 
              type: Type.STRING, 
              description: "Precio: 'gratuito' (sin costo), 'economico' (milongas accesibles), 'premium' (shows internacionales costosos), o vacío '' si no se indica." 
            },
            ambiente: { 
              type: Type.STRING, 
              description: "Ubicación: 'aire_libre' (calles, plazas, anfiteatros, Caminito), 'techado' (salones, teatros), o vacío '' si no se indica." 
            },
            horario: { 
              type: Type.STRING, 
              description: "Horario: 'vespertino' (tarde, clases de día), 'nocturno' (noche, trasnoche, milongas nocturnas), o vacío '' si no se indica." 
            },
            dias: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de días de la semana que encajan en minúsculas (lunes, martes, miercoles, jueves, viernes, sabado, domingo). Si dice 'este finde' incluye 'sabado' y 'domingo'."
            },
            explicacion: { 
              type: Type.STRING, 
              description: "Explicación amigable en español de los filtros que detectaste en su consulta para buscar su espectáculo ideal." 
            }
          },
          required: ['tipo', 'precio', 'ambiente', 'horario', 'dias', 'explicacion']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No se recibió respuesta válida del modelo de IA');
    }

    const filters = JSON.parse(text);
    res.json(filters);
  } catch (error: any) {
    console.error('Error en búsqueda con Gemini:', error);
    res.status(500).json({ 
      error: error.message || 'Error al procesar la consulta con Inteligencia Artificial',
      isOffline: !process.env.GEMINI_API_KEY
    });
  }
});

// Configure Vite or serve static production bundle
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TangoBA] Servidor full-stack iniciado en puerto http://localhost:${PORT}`);
  });
}

startServer();
