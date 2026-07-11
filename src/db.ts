import { Espectaculo, FiltrosState, ConsultaLog, TipoPrecio } from './types';
import { supabase } from './supabase';

// Helper to deterministically assign random price: some free, others between 15.000 and 35.000
export function getDeterministicPrice(id: string): { valor: number; tipo: TipoPrecio } {
  let hash = 0;
  const str = id || '';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Deterministically decide if it's free (e.g. ~25% of the time based on hash)
  const isFree = (Math.abs(hash) % 4) === 0;
  
  if (isFree) {
    return { valor: 0, tipo: 'gratuito' };
  }
  
  const min = 15000;
  const max = 35000;
  const range = max - min;
  const rawVal = Math.abs(hash) % (range + 1);
  // Round to nearest 500 for clean currency display
  const rounded = Math.round((min + rawVal) / 500) * 500;
  const precio_valor = Math.min(max, Math.max(min, rounded));
  
  // Divide into economic vs premium based on $25,000 threshold
  const precio_tipo: TipoPrecio = precio_valor <= 25000 ? 'economico' : 'premium';
  return { valor: precio_valor, tipo: precio_tipo };
}

// Helper to apply random/deterministic prices and make some shows free
export function applyDeterministicPrices(list: Espectaculo[]): Espectaculo[] {
  let mapped = list.map(e => {
    // Force specific ones to be free if wanted, or let getDeterministicPrice handle it
    if (
      e.id === 'm2' || 
      e.id === 'm5' || 
      e.id === 'm12' || 
      e.nombre.toLowerCase().includes('gratuito') || 
      e.nombre.toLowerCase().includes('glorieta') || 
      e.nombre.toLowerCase().includes('anfiteatro')
    ) {
      return {
        ...e,
        precio_valor: 0,
        precio_tipo: 'gratuito' as TipoPrecio
      };
    }
    const { valor, tipo } = getDeterministicPrice(e.id);
    return {
      ...e,
      precio_valor: valor,
      precio_tipo: tipo
    };
  });

  // Ensure there are at least 3 free shows
  const freeCount = mapped.filter(e => e.precio_tipo === 'gratuito').length;
  if (freeCount < 3 && mapped.length >= 3) {
    const indicesToMakeFree = [1, 4, 11].filter(idx => idx < mapped.length);
    mapped = mapped.map((e, index) => {
      if (indicesToMakeFree.includes(index)) {
        return {
          ...e,
          precio_valor: 0,
          precio_tipo: 'gratuito' as TipoPrecio
        };
      }
      return e;
    });
  }

  return mapped;
}

// Helper to get persistent session id
export function getSessionId(): string {
  let s = sessionStorage.getItem('tb_session');
  if (!s) {
    s = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('tb_session', s);
  }
  return s;
}

