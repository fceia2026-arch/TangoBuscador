import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Lazy-initialize Gemini SDK to fail gracefully if the key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no configurada. Por favor añádela en las variables de entorno de Vercel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        },
      },
    });
  }
  return aiClient;
}

// AI Natural Language Search endpoint for Vercel Serverless Function
app.post('/api/gemini/search', async (req: any, res: any) => {
  const { query, clientDate } = req.body;

  if (!query) {
    res.status(400).json({ error: 'La consulta no puede estar vacía' });
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

// Capture any other /api routes to avoid static route overlap issues
app.use('/api/*', (req: any, res: any) => {
  res.status(404).json({ error: 'Ruta API no encontrada' });
});

export default app;
