export type TipoEspectaculo = 'baile' | 'cantado' | 'show_completo';
export type TipoPrecio = 'gratuito' | 'economico' | 'premium';
export type TipoAmbiente = 'aire_libre' | 'techado';
export type TipoHorario = 'vespertino' | 'nocturno';

export interface Espectaculo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoEspectaculo;
  precio_tipo: TipoPrecio;
  precio_valor: number;
  ambiente: TipoAmbiente;
  horario_tipo: TipoHorario;
  hora_inicio: string;
  hora_fin: string;
  direccion: string;
  barrio: string;
  latitud: number;
  longitud: number;
  imagen_url?: string;
  dias_semana: string[];
  contacto?: string;
  website?: string;
  activo: boolean;
  creado_en?: string;
  
  // Dynamic UI indicators computed from weather conditions
  tagClima?: 'ideal' | 'alerta' | null;
  climaDestacado?: boolean;
}

export interface ClimaState {
  temperatura: number;
  humedad: number;
  precipitacion: number;
  viento: number;
  codigo: number;
  condicion: string;
  emoji: string;
  esLluvia: boolean;
  esFrio: boolean;
  esIdeal: boolean;
}

export interface ForecastDia {
  fecha: string;
  temperaturaMax: number;
  temperaturaMin: number;
  probabilidadPrecipitacion: number;
  codigo: number;
  condicion: string;
  emoji: string;
  esLluvia: boolean;
}

export interface FiltrosState {
  tipo: string; // 'baile' | 'cantado' | 'show_completo' | ''
  precio: string; // 'gratuito' | 'economico' | 'premium' | ''
  ambiente: string; // 'aire_libre' | 'techado' | ''
  horario: string; // 'vespertino' | 'nocturno' | ''
  dias: string[]; // ['lunes', 'martes', ...]
}

export interface ConsultaLog {
  id?: string;
  fecha?: string;
  filtro_tipo: string | null;
  filtro_precio: string | null;
  filtro_ambiente: string | null;
  filtro_horario: string | null;
  filtro_dia: string | null;
  resultados_count: number;
  clima_condicion: string | null;
  clima_temp: number | null;
  uso_gemini: boolean;
  session_id: string;
}