// Fallback Mock Data
export const MOCK_ESPECTACULOS: Espectaculo[] = [
  { 
    id: 'm1', 
    nombre: 'Milonga del Indio',
    descripcion: 'La milonga más tradicional de San Telmo en plaza histórica. Pista al aire libre e histórica de madera cuando llueve.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 500,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '22:00', 
    hora_fin: '03:00',
    direccion: 'Humberto Primo 462, San Telmo', 
    barrio: 'San Telmo',
    latitud: -34.6218, 
    longitud: -58.3730,
    imagen_url: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['viernes', 'sabado'], 
    website: 'https://www.facebook.com/milongadelindiosantelmo', 
    activo: true 
  },
  { 
    id: 'm2', 
    nombre: 'Tango en Plaza Dorrego',
    descripcion: 'El show más icónico de Buenos Aires, bailado por profesionales en el corazón de la feria histórica. Todos los domingos.',
    tipo: 'show_completo', 
    precio_tipo: 'gratuito', 
    precio_valor: 0,
    ambiente: 'aire_libre', 
    horario_tipo: 'vespertino',
    hora_inicio: '17:00', 
    hora_fin: '20:00',
    direccion: 'Plaza Dorrego s/n, San Telmo', 
    barrio: 'San Telmo',
    latitud: -34.6231, 
    longitud: -58.3695,
    imagen_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['domingo'], 
    website: 'https://turismo.buenosaires.gob.ar', 
    activo: true 
  },
  { 
    id: 'm3', 
    nombre: 'Orquesta Típica Ciudad Baile',
    descripcion: 'Concierto de tango de gran orquesta clásica con cantantes en vivo. Gran acústica y ambiente de época.',
    tipo: 'cantado', 
    precio_tipo: 'economico', 
    precio_valor: 1200,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '21:00', 
    hora_fin: '23:30',
    direccion: 'Av. Corrientes 1234, Centro', 
    barrio: 'Centro',
    latitud: -34.6037, 
    longitud: -58.3816,
    imagen_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['jueves', 'sabado'], 
    website: undefined, 
    activo: true 
  },
  { 
    id: 'm4', 
    nombre: 'Café de los Angelitos',
    descripcion: 'La experiencia de tango más lujosa e histórica. Cena show de tres pasos con orquesta en vivo, bailarines de nivel internacional y vestuarios espectaculares.',
    tipo: 'show_completo', 
    precio_tipo: 'premium', 
    precio_valor: 18000,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '20:00', 
    hora_fin: '23:00',
    direccion: 'Av. Rivadavia 2100, Balvanera', 
    barrio: 'Balvanera',
    latitud: -34.6089, 
    longitud: -58.3925,
    imagen_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    website: 'https://www.cafedelosangelitos.com', 
    activo: true 
  },
  { 
    id: 'm5', 
    nombre: 'Tango Callejero en Caminito',
    descripcion: 'Espectáculo al aire libre gratuito en el pasaje más colorido de La Boca. Bailarines y cantantes se presentan de forma continua.',
    tipo: 'baile', 
    precio_tipo: 'gratuito', 
    precio_valor: 0,
    ambiente: 'aire_libre', 
    horario_tipo: 'vespertino',
    hora_inicio: '14:00', 
    hora_fin: '19:00',
    direccion: 'Caminito s/n, La Boca', 
    barrio: 'La Boca',
    latitud: -34.6345, 
    longitud: -58.3631,
    imagen_url: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['sabado', 'domingo'], 
    website: undefined, 
    activo: true 
  },
  { 
    id: 'm6', 
    nombre: 'La Viruta Tango Club',
    descripcion: 'Mítica escuela y milonga de trasnoche en Palermo Soho. Ideal para aprender los primeros pasos y bailar hasta el amanecer.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 1500,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '23:00', 
    hora_fin: '05:00',
    direccion: 'Armenia 1366, Palermo', 
    barrio: 'Palermo',
    latitud: -34.5869, 
    longitud: -58.4291,
    imagen_url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['miercoles', 'viernes', 'sabado', 'domingo'],
    website: 'https://www.lavirutatango.com', 
    activo: true 
  },
  { 
    id: 'm7', 
    nombre: 'Anfiteatro Parque Centenario',
    descripcion: 'Ciclos de conciertos y espectáculos de tango gratuitos bajo las estrellas, organizados por el Gobierno de la Ciudad.',
    tipo: 'show_completo', 
    precio_tipo: 'gratuito', 
    precio_valor: 0,
    ambiente: 'aire_libre', 
    horario_tipo: 'vespertino',
    hora_inicio: '16:00', 
    hora_fin: '19:00',
    direccion: 'Av. Ángel Gallardo 490, Caballito', 
    barrio: 'Caballito',
    latitud: -34.6063, 
    longitud: -58.4388,
    imagen_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['domingo'], 
    website: 'https://www.buenosaires.gob.ar/agendacultural', 
    activo: true 
  },
  { 
    id: 'm8', 
    nombre: 'Centro Cultural Torquato Tasso',
    descripcion: 'Famoso reducto de tango tradicional en San Telmo. Cuenta con shows íntimos de cantantes de culto y milongas tradicionales excelentes.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 800,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '20:00', 
    hora_fin: '02:00',
    direccion: 'Defensa 1575, San Telmo', 
    barrio: 'San Telmo',
    latitud: -34.6264, 
    longitud: -58.3706,
    imagen_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['sabado'], 
    website: 'https://www.torquatotasso.com.ar', 
    activo: true 
  },
  { 
    id: 'm9', 
    nombre: 'Rojo Tango (Hotel Faena)',
    descripcion: 'Espectáculo ultra-premium y cabaret íntimo de vanguardia. Experiencia multisensorial exclusiva con excelente gastronomía y orquesta de primer nivel en Puerto Madero.',
    tipo: 'show_completo', 
    precio_tipo: 'premium', 
    precio_valor: 29000,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '20:30', 
    hora_fin: '23:30',
    direccion: 'Martha Salotti 445, Puerto Madero', 
    barrio: 'Puerto Madero',
    latitud: -34.6125, 
    longitud: -58.3610,
    imagen_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 
    website: 'https://www.rojotango.com', 
    activo: true 
  },
  { 
    id: 'm10', 
    nombre: 'El Viejo Almacén',
    descripcion: 'El templo histórico del tango fundado en 1798. Show tradicional imperdible, cuarteto de cuerdas en vivo, bailarines profesionales y gran ambiente criollo.',
    tipo: 'show_completo', 
    precio_tipo: 'premium', 
    precio_valor: 16500,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '21:00', 
    hora_fin: '23:00',
    direccion: 'Av. Independencia 299, San Telmo', 
    barrio: 'San Telmo',
    latitud: -34.6179, 
    longitud: -58.3751,
    imagen_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 
    website: 'https://viejoalmacen.com.ar', 
    activo: true 
  },
  { 
    id: 'm11', 
    nombre: 'La Catedral Club',
    descripcion: 'Catedral del tango alternativo y bohemio en Almagro. Estética rústica, clases grupales y milonga extendida bajo un enorme techo de madera.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 1800,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '18:00', 
    hora_fin: '03:00',
    direccion: 'Sarmiento 4006, Almagro', 
    barrio: 'Almagro',
    latitud: -34.6061, 
    longitud: -58.4184,
    imagen_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 
    website: 'http://lacatedralclub.com', 
    activo: true 
  },
  { 
    id: 'm12', 
    nombre: 'La Glorieta de Belgrano',
    descripcion: 'Histórico gazebo circular al aire libre en las Barrancas de Belgrano. Milonga popular, clases gratuitas y baile bajo la luna con la brisa del parque.',
    tipo: 'baile', 
    precio_tipo: 'gratuito', 
    precio_valor: 0,
    ambiente: 'aire_libre', 
    horario_tipo: 'vespertino',
    hora_inicio: '18:00', 
    hora_fin: '22:00',
    direccion: '11 de Septiembre 1900, Belgrano', 
    barrio: 'Belgrano',
    latitud: -34.5615, 
    longitud: -58.4468,
    imagen_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['viernes', 'sabado', 'domingo'], 
    website: undefined, 
    activo: true 
  },
  { 
    id: 'm13', 
    nombre: 'Maldita Milonga',
    descripcion: 'Orquesta en vivo ("La Furca") todos los miércoles. Una de las mejores milongas modernas de San Telmo con gran afluencia de jóvenes bailarines.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 1200,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '21:00', 
    hora_fin: '02:00',
    direccion: 'Perú 571, San Telmo', 
    barrio: 'San Telmo',
    latitud: -34.6128, 
    longitud: -58.3752,
    imagen_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['miercoles', 'domingo'], 
    website: 'https://malditamilonga.com', 
    activo: true 
  },
  { 
    id: 'm14', 
    nombre: 'Esquina Homero Manzi',
    descripcion: 'Esquina declarada Monumento Histórico Nacional en Boedo. Espectáculo clásico con arreglos de orquesta tradicional y excelente gastronomía.',
    tipo: 'show_completo', 
    precio_tipo: 'premium', 
    precio_valor: 14500,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '20:00', 
    hora_fin: '23:30',
    direccion: 'Av. San Juan 3601, Boedo', 
    barrio: 'Boedo',
    latitud: -34.6268, 
    longitud: -58.4162,
    imagen_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 
    website: 'http://www.esquinahomeromanzi.com.ar', 
    activo: true 
  },
  { 
    id: 'm15', 
    nombre: 'Piazzolla Tango',
    descripcion: 'Un teatro de época restaurado majestuosamente dentro de la Galería Güemes. Homenaje exclusivo a la obra de Astor Piazzolla con increíbles músicos solistas.',
    tipo: 'show_completo', 
    precio_tipo: 'premium', 
    precio_valor: 17500,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '20:00', 
    hora_fin: '23:00',
    direccion: 'Florida 165, Centro', 
    barrio: 'Centro',
    latitud: -34.6075, 
    longitud: -58.3742,
    imagen_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 
    website: 'https://piazzollatango.com', 
    activo: true 
  },
  { 
    id: 'm16', 
    nombre: 'Milonga Parakultural (Salón Canning)',
    descripcion: 'El punto de encuentro de los mejores bailarines del mundo en Palermo. Noches con orquestas en vivo, exhibiciones de campeones de tango de salón.',
    tipo: 'baile', 
    precio_tipo: 'economico', 
    precio_valor: 2000,
    ambiente: 'techado', 
    horario_tipo: 'nocturno',
    hora_inicio: '21:00', 
    hora_fin: '03:00',
    direccion: 'Scalabrini Ortiz 1331, Palermo', 
    barrio: 'Palermo',
    latitud: -34.5905, 
    longitud: -58.4234,
    imagen_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    dias_semana: ['lunes', 'martes', 'viernes'], 
    website: 'https://www.facebook.com/parakultural', 
    activo: true 
  }
];

// In-memory logs for offline fallback
let localLogs: ConsultaLog[] = [];

// Flag to track if we've already ran the one-time Supabase price seed
let pricesUpdatedInSupabase = false;

// Seed Supabase with random prices between $15,000 and $35,000 once
export async function seedDatabasePricesOnce(): Promise<void> {
  try {
    const { data: shows, error } = await supabase.from('espectaculos').select('id, nombre, precio_valor, precio_tipo');
    if (error) throw error;
    
    if (shows) {
      console.log('Seeding Supabase database with random prices between $15,000 and $35,000...');
      for (const show of shows) {
        const { valor, tipo } = getDeterministicPrice(show.id);
        
        // Update this show in Supabase
        await supabase.from('espectaculos')
          .update({ precio_valor: valor, precio_tipo: tipo })
          .eq('id', show.id);
      }
      console.log('Successfully updated all Supabase shows with new randomized prices!');
    }
  } catch (err) {
    console.warn('Error trying to update prices in Supabase:', err);
  }
}

// Fetch shows applying standard filters
export async function getEspectaculos(filtros: FiltrosState): Promise<Espectaculo[]> {
  try {
    let q = supabase.from('espectaculos').select('*').eq('activo', true);

    if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
    if (filtros.ambiente) q = q.eq('ambiente', filtros.ambiente);
    if (filtros.horario) q = q.eq('horario_tipo', filtros.horario);
    
    // We fetch and filter days manually if standard contains has issues,
    // or use Supabase filter
    const { data, error } = await q;
    if (error) throw error;

    let res = (data || []) as Espectaculo[];
    
    // If database is completely empty (no rows), return mock data
    if (res.length === 0 && (!filtros.tipo && !filtros.ambiente && !filtros.horario && (!filtros.dias || filtros.dias.length === 0))) {
      res = [...MOCK_ESPECTACULOS];
      res = applyDeterministicPrices(res);
    } else if (res.length > 0) {
      // If we have database records and they still have the old default seeds (500 or 1200):
      const hasOldSeeds = res.some(e => 
        (e.nombre === 'Milonga del Indio' && e.precio_valor === 500) || 
        (e.nombre === 'Orquesta Típica Ciudad Baile' && e.precio_valor === 1200)
      );
      if (hasOldSeeds && !pricesUpdatedInSupabase) {
        pricesUpdatedInSupabase = true;
        // Asynchronously update all rows in Supabase in background
        seedDatabasePricesOnce().then(() => {});
        
        // At runtime, for this very first load, we temporarily apply deterministic prices
        // to `res` so they see them immediately without waiting for DB roundtrips!
        res = applyDeterministicPrices(res);
      }
    }

    // In-memory price filtering
    if (filtros.precio) {
      res = res.filter(e => e.precio_tipo === filtros.precio);
    }
    
    // Day of week filtering
    if (filtros.dias && filtros.dias.length > 0) {
      res = res.filter(e => {
        const dWeek = e.dias_semana || [];
        return filtros.dias.some(day => dWeek.includes(day.toLowerCase()));
      });
    }
    
    return res;
  } catch (err) {
    console.warn('Supabase no disponible, usando base de datos mock local:', err);
    return getMockEspectaculos(filtros);
  }
}

function getMockEspectaculos(filtros: FiltrosState): Espectaculo[] {
  const mappedMocks = applyDeterministicPrices(MOCK_ESPECTACULOS);

  return mappedMocks.filter(e => {
    if (filtros.tipo && e.tipo !== filtros.tipo) return false;
    if (filtros.precio && e.precio_tipo !== filtros.precio) return false;
    if (filtros.ambiente && e.ambiente !== filtros.ambiente) return false;
    if (filtros.horario && e.horario_tipo !== filtros.horario) return false;
    if (filtros.dias && filtros.dias.length > 0) {
      const dWeek = e.dias_semana || [];
      const matchesDay = filtros.dias.some(day => dWeek.includes(day.toLowerCase()));
      if (!matchesDay) return false;
    }
    return true;
  });
}

// Log searching queries for analytics/KNIME
export async function registrarConsulta(log: Omit<ConsultaLog, 'fecha' | 'id'>): Promise<void> {
  const finalLog = {
    ...log,
    fecha: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('consultas_log').insert([finalLog]);
    if (error) throw error;
  } catch (err) {
    console.warn('Fallo al guardar log en Supabase, guardando localmente:', err);
    localLogs.push(finalLog);
    if (localLogs.length > 200) localLogs.shift();
  }
}

// Fetch logs for KNIME / Analytics
export async function getLogsKNIME(limite = 50): Promise<ConsultaLog[]> {
  try {
    const { data, error } = await supabase
      .from('consultas_log')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(limite);
    if (error) throw error;
    return (data || []) as ConsultaLog[];
  } catch (err) {
    console.warn('Fallo al obtener logs de Supabase, retornando locales:', err);
    return [...localLogs].reverse().slice(0, limite);
  }
}

// Get total logs count for today
export async function getTotalConsultasHoy(): Promise<number> {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('consultas_log')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', `${hoy}T00:00:00`)
      .lte('fecha', `${hoy}T23:59:59`);
    if (error) throw error;
    return count || 0;
  } catch (err) {
    const hoyStr = new Date().toDateString();
    return localLogs.filter(l => l.fecha && new Date(l.fecha).toDateString() === hoyStr).length;
  }
}

// Standard administration functions for espectáculos (creating, editing, deleting)
export async function adminAgregarEspectaculo(show: Omit<Espectaculo, 'id'>): Promise<Espectaculo> {
  try {
    const { data, error } = await supabase
      .from('espectaculos')
      .insert([show])
      .select();
    if (error) throw error;
    return data[0] as Espectaculo;
  } catch (err) {
    console.warn('Modo local: agregando a mock en memoria');
    const newShow = {
      ...show,
      id: 'm_' + Date.now()
    };
    MOCK_ESPECTACULOS.push(newShow);
    return newShow;
  }
}

export async function adminActualizarEspectaculo(id: string, show: Partial<Espectaculo>): Promise<void> {
  try {
    const { error } = await supabase
      .from('espectaculos')
      .update(show)
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('Modo local: actualizando en mock');
    const idx = MOCK_ESPECTACULOS.findIndex(e => e.id === id);
    if (idx !== -1) {
      MOCK_ESPECTACULOS[idx] = { ...MOCK_ESPECTACULOS[idx], ...show };
    }
  }
}

export async function adminEliminarEspectaculo(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('espectaculos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('Modo local: eliminando de mock');
    const idx = MOCK_ESPECTACULOS.findIndex(e => e.id === id);
    if (idx !== -1) {
      MOCK_ESPECTACULOS.splice(idx, 1);
    }
  }
}

// Supabase Authentication Admin integration
export async function loginAdmin(email: string, contrasena: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: contrasena
  });
  if (error) throw error;
  return data.user;
}

export async function logoutAdmin(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getLoggedAdmin(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

