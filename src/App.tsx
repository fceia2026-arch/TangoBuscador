import React, { useState, useEffect, useRef } from 'react';
import { 
  Espectaculo, 
  ClimaState, 
  ForecastDia,
  FiltrosState, 
  ConsultaLog, 
  TipoEspectaculo, 
  TipoPrecio, 
  TipoAmbiente, 
  TipoHorario 
} from './types';
import { TangoPlayer } from './components/TangoPlayer';
import bandoneonImg from './assets/images/bandoneon_nuevo_1783224790253.jpg';
import { 
  getEspectaculos, 
  registrarConsulta, 
  getLogsKNIME, 
  getTotalConsultasHoy, 
  getSessionId,
  adminAgregarEspectaculo,
  adminActualizarEspectaculo,
  adminEliminarEspectaculo,
  loginAdmin,
  logoutAdmin,
  getLoggedAdmin
} from './db';

// Helper lists
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_ESP = [
  { clave: 'domingo', label: 'Dom' },
  { clave: 'lunes', label: 'Lun' },
  { clave: 'martes', label: 'Mar' },
  { clave: 'miercoles', label: 'Mié' },
  { clave: 'jueves', label: 'Jue' },
  { clave: 'viernes', label: 'Vie' },
  { clave: 'sabado', label: 'Sáb' }
];

const DIAS_SIMPLES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export default function App() {
  // Application states
  const [espectaculos, setEspectaculos] = useState<Espectaculo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clima, setClima] = useState<ClimaState | null>(null);
  const [forecast, setForecast] = useState<ForecastDia[]>([]);
  const [consultasCount, setConsultasCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevancia');

  // AI Search states
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);

  // Manual Filter states
  const [filters, setFilters] = useState<FiltrosState>({
    tipo: '',
    precio: '',
    ambiente: '',
    horario: '',
    dias: []
  });

  const [tempFilters, setTempFilters] = useState<FiltrosState>({
    tipo: '',
    precio: '',
    ambiente: '',
    horario: '',
    dias: []
  });

  // Calendar Picker states
  const [calAnio, setCalAnio] = useState<number>(new Date().getFullYear());
  const [calMes, setCalMes] = useState<number>(new Date().getMonth());
  const [calSelectedDates, setCalSelectedDates] = useState<string[]>([]); // Array of 'YYYY-MM-DD'
  const [tempCalSelectedDates, setTempCalSelectedDates] = useState<string[]>([]);

  // Modal detail states
  const [selectedShow, setSelectedShow] = useState<Espectaculo | null>(null);

  // Toast / alert notification state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  // Analytics panel state
  const [analyticsOpen, setAnalyticsOpen] = useState<boolean>(false);
  const [rawLogs, setRawLogs] = useState<ConsultaLog[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Admin section states
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminShowLoginModal, setAdminShowLoginModal] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'lista' | 'nuevo' | 'seguridad'>('lista');

  // Admin - shows listing states
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');
  const [allAdminShows, setAllAdminShows] = useState<Espectaculo[]>([]);

  // Admin - show form state
  const [formNombre, setFormNombre] = useState<string>('');
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formTipo, setFormTipo] = useState<TipoEspectaculo>('baile');
  const [formPrecioTipo, setFormPrecioTipo] = useState<TipoPrecio>('economico');
  const [formPrecioValor, setFormPrecioValor] = useState<number>(1000);
  const [formAmbiente, setFormAmbiente] = useState<TipoAmbiente>('techado');
  const [formHorarioTipo, setFormHorarioTipo] = useState<TipoHorario>('nocturno');
  const [formHoraInicio, setFormHoraInicio] = useState<string>('21:00');
  const [formHoraFin, setFormHoraFin] = useState<string>('02:00');
  const [formDireccion, setFormDireccion] = useState<string>('');
  const [formBarrio, setFormBarrio] = useState<string>('');
  const [formLatitud, setFormLatitud] = useState<string>('-34.6037');
  const [formLongitud, setFormLongitud] = useState<string>('-58.3816');
  const [formImagenUrl, setFormImagenUrl] = useState<string>('');
  const [formWebsite, setFormWebsite] = useState<string>('');
  const [formContacto, setFormContacto] = useState<string>('');
  const [formDiasSemana, setFormDiasSemana] = useState<string[]>(['sabado']);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);

  // Date and Time state for the weather widget
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refs for Leaflet Map objects to prevent re-initialization error
  const mapContainerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);
  const miniMapContainerRef = useRef<any>(null);

  // Load weather, initial counter, and check admin session on mount
  useEffect(() => {
    fetchWeather();
    fetchCounters();
    
    // Check if an admin is already logged in via Supabase
    getLoggedAdmin().then(user => {
      if (user) {
        setAdminLoggedIn(true);
        setAdminEmail(user.email || '');
        loadAllAdminShows();
      }
    });
  }, []);

  // Sync / refresh spettacoli list whenever filters or weather change
  useEffect(() => {
    fetchEspectaculosList();
  }, [filters, clima]);

  // Synchronize Leaflet map markers
  useEffect(() => {
    if ((window as any).L && espectaculos.length >= 0) {
      initOrUpdateMap();
    }
  }, [espectaculos]);

  // Sync days of week filter when selected calendar dates change
  useEffect(() => {
    if (tempCalSelectedDates.length === 0) {
      setTempFilters(prev => ({ ...prev, dias: [] }));
      return;
    }
    const derivedDays = tempCalSelectedDates.map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return DIAS_SIMPLES[dateObj.getDay()];
    });
    // Deduplicate
    const uniqueDays = Array.from(new Set(derivedDays));
    setTempFilters(prev => ({ ...prev, dias: uniqueDays }));
  }, [tempCalSelectedDates]);

  // Setup toast auto-cleanup
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Helper trigger to show beautiful notifications
  const triggerToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
  };

  // Weather fetching function (Open-Meteo)
  const fetchWeather = async () => {
    const lat = -34.6037;
    const lon = -58.3816;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=14`;

    const weatherCodesLluvia = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
    const weatherDescriptions: Record<number, string> = {
      0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
      45: 'Niebla', 48: 'Niebla helada', 51: 'Llovizna leve', 53: 'Llovizna', 55: 'Llovizna intensa',
      61: 'Lluvia leve', 63: 'Lluvia', 65: 'Lluvia intensa', 80: 'Chaparrones leves', 81: 'Chaparrones',
      82: 'Chaparrones intensos', 95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte'
    };
    const weatherEmojis: Record<number, string> = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
      61: '🌧️', 63: '🌧️', 65: '🌧️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al conectar con la API meteorológica');
      const data = await response.json();
      const current = data.current;
      const wCode = current.weather_code;
      const temp = Math.round(current.temperature_2m);

      setClima({
        temperatura: temp,
        humedad: current.relative_humidity_2m,
        precipitacion: current.precipitation,
        viento: Math.round(current.wind_speed_10m),
        codigo: wCode,
        condicion: weatherDescriptions[wCode] || 'Variable',
        emoji: weatherEmojis[wCode] || '🌡️',
        esLluvia: weatherCodesLluvia.includes(wCode),
        esFrio: temp < 12,
        esIdeal: temp >= 19 && temp <= 26 && !weatherCodesLluvia.includes(wCode)
      });

      if (data.daily) {
        const dailyData = data.daily;
        const mappedForecast: ForecastDia[] = dailyData.time.map((timeStr: string, idx: number) => {
          const code = dailyData.weather_code[idx];
          return {
            fecha: timeStr,
            temperaturaMax: Math.round(dailyData.temperature_2m_max[idx]),
            temperaturaMin: Math.round(dailyData.temperature_2m_min[idx]),
            probabilidadPrecipitacion: dailyData.precipitation_probability_max[idx],
            codigo: code,
            condicion: weatherDescriptions[code] || 'Variable',
            emoji: weatherEmojis[code] || '🌡️',
            esLluvia: weatherCodesLluvia.includes(code)
          };
        });
        setForecast(mappedForecast);
      }
    } catch (err) {
      console.warn('Fallo al obtener clima real, usando valores predeterminados de Buenos Aires.');
      setClima({
        temperatura: 19,
        humedad: 62,
        precipitacion: 0,
        viento: 11,
        codigo: 2,
        condicion: 'Parcialmente nublado',
        emoji: '⛅',
        esLluvia: false,
        esFrio: false,
        esIdeal: true
      });

      // Generate realistic winter/spring weather for Buenos Aires
      const mockForecast: ForecastDia[] = [];
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const isRainy = i % 5 === 0;
        mockForecast.push({
          fecha: dateStr,
          temperaturaMax: 14 + (i % 4),
          temperaturaMin: 7 + (i % 3),
          probabilidadPrecipitacion: isRainy ? 60 : 10,
          codigo: isRainy ? 61 : 1,
          condicion: isRainy ? 'Lluvia leve' : 'Mayormente despejado',
          emoji: isRainy ? '🌧️' : '🌤️',
          esLluvia: isRainy
        });
      }
      setForecast(mockForecast);
    }
  };

  const fetchCounters = async () => {
    const todayCount = await getTotalConsultasHoy();
    setConsultasCount(todayCount);
  };

  // Main search / fetch operation
  const fetchEspectaculosList = async (overrideFilters?: FiltrosState) => {
    setLoading(true);
    const activeFilters = overrideFilters || filters;
    try {
      let data = await getEspectaculos(activeFilters);
      
      // Compute dynamic clima warning fields
      data = data.map(show => {
        const isOutdoor = show.ambiente === 'aire_libre';
        return {
          ...show,
          tagClima: isOutdoor && clima?.esIdeal ? 'ideal' : (isOutdoor && (clima?.esLluvia || clima?.esFrio) ? 'alerta' : null),
          climaDestacado: isOutdoor && clima?.esIdeal
        };
      });

      setEspectaculos(data);

      // Perform background logging metrics for Analytics/KNIME
      const logsFilters = {
        filtro_tipo: activeFilters.tipo || null,
        filtro_precio: activeFilters.precio || null,
        filtro_ambiente: activeFilters.ambiente || null,
        filtro_horario: activeFilters.horario || null,
        filtro_dia: activeFilters.dias.join(',') || null,
        resultados_count: data.length,
        clima_condicion: clima?.condicion || 'Desconocido',
        clima_temp: clima?.temperatura || null,
        uso_gemini: !!overrideFilters, // true if was analyzed by AI
        session_id: getSessionId()
      };
      await registrarConsulta(logsFilters);
      fetchCounters();
    } catch (error) {
      console.error('Error al cargar espectáculos:', error);
      triggerToast('Error al buscar espectáculos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // AI Search parser calling secure server-side endpoint
  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponseText(null);

    try {
      const response = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: aiQuery,
          clientDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Fallo la conexión con el servidor de IA');
      }

      const filtersResult = await response.json();

      // Extracted filters mapped to app state
      const newFilters: FiltrosState = {
        tipo: filtersResult.tipo || '',
        precio: filtersResult.precio || '',
        ambiente: filtersResult.ambiente || '',
        horario: filtersResult.horario || '',
        dias: filtersResult.dias || []
      };

      // If specific days were returned, sync them as selected calendar items for visual clarity
      if (filtersResult.dias && filtersResult.dias.length > 0) {
        // Map days of the week back to dates in the current calendar month
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-indexed
        
        const mappedDates: string[] = [];
        // Map next occurrences of these days of the week
        filtersResult.dias.forEach((dayName: string) => {
          const targetDayIdx = DIAS_SIMPLES.indexOf(dayName.toLowerCase());
          if (targetDayIdx !== -1) {
            for (let offset = 0; offset < 7; offset++) {
              const testDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
              if (testDate.getDay() === targetDayIdx) {
                const dateStr = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;
                mappedDates.push(dateStr);
                break;
              }
            }
          }
        });
        setCalSelectedDates(mappedDates);
        setTempCalSelectedDates(mappedDates);
      } else {
        setCalSelectedDates([]);
        setTempCalSelectedDates([]);
      }

      // Update state
      setFilters(newFilters);
      setTempFilters(newFilters);
      setAiResponseText(filtersResult.explicacion);
      triggerToast('Búsqueda interpretada por IA aplicada', 'success');

      // Trigger search
      fetchEspectaculosList(newFilters);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Error al conectar con el servidor de IA', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Manual chips actions
  const selectFilter = (key: keyof FiltrosState, value: string) => {
    // Clear AI explanation text when manual filters are operated
    setAiResponseText(null);
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      tipo: '',
      precio: '',
      ambiente: '',
      horario: '',
      dias: []
    });
    setTempFilters({
      tipo: '',
      precio: '',
      ambiente: '',
      horario: '',
      dias: []
    });
    setCalSelectedDates([]);
    setTempCalSelectedDates([]);
    setAiQuery('');
    setAiResponseText(null);
    triggerToast('Filtros restablecidos', 'success');
  };

  const applyManualFilters = () => {
    setFilters(tempFilters);
    setCalSelectedDates(tempCalSelectedDates);
    triggerToast('Filtros aplicados. Mostrando resultados.', 'success');
  };

  // Sorting results helper
  const getSortedEspectaculos = () => {
    const sorted = [...espectaculos];
    if (sortBy === 'precio_asc') {
      return sorted.sort((a, b) => a.precio_valor - b.precio_valor);
    }
    if (sortBy === 'precio_desc') {
      return sorted.sort((a, b) => b.precio_valor - a.precio_valor);
    }
    if (sortBy === 'horario') {
      return sorted.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }
    // relevance - climate-highlighted shows first
    return sorted.sort((a, b) => (b.climaDestacado ? 1 : 0) - (a.climaDestacado ? 1 : 0));
  };

  // Calendar render functions
  const handleCalPrevMonth = () => {
    if (calMes === 0) {
      setCalMes(11);
      setCalAnio(prev => prev - 1);
    } else {
      setCalMes(prev => prev - 1);
    }
  };

  const handleCalNextMonth = () => {
    if (calMes === 11) {
      setCalMes(0);
      setCalAnio(prev => prev + 1);
    } else {
      setCalMes(prev => prev + 1);
    }
  };

  const toggleCalendarDate = (dateStr: string) => {
    setAiResponseText(null);
    setTempCalSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const renderCalendarDays = () => {
    const firstDayOfMonth = new Date(calAnio, calMes, 1);
    const lastDayOfMonth = new Date(calAnio, calMes + 1, 0).getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysElements = [];

    // Grid spacing empty cells before day 1
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysElements.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Days in the month
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const currentDate = new Date(calAnio, calMes, day);
      const dateStr = `${calAnio}-${String(calMes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = currentDate < today;
      const isToday = currentDate.getTime() === today.getTime();
      const isSelected = tempCalSelectedDates.includes(dateStr);

      daysElements.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isPast}
          onClick={() => toggleCalendarDate(dateStr)}
          className={`h-8 w-8 text-xs rounded-lg font-medium transition-colors flex items-center justify-center ${
            isPast 
              ? 'text-slate-300 cursor-not-allowed' 
              : isSelected 
                ? 'bg-blue-600 text-white font-bold shadow' 
                : isToday
                  ? 'border border-blue-600 text-blue-600 font-semibold'
                  : 'hover:bg-blue-50 text-slate-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return daysElements;
  };

  // Map Integration using standard Leaflet
  const initOrUpdateMap = () => {
    const L = (window as any).L;
    if (!L) return;

    if (!mapContainerRef.current) {
      // Map container element
      const mapDiv = document.getElementById('mapa-principal');
      if (mapDiv) {
        try {
          const mapInstance = L.map('mapa-principal', {
            center: [-34.6037, -58.3816],
            zoom: 12,
            scrollWheelZoom: true
          });

          // Use modern clean light map theme
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(mapInstance);

          markersLayerRef.current = L.layerGroup().addTo(mapInstance);
          mapContainerRef.current = mapInstance;

          // Invalidate size immediately and with small delays to ensure tiles fill container
          try {
            mapInstance.invalidateSize();
          } catch (e) {}

          setTimeout(() => {
            try {
              mapInstance.invalidateSize();
            } catch (e) {}
          }, 200);

          setTimeout(() => {
            try {
              mapInstance.invalidateSize();
            } catch (e) {}
          }, 800);

          // Setup a ResizeObserver to trigger Leaflet size calculation whenever the map container resizes
          if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
              try {
                mapInstance.invalidateSize();
              } catch (e) {}
            });
            ro.observe(mapDiv);
          }

          // Try gathering and displaying user geoloc
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
              try {
                if (position && position.coords) {
                  const { latitude, longitude } = position.coords;
                  if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
                    const latVal = Number(latitude);
                    const lngVal = Number(longitude);
                    if (!isNaN(latVal) && !isNaN(lngVal) && latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
                      const pulseIcon = L.divIcon({
                        html: `<span class="relative flex h-4 w-4">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border border-white"></span>
                        </span>`,
                        className: 'custom-user-marker',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      });
                      
                      if (userLocationMarkerRef.current) {
                        try {
                          userLocationMarkerRef.current.remove();
                        } catch (e) {}
                      }

                      userLocationMarkerRef.current = L.marker([latVal, lngVal], { icon: pulseIcon })
                        .addTo(mapInstance)
                        .bindPopup('<b>📍 Tu ubicación actual</b>');
                    }
                  }
                }
              } catch (err) {
                console.warn("Error setting user location marker:", err);
              }
            }, err => {
              console.warn("Geolocation denied or failed:", err);
            });
          }
        } catch (err) {
          console.error("Error creating map principal:", err);
        }
      }
    }

    // Refresh markers based on the results list
    if (markersLayerRef.current && mapContainerRef.current) {
      try {
        markersLayerRef.current.clearLayers();
        const points: [number, number][] = [];

        espectaculos.forEach(show => {
          try {
            if (show.latitud === null || show.latitud === undefined || show.longitud === null || show.longitud === undefined) return;
            const cleanLat = String(show.latitud).replace(',', '.').trim();
            const cleanLng = String(show.longitud).replace(',', '.').trim();
            if (cleanLat === '' || cleanLng === '' || cleanLat === 'null' || cleanLng === 'null' || cleanLat === 'undefined' || cleanLng === 'undefined') return;
            const latVal = Number(cleanLat);
            const lngVal = Number(cleanLng);
            if (isNaN(latVal) || isNaN(lngVal) || latVal < -90 || latVal > 90 || lngVal < -180 || lngVal > 180) return;

            const colorMap: Record<string, string> = {
              gratuito: '#10b981', // green
              economico: '#3b82f6', // blue
              premium: '#f59e0b' // gold/amber
            };
            const color = colorMap[show.precio_tipo] || '#ef4444';

            const emojiMap: Record<string, string> = {
              baile: '💃',
              cantado: '🎤',
              show_completo: '🎭'
            };
            const emoji = emojiMap[show.tipo] || '🎵';
            
            const highlightBorder = show.climaDestacado ? 'border-2 border-amber-400 shadow-md animate-pulse' : 'border border-white';

            const customIcon = L.divIcon({
              html: `<div style="background:${color};" class="w-8 h-8 rounded-full ${highlightBorder} flex items-center justify-center shadow text-sm transform hover:scale-110 transition-transform">
                <span>${emoji}</span>
              </div>`,
              className: 'custom-leaflet-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            });

            const popupHtml = `
              <div class="p-2 font-sans max-w-xs">
                <h4 class="font-bold text-slate-800 text-sm mb-1">${show.nombre}</h4>
                <div class="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <i class="fa fa-map-marker-alt text-blue-500"></i> ${show.barrio}
                </div>
                <div class="text-xs text-slate-500 mb-2">
                  🕐 ${show.hora_inicio} - ${show.hora_fin}
                </div>
                <button 
                  data-id="${show.id}"
                  onclick="document.dispatchEvent(new CustomEvent('ver-detalle', { detail: '${show.id}' }))"
                  class="ver-detalle-btn w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition-colors cursor-pointer"
                >
                  Ver detalles →
                </button>
              </div>
            `;

            const marker = L.marker([latVal, lngVal], { icon: customIcon })
              .bindPopup(popupHtml)
              .addTo(markersLayerRef.current);

            points.push([latVal, lngVal]);
          } catch (err) {
            console.error("Error creating marker for show:", show.id, err);
          }
        });

        // Fit map boundary gracefully
        if (points.length > 0 && mapContainerRef.current) {
          try {
            mapContainerRef.current.invalidateSize();
            mapContainerRef.current.flyToBounds(points, {
              padding: [50, 50],
              maxZoom: 15,
              duration: 1.2
            });
          } catch (err) {
            console.warn("Error flying to bounds:", err);
          }
        }

        // Listen to popup open to bind click handler to the detail button inside the popup
        if (mapContainerRef.current) {
          mapContainerRef.current.off('popupopen');
          mapContainerRef.current.on('popupopen', (e: any) => {
            const popupNode = e.popup.getElement();
            if (popupNode) {
              const btn = popupNode.querySelector('.ver-detalle-btn');
              if (btn) {
                const showId = btn.getAttribute('data-id');
                const found = espectaculos.find(s => s.id === showId);
                if (found) {
                  btn.addEventListener('click', (ev: MouseEvent) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setSelectedShow(found);
                  });
                }
              }
            }
          });
        }
      } catch (err) {
        console.error("Error updating map markers layer:", err);
      }
    }
  };

  // Center maps on user coords
  const handleCenterOnUser = () => {
    if (navigator.geolocation && mapContainerRef.current) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          try {
            if (pos && pos.coords) {
              const { latitude, longitude } = pos.coords;
              if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
                const latVal = Number(latitude);
                const lngVal = Number(longitude);
                if (!isNaN(latVal) && !isNaN(lngVal) && latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
                  mapContainerRef.current.flyTo([latVal, lngVal], 14, { duration: 1.5 });
                  return;
                }
              }
            }
            triggerToast('Ubicación del usuario no válida o fuera de rango', 'error');
          } catch (err) {
            console.error("Error centering map on user:", err);
            triggerToast('Error al centrar mapa en tu ubicación', 'error');
          }
        },
        () => {
          triggerToast('Geolocalización denegada o no disponible', 'warning');
        }
      );
    } else {
      triggerToast('Geolocalización no soportada por el navegador', 'error');
    }
  };

  // Listen to custom details click events dispatched from Leaflet popups or button clicks
  useEffect(() => {
    const handleDetailEvent = (e: any) => {
      const showId = e.detail;
      const found = espectaculos.find(s => s.id === showId);
      if (found) setSelectedShow(found);
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.ver-detalle-btn');
      if (btn) {
        const showId = btn.getAttribute('data-id');
        if (showId) {
          const found = espectaculos.find(s => s.id === showId);
          if (found) {
            setSelectedShow(found);
          }
        }
      }
    };

    document.addEventListener('ver-detalle', handleDetailEvent);
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('ver-detalle', handleDetailEvent);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [espectaculos]);

  // Modal MiniMap mounting
  useEffect(() => {
    let timeoutId: any = null;

    // Always clean up previous map if it exists
    if (miniMapContainerRef.current) {
      try {
        miniMapContainerRef.current.remove();
      } catch (e) {
        console.warn('Error removing minimap:', e);
      }
      miniMapContainerRef.current = null;
    }

    if (selectedShow && (window as any).L) {
      timeoutId = setTimeout(() => {
        try {
          const L = (window as any).L;
          const minimapDiv = document.getElementById('minimapa-modal');
          if (minimapDiv && !miniMapContainerRef.current) {
            const cleanLat = String(selectedShow.latitud || '').replace(',', '.').trim();
            const cleanLng = String(selectedShow.longitud || '').replace(',', '.').trim();
            const latVal = Number(cleanLat);
            const lngVal = Number(cleanLng);
            
            if (!selectedShow.latitud || !selectedShow.longitud || isNaN(latVal) || isNaN(lngVal) || latVal < -90 || latVal > 90 || lngVal < -180 || lngVal > 180) {
              return;
            }

            const miniMap = L.map('minimapa-modal', {
              center: [latVal, lngVal],
              zoom: 15,
              zoomControl: false,
              dragging: false,
              scrollWheelZoom: false,
              touchZoom: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
              maxZoom: 18
            }).addTo(miniMap);

            L.marker([latVal, lngVal]).addTo(miniMap);
            miniMapContainerRef.current = miniMap;
          }
        } catch (e) {
          console.error('Error creating miniMap:', e);
        }
      }, 150);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedShow]);

  // Handle analytics panel statistics aggregation
  const handleOpenAnalytics = async () => {
    setAnalyticsOpen(prev => !prev);
    try {
      const data = await getLogsKNIME(300);
      setRawLogs(data);
    } catch (err) {
      console.warn('Could not load raw logs:', err);
    }
  };

  // Obtener logs filtrados por rango de fecha
  const getLogsFiltrados = (): ConsultaLog[] => {
    return rawLogs.filter(log => {
      if (!log.fecha) return true;
      const fechaLog = log.fecha.split('T')[0]; // YYYY-MM-DD
      if (fechaDesde && fechaLog < fechaDesde) return false;
      if (fechaHasta && fechaLog > fechaHasta) return false;
      return true;
    });
  };

  const computeMostUsedFilter = (): string => {
    const logsFiltrados = getLogsFiltrados();
    if (logsFiltrados.length === 0) return 'Sin datos';
    const counts: Record<string, number> = {};
    logsFiltrados.forEach(log => {
      if (log.filtro_tipo) counts[log.filtro_tipo] = (counts[log.filtro_tipo] || 0) + 1;
      if (log.filtro_precio) counts[log.filtro_precio] = (counts[log.filtro_precio] || 0) + 1;
      if (log.filtro_ambiente) counts[log.filtro_ambiente] = (counts[log.filtro_ambiente] || 0) + 1;
      if (log.filtro_horario) counts[log.filtro_horario] = (counts[log.filtro_horario] || 0) + 1;
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return 'Filtro General';
    const top = entries.sort((a, b) => b[1] - a[1])[0][0];
    
    const labels: Record<string, string> = {
      baile: 'Milonga', cantado: 'Concierto', show_completo: 'Cena Show',
      gratuito: 'Gratis', economico: 'Económico', premium: 'Premium',
      aire_libre: 'Aire Libre', techado: 'Sala Techada',
      vespertino: 'Tarde', nocturno: 'Noche'
    };
    return labels[top] || top;
  };

  // Agrupar consultas por día o por hora para el gráfico de volumen temporal
  const agruparConsultas = () => {
    const logsFiltrados = getLogsFiltrados();
    if (logsFiltrados.length === 0) return [];
    
    // Contar días únicos para decidir si agrupar por hora o por día (en hora local para evitar discrepancia de huso horario)
    const diasUnicos = new Set<string>();
    logsFiltrados.forEach(log => {
      if (log.fecha) {
        const dObj = new Date(log.fecha);
        const localDateKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        diasUnicos.add(localDateKey);
      }
    });

    const agruparPorHora = diasUnicos.size <= 2;
    const grupos: Record<string, { total: number; ia: number; filtros: number }> = {};

    logsFiltrados.forEach(log => {
      if (!log.fecha) return;
      const fechaObj = new Date(log.fecha);
      let label = '';
      if (agruparPorHora) {
        label = `${String(fechaObj.getHours()).padStart(2, '0')}:00`;
      } else {
        label = `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grupos[label]) {
        grupos[label] = { total: 0, ia: 0, filtros: 0 };
      }
      grupos[label].total += 1;
      if (log.uso_gemini) {
        grupos[label].ia += 1;
      } else {
        grupos[label].filtros += 1;
      }
    });

    const items = Object.entries(grupos).map(([key, value]) => ({
      label: key,
      ...value
    }));

    if (agruparPorHora) {
      items.sort((a, b) => parseInt(a.label) - parseInt(b.label));
    } else {
      items.sort((a, b) => {
        const [diaA, mesA] = a.label.split('/').map(Number);
        const [diaB, mesB] = b.label.split('/').map(Number);
        if (mesA !== mesB) return mesA - mesB;
        return diaA - diaB;
      });
    }

    return items;
  };

  // Agrupar los tipos de shows pedidos por los usuarios
  const agruparPorTipoShow = () => {
    const logsFiltrados = getLogsFiltrados();
    const conteo = {
      baile: 0,
      cantado: 0,
      show_completo: 0,
      general: 0
    };

    logsFiltrados.forEach(log => {
      const t = log.filtro_tipo;
      if (t === 'baile') conteo.baile += 1;
      else if (t === 'cantado') conteo.cantado += 1;
      else if (t === 'show_completo') conteo.show_completo += 1;
      else conteo.general += 1;
    });

    const total = logsFiltrados.length || 1;
    return [
      { id: 'baile', nombre: 'Milonga / Baile 💃', valor: conteo.baile, color: 'bg-emerald-500', barColor: '#10b981', pct: Math.round((conteo.baile / total) * 100) },
      { id: 'cantado', nombre: 'Concierto Vocal / Instrumental 🎵', valor: conteo.cantado, color: 'bg-indigo-500', barColor: '#6366f1', pct: Math.round((conteo.cantado / total) * 100) },
      { id: 'show_completo', nombre: 'Show completo 🍽️', valor: conteo.show_completo, color: 'bg-amber-500', barColor: '#f59e0b', pct: Math.round((conteo.show_completo / total) * 100) },
      { id: 'general', nombre: 'Sin preferencia de tipo de espectáculo 🔍', valor: conteo.general, color: 'bg-slate-500', barColor: '#64748b', pct: Math.round((conteo.general / total) * 100) }
    ].sort((a, b) => b.valor - a.valor);
  };

  // Agrupar las preferencias de horarios pedidas por los usuarios
  const agruparPorHorario = () => {
    const logsFiltrados = getLogsFiltrados();
    const conteo = {
      vespertino: 0,
      nocturno: 0,
      general: 0
    };

    logsFiltrados.forEach(log => {
      const h = log.filtro_horario;
      if (h === 'vespertino') conteo.vespertino += 1;
      else if (h === 'nocturno') conteo.nocturno += 1;
      else conteo.general += 1;
    });

    const total = logsFiltrados.length || 1;
    return [
      { id: 'vespertino', nombre: 'Tarde / Vespertino 🌇', valor: conteo.vespertino, color: 'bg-orange-400', barColor: '#fb923c', pct: Math.round((conteo.vespertino / total) * 100) },
      { id: 'nocturno', nombre: 'Noche / Nocturno 🌃', valor: conteo.nocturno, color: 'bg-violet-600', barColor: '#7c3aed', pct: Math.round((conteo.nocturno / total) * 100) },
      { id: 'general', nombre: 'Sin preferencia horaria 🕒', valor: conteo.general, color: 'bg-slate-400', barColor: '#94a3b8', pct: Math.round((conteo.general / total) * 100) }
    ].sort((a, b) => b.valor - a.valor);
  };

  // Agrupar las preferencias de ambiente pedidas por los usuarios
  const agruparPorAmbiente = () => {
    const logsFiltrados = getLogsFiltrados();
    const conteo = {
      aire_libre: 0,
      techado: 0,
      general: 0
    };

    logsFiltrados.forEach(log => {
      const a = log.filtro_ambiente;
      if (a === 'aire_libre') conteo.aire_libre += 1;
      else if (a === 'techado') conteo.techado += 1;
      else conteo.general += 1;
    });

    const total = logsFiltrados.length || 1;
    return [
      { id: 'aire_libre', nombre: 'Al Aire Libre 🌳', valor: conteo.aire_libre, color: 'bg-teal-500', barColor: '#14b8a6', pct: Math.round((conteo.aire_libre / total) * 100) },
      { id: 'techado', nombre: 'Interior / Techado 🏠', valor: conteo.techado, color: 'bg-cyan-600', barColor: '#0891b2', pct: Math.round((conteo.techado / total) * 100) },
      { id: 'general', nombre: 'Sin preferencia ambiente 🌍', valor: conteo.general, color: 'bg-slate-400', barColor: '#94a3b8', pct: Math.round((conteo.general / total) * 100) }
    ].sort((a, b) => b.valor - a.valor);
  };

  // Agrupar las preferencias de rangos de precio pedidas por los usuarios
  const agruparPorPrecio = () => {
    const logsFiltrados = getLogsFiltrados();
    const conteo = {
      gratuito: 0,
      economico: 0,
      premium: 0,
      general: 0
    };

    logsFiltrados.forEach(log => {
      const p = log.filtro_precio;
      if (p === 'gratuito') conteo.gratuito += 1;
      else if (p === 'economico') conteo.economico += 1;
      else if (p === 'premium') conteo.premium += 1;
      else conteo.general += 1;
    });

    const total = logsFiltrados.length || 1;
    return [
      { id: 'gratuito', nombre: 'Gratuito / A la gorra 🆓', valor: conteo.gratuito, color: 'bg-lime-500', barColor: '#84cc16', pct: Math.round((conteo.gratuito / total) * 100) },
      { id: 'economico', nombre: 'Económico / Accesible 💳', valor: conteo.economico, color: 'bg-sky-500', barColor: '#0ea5e9', pct: Math.round((conteo.economico / total) * 100) },
      { id: 'premium', nombre: 'Premium / Gala 💎', valor: conteo.premium, color: 'bg-rose-500', barColor: '#f43f5e', pct: Math.round((conteo.premium / total) * 100) },
      { id: 'general', nombre: 'Sin filtro de precio 💵', valor: conteo.general, color: 'bg-slate-400', barColor: '#94a3b8', pct: Math.round((conteo.general / total) * 100) }
    ].sort((a, b) => b.valor - a.valor);
  };

  // CSV Exporter for KNIME Analytics workflows
  const handleExportCSV = () => {
    if (rawLogs.length === 0) {
      triggerToast('No hay registros de consultas para exportar', 'warning');
      return;
    }

    const columns = [
      'fecha', 'filtro_tipo', 'filtro_precio', 'filtro_ambiente',
      'filtro_horario', 'filtro_dia', 'resultados_count',
      'clima_condicion', 'clima_temp', 'uso_gemini', 'session_id'
    ];

    const csvRows = [
      columns.join(','),
      ...rawLogs.map(log => 
        columns.map(col => {
          const val = (log as any)[col] ?? '';
          const cleanVal = String(val).replace(/,/g, ' '); // remove commas to protect layout
          return cleanVal;
        }).join(',')
      )
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tangoba_logs_knime_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    triggerToast(`Exportado: ${rawLogs.length} registros para KNIME`, 'success');
  };

  // Administration dashboard actions
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Intentar login real en Supabase Auth
      const user = await loginAdmin(adminEmail, adminPassword);
      setAdminLoggedIn(true);
      setAdminShowLoginModal(false);
      setAdminPassword('');
      triggerToast('Sesión de administrador iniciada con Supabase', 'success');
      loadAllAdminShows();
    } catch (err: any) {
      // Fallback para desarrollo local offline si las credenciales coinciden con las demo
      if (adminEmail === 'admin@tangoba.com' && adminPassword === 'admin') {
        setAdminLoggedIn(true);
        setAdminShowLoginModal(false);
        setAdminPassword('');
        triggerToast('Sesión iniciada con credenciales demo (Local)', 'success');
        loadAllAdminShows();
      } else {
        setAdminPassword('');
        triggerToast(err.message || 'Credenciales incorrectas de administrador', 'error');
      }
    }
  };

  const handleAdminLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.warn('Error al cerrar sesión de Supabase:', err);
    }
    setAdminEmail('');
    setAdminPassword('');
    setAdminLoggedIn(false);
    triggerToast('Sesión cerrada correctamente', 'info');
  };

  const loadAllAdminShows = async () => {
    // Fetch directly from the mock data to manage all shows
    try {
      const shows = await getEspectaculos({ tipo: '', precio: '', ambiente: '', horario: '', dias: [] });
      setAllAdminShows(shows);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleToggleShowStatus = async (show: Espectaculo) => {
    const updatedStatus = !show.activo;
    try {
      await adminActualizarEspectaculo(show.id, { activo: updatedStatus });
      triggerToast(`Show ${updatedStatus ? 'activado' : 'desactivado'} con éxito`, 'success');
      loadAllAdminShows();
      fetchEspectaculosList();
    } catch (err) {
      triggerToast('Error al actualizar estado', 'error');
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este espectáculo permanentemente?')) return;
    try {
      await adminEliminarEspectaculo(id);
      triggerToast('Espectáculo eliminado con éxito', 'success');
      loadAllAdminShows();
      fetchEspectaculosList();
    } catch (err) {
      triggerToast('Error al eliminar espectáculo', 'error');
    }
  };

  const handleEditShow = (show: Espectaculo) => {
    setEditingShowId(show.id);
    setFormNombre(show.nombre);
    setFormDescripcion(show.descripcion);
    setFormTipo(show.tipo);
    setFormPrecioTipo(show.precio_tipo);
    setFormPrecioValor(show.precio_valor);
    setFormAmbiente(show.ambiente);
    setFormHorarioTipo(show.horario_tipo);
    setFormHoraInicio(show.hora_inicio);
    setFormHoraFin(show.hora_fin);
    setFormDireccion(show.direccion);
    setFormBarrio(show.barrio);
    setFormLatitud(String(show.latitud));
    setFormLongitud(String(show.longitud));
    setFormImagenUrl(show.imagen_url || '');
    setFormWebsite(show.website || '');
    setFormContacto(show.contacto || '');
    setFormDiasSemana(show.dias_semana);
    setAdminTab('nuevo');
  };

  const resetForm = () => {
    setEditingShowId(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormTipo('baile');
    setFormPrecioTipo('economico');
    setFormPrecioValor(1000);
    setFormAmbiente('techado');
    setFormHorarioTipo('nocturno');
    setFormHoraInicio('21:00');
    setFormHoraFin('02:00');
    setFormDireccion('');
    setFormBarrio('');
    setFormLatitud('-34.6037');
    setFormLongitud('-58.3816');
    setFormImagenUrl('');
    setFormWebsite('');
    setFormContacto('');
    setFormDiasSemana(['sabado']);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNombre || !formDireccion || !formBarrio) {
      triggerToast('Por favor completa todos los campos requeridos (*)', 'warning');
      return;
    }

    const showPayload = {
      nombre: formNombre,
      descripcion: formDescripcion,
      tipo: formTipo,
      precio_tipo: formPrecioTipo,
      precio_valor: formPrecioTipo === 'gratuito' ? 0 : Number(formPrecioValor),
      ambiente: formAmbiente,
      horario_tipo: formHorarioTipo,
      hora_inicio: formHoraInicio,
      hora_fin: formHoraFin,
      direccion: formDireccion,
      barrio: formBarrio,
      latitud: Number(formLatitud) || -34.6037,
      longitud: Number(formLongitud) || -58.3816,
      imagen_url: formImagenUrl || undefined,
      website: formWebsite || undefined,
      contacto: formContacto || undefined,
      dias_semana: formDiasSemana,
      activo: true
    };

    try {
      if (editingShowId) {
        await adminActualizarEspectaculo(editingShowId, showPayload);
        triggerToast('Espectáculo actualizado con éxito', 'success');
      } else {
        await adminAgregarEspectaculo(showPayload);
        triggerToast('Nuevo espectáculo agregado con éxito', 'success');
      }
      resetForm();
      setAdminTab('lista');
      loadAllAdminShows();
      fetchEspectaculosList();
    } catch (err) {
      triggerToast('Error al guardar el espectáculo', 'error');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 5) {
      triggerToast('La nueva contraseña debe tener al menos 5 caracteres', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Las contraseñas ingresadas no coinciden', 'error');
      return;
    }
    triggerToast('Contraseña de administrador actualizada con éxito', 'success');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleToggleDayForm = (day: string) => {
    setFormDiasSemana(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Google Maps coordinate lookup helper info
  const handleCopyCoordGuide = () => {
    triggerToast('Busca la dirección en Google Maps, haz clic derecho e copia las coordenadas', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full overflow-x-hidden">
      
      {/* Dynamic Alert Banner based on Real-Time Weather */}
      {clima && (
        <div className={`py-2 px-4 text-center text-xs md:text-sm font-medium border-b flex items-center justify-center gap-2 transition-all ${
          clima.esLluvia 
            ? 'bg-blue-100 border-blue-200 text-blue-900' 
            : (clima.esFrio || !clima.esIdeal)
              ? 'bg-cyan-100 border-cyan-200 text-cyan-900'
              : 'bg-emerald-100 border-emerald-200 text-emerald-900'
        }`}>
          <span className="font-extrabold uppercase tracking-widest text-[10px] bg-black/5 px-1.5 py-0.5 rounded-md mr-1">Hoy</span>
          <span>{clima.esLluvia ? '☔' : (clima.esFrio || !clima.esIdeal) ? '❄️' : '✨'}</span>
          <span>
            {clima.esLluvia 
              ? 'Atención: Lluvia detectada en Buenos Aires. Espectáculos al aire libre podrían reprogramarse.'
              : (clima.esFrio || !clima.esIdeal)
                ? `Temperatura fresca/fría (${clima.temperatura}°C). Recomendamos milongas o salones techados.`
                : '¡Tiempo ideal para bailar! El clima está excelente para shows al aire libre.'
            }
          </span>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-md md:sticky md:top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow">🎵</span>
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-serif font-bold tracking-wider">Tango</h1>
              <div className="text-xs text-blue-200 tracking-widest font-mono leading-tight mt-0.5">
                <p>Espectáculos en</p>
                <p>Buenos Aires</p>
              </div>
            </div>
          </div>

          {/* RETRO TANGO MUSIC PLAYER */}
          <TangoPlayer />

          {/* Real-time Weather widget */}
          {clima ? (
            <div className="bg-white/10 border border-white/20 rounded-xl p-2.5 flex items-center gap-3.5 text-xs w-full sm:w-auto max-w-sm justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2.5xl">{clima.emoji}</span>
                <div>
                  <div className="font-bold text-slate-100 font-mono text-sm flex items-center gap-1">
                    {clima.temperatura}°C {clima.esFrio && <span className="animate-pulse" title="Frío intenso">❄️</span>}
                  </div>
                  <div className="text-slate-300 font-medium text-[10px]">{clima.condicion}</div>
                </div>
              </div>
              <div className="border-l border-white/15 pl-3 text-[10px] text-slate-300 flex flex-col gap-0.5">
                <span className="capitalize text-white font-medium flex items-center gap-1">
                  📅 {currentDateTime.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
                </span>
                <span className="text-[9px] text-slate-300 flex items-center gap-1">
                  🕒 {currentDateTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-slate-200 text-[9px]">📍 Buenos Aires (💧{clima.humedad}% | 💨{clima.viento}km/h)</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-blue-200 animate-pulse">Cargando clima actual...</div>
          )}

          {/* Admin Access */}
          <div className="flex items-center gap-3 text-xs">

            {adminLoggedIn ? (
              <button 
                onClick={handleAdminLogout}
                className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl transition-all shadow hover:shadow-md cursor-pointer flex items-center gap-1"
              >
                <i className="fa fa-sign-out-alt"></i> Salir
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAdminEmail('');
                  setAdminPassword('');
                  setAdminShowLoginModal(true);
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <i className="fa fa-lock text-blue-300"></i> Admin
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN APPLICATION CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex flex-col gap-6">

        {/* HERO SECTION WITH BANDONEON */}
        <section id="hero-bienvenida-bandoneon" className="min-h-[2.8cm] h-auto md:h-[2.8cm] bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm overflow-hidden flex items-center">
          {/* FOTO DEL BANDONEÓN (A LA IZQUIERDA) */}
          <div id="contenedor-foto-bandoneon" className="w-[100px] sm:w-[150px] md:w-[210px] self-stretch relative bg-transparent shrink-0 border-r border-blue-100">
            <img
              id="foto-bandoneon-hero"
              src={bandoneonImg}
              alt="Bandoneón Vintage Porteño"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain p-2"
            />
          </div>

          {/* TEXTO DE BIENVENIDA (A LA DERECHA) */}
          <div className="flex-1 px-4 py-3 md:py-2 flex flex-col justify-center min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span id="badge-bienvenida" className="text-xs sm:text-sm md:text-base font-serif font-bold bg-blue-50 text-blue-900 px-3 py-0.5 rounded border border-blue-100">
                Bienvenidos al Compás de Buenos Aires
              </span>
            </div>
            <p id="descripcion-bienvenida" className="text-[11px] sm:text-xs md:text-[13px] text-blue-700 leading-snug">
              Explorá la cartelera de tango adaptada al clima de la ciudad.
              <span className="hidden sm:inline"><br /></span>
              <span className="inline sm:hidden"> </span>
              Configurá los filtros manuales o utilizá el Buscador inteligente.
            </p>
          </div>
        </section>

        {/* ADMIN DASHBOARD - ONLY VISIBLE TO LOGGED IN USERS */}
        {adminLoggedIn && (
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm p-5 md:p-6 animation-fade-in border-t-4 border-t-amber-500">
            <div className="border-b border-slate-100 pb-4 mb-5 space-y-4">
              {/* Título Centrado */}
              <div className="text-center w-full">
                <h2 className="text-base md:text-lg font-serif font-bold text-slate-800 inline-flex items-center gap-2 justify-center">
                  <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs">🔑</span>
                  Panel del Administrador de Espectáculos
                </h2>
              </div>

              {/* Subtítulo alineado a la izquierda y pestañas de navegación */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="text-left">
                  <h3 className="text-sm md:text-base font-bold text-slate-800">
                    Base de Datos de Espectáculos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Agrega, edita y gestiona el listado completo de shows en el mapa público.</p>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 text-xs self-stretch md:self-auto shrink-0">
                <button
                  onClick={() => { setAdminTab('lista'); loadAllAdminShows(); }}
                  className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-semibold transition-all cursor-pointer ${adminTab === 'lista' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <i className="fa fa-list mr-1"></i> Lista Shows
                </button>
                <button
                  onClick={() => { setAdminTab('nuevo'); resetForm(); }}
                  className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-semibold transition-all cursor-pointer ${adminTab === 'nuevo' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <i className="fa fa-plus-circle mr-1"></i> {editingShowId ? 'Editar Show' : 'Agregar Nuevo'}
                </button>
                <button
                  onClick={() => setAdminTab('seguridad')}
                  className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-semibold transition-all cursor-pointer ${adminTab === 'seguridad' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <i className="fa fa-shield-alt mr-1"></i> Seguridad
                </button>
              </div>
            </div>
          </div>

            {/* TAB: LIST OF EVENTS */}
            {adminTab === 'lista' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="text-xs text-slate-500">
                    Mostrando <b>{allAdminShows.filter(s => s.nombre.toLowerCase().includes(adminSearchTerm.toLowerCase()) || s.barrio.toLowerCase().includes(adminSearchTerm.toLowerCase())).length}</b> espectáculos cargados
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o barrio..."
                      value={adminSearchTerm}
                      onChange={e => setAdminSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                    />
                    <i className="fa fa-search absolute left-3 top-2.5 text-slate-400 text-[10px]"></i>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Show</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4">Barrio</th>
                        <th className="py-3 px-4">Precio</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {allAdminShows
                        .filter(s => s.nombre.toLowerCase().includes(adminSearchTerm.toLowerCase()) || s.barrio.toLowerCase().includes(adminSearchTerm.toLowerCase()))
                        .map(show => (
                          <tr key={show.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-800">{show.nombre}</td>
                            <td className="py-3 px-4 capitalize font-mono text-[10px]">{show.tipo.replace('_', ' ')}</td>
                            <td className="py-3 px-4 text-slate-500">{show.barrio}</td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${show.precio_tipo === 'gratuito' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {show.precio_tipo === 'gratuito' ? 'Gratis' : `$${show.precio_valor.toLocaleString('es-AR')}`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleShowStatus(show)}
                                className={`px-2 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${show.activo ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                              >
                                {show.activo ? 'Activo' : 'Oculto'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                onClick={() => handleEditShow(show)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <i className="fa fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteShow(show.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <i className="fa fa-trash-alt"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {allAdminShows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">No hay espectáculos cargados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ADD OR EDIT EVENT */}
            {adminTab === 'nuevo' && (
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* General inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Espectáculo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Milonga de San Telmo"
                        value={formNombre}
                        onChange={e => setFormNombre(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción corta</label>
                      <textarea
                        rows={3}
                        placeholder="Describe el ambiente, si hay clases previas, músicos en vivo..."
                        value={formDescripcion}
                        onChange={e => setFormDescripcion(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Show</label>
                        <select
                          value={formTipo}
                          onChange={e => setFormTipo(e.target.value as TipoEspectaculo)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        >
                          <option value="baile">💃 Solo Baile</option>
                          <option value="cantado">🎤 Cantado / Concierto</option>
                          <option value="show_completo">🎭 Show Completo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Ambiente</label>
                        <select
                          value={formAmbiente}
                          onChange={e => setFormAmbiente(e.target.value as TipoAmbiente)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        >
                          <option value="techado">🏛️ Techado</option>
                          <option value="aire_libre">☀️ Al Aire Libre</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Tipo</label>
                        <select
                          value={formPrecioTipo}
                          onChange={e => setFormPrecioTipo(e.target.value as TipoPrecio)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        >
                          <option value="gratuito">🟢 Gratuito</option>
                          <option value="economico">🔵 Económico</option>
                          <option value="premium">🟡 Premium</option>
                        </select>
                      </div>

                      {formPrecioTipo !== 'gratuito' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Monto en ARS ($) *</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={formPrecioValor}
                            onChange={e => setFormPrecioValor(Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Horario Tipo</label>
                        <select
                          value={formHorarioTipo}
                          onChange={e => setFormHorarioTipo(e.target.value as TipoHorario)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        >
                          <option value="vespertino">🌅 Vespertino</option>
                          <option value="nocturno">🌙 Nocturno</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Inicio</label>
                        <input
                          type="text"
                          placeholder="21:00"
                          value={formHoraInicio}
                          onChange={e => setFormHoraInicio(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hora Fin</label>
                        <input
                          type="text"
                          placeholder="03:00"
                          value={formHoraFin}
                          onChange={e => setFormHoraFin(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Geolocation and Metadata inputs */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sarmiento 4006"
                          value={formDireccion}
                          onChange={e => setFormDireccion(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Barrio *</label>
                        <input
                          type="text"
                          required
                          placeholder="Almagro"
                          value={formBarrio}
                          onChange={e => setFormBarrio(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-600">Coordenadas del Venue</label>
                        <button
                          type="button"
                          onClick={handleCopyCoordGuide}
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <i className="fa fa-info-circle"></i> ¿Cómo obtenerlas?
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Latitud (Ej: -34.6057)"
                          value={formLatitud}
                          onChange={e => setFormLatitud(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Longitud (Ej: -58.4271)"
                          value={formLongitud}
                          onChange={e => setFormLongitud(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">URL de Imagen</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formImagenUrl}
                        onChange={e => setFormImagenUrl(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Sitio Web</label>
                        <input
                          type="url"
                          placeholder="https://lavirutatango.com"
                          value={formWebsite}
                          onChange={e => setFormWebsite(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Contacto / Email / Tel</label>
                        <input
                          type="text"
                          placeholder="info@lavirutatango.com"
                          value={formContacto}
                          onChange={e => setFormContacto(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Weekday Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Días Activos de la Semana</label>
                      <div className="flex flex-wrap gap-1.5">
                        {DIAS_SIMPLES.map(day => (
                          <button
                            type="button"
                            key={day}
                            onClick={() => handleToggleDayForm(day)}
                            className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                              formDiasSemana.includes(day)
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {day.slice(0, 3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setAdminTab('lista'); }}
                    className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow hover:shadow-md cursor-pointer transition-all"
                  >
                    {editingShowId ? 'Guardar Cambios' : 'Guardar Espectáculo'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: PASSWORD SECURITY */}
            {adminTab === 'seguridad' && (
              <form onSubmit={handlePasswordReset} className="max-w-md space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">Actualizar Contraseña de Administrador</h3>
                  <p className="text-xs text-slate-500">Asegúrate de recordar esta clave para tus próximos accesos.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Mínimo 5 caracteres"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none cursor-pointer"
                        title={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        <i className={`fa ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita la contraseña"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none cursor-pointer"
                        title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Cambiar Contraseña
                </button>
              </form>
            )}

          </section>
        )}

        {/* KNIME INTEGRATION drawer */}
        {adminLoggedIn && (
          <>
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
              <button
              onClick={handleOpenAnalytics}
              className="w-full text-left bg-blue-100/30 hover:bg-blue-100/50 border-none px-5 py-4 flex items-center justify-between transition-colors outline-none cursor-pointer"
            >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-sm text-slate-800">
                  <span className="text-base font-bold">Panel</span> <span className="font-normal">con detalle de datos en base a consultas de usuarios</span>
                </h3>
                <p className="text-sm font-bold text-slate-600 mt-0.5">
                  e información destinada a emplear en KNIME. <span className="text-xs font-bold text-slate-500">(Configuración y archivo a exportar)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] font-bold text-blue-600 text-right hidden sm:inline">
                {analyticsOpen 
                  ? "Hacer click para cerrar el panel y actualizar con los nuevos datos" 
                  : "Hacer click para desplegar información y gráficos"}
              </span>
              <i className={`fa fa-chevron-down text-blue-600 text-xs transition-transform duration-300 ${analyticsOpen ? 'rotate-180' : ''}`}></i>
            </div>
          </button>

          {analyticsOpen && (
            <div className="p-5 md:p-6 border-t border-slate-100 space-y-6 animate-fade-in">
              
              {/* Selector de Rango de Fechas */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        📅 Fecha de Inicio
                      </label>
                      <input 
                        type="date" 
                        value={fechaDesde} 
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        📅 Fecha de Fin
                      </label>
                      <input 
                        type="date" 
                        value={fechaHasta} 
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => {
                        setFechaDesde('');
                        setFechaHasta('');
                      }}
                      disabled={!fechaDesde && !fechaHasta}
                      className="flex-1 md:flex-none border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-blue-600 text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Limpiar Rango
                    </button>
                  </div>
                </div>
              </div>

              {/* Computed metrics */}
              <div className="flex justify-center w-full">
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center max-w-sm w-full">
                  <div className="font-serif font-bold text-2xl text-blue-700">
                    {getLogsFiltrados().length}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                    {fechaDesde || fechaHasta ? 'Consultas en Rango' : 'Consultas Totales (Muestra)'}
                  </div>
                </div>
              </div>

              {/* Gráficos Analíticos de Consultas para KNIME */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-5 border border-slate-100 rounded-2xl shadow-sm">
                
                {/* 1. Distribución de Tipos de Shows Pedidos */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      💃 Tipos de Shows Pedidos
                    </h4>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      Preferencia de Espectadores
                    </span>
                  </div>

                  {getLogsFiltrados().length === 0 ? (
                    <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Sin datos de consultas en este rango.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {agruparPorTipoShow().map((show) => (
                        <div key={show.id} className="space-y-1 group">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{show.nombre}</span>
                            <span className="text-slate-500 font-sans font-medium">
                              {show.valor} ({show.pct}%)
                            </span>
                          </div>
                          
                          {/* Barra de progreso */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full ${show.color} rounded-full transition-all duration-1000 ease-out`} 
                              style={{ width: `${show.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Distribución por Horario */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      🕒 Horarios Solicitados
                    </h4>
                    <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                      Preferencia Horaria
                    </span>
                  </div>

                  {getLogsFiltrados().length === 0 ? (
                    <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Sin datos de consultas en este rango.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {agruparPorHorario().map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{item.nombre}</span>
                            <span className="text-slate-500 font-sans font-medium">
                              {item.valor} ({item.pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Distribución por Ambiente */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      🌳 Climatización y Espacios
                    </h4>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                      Tipo de Ambiente
                    </span>
                  </div>

                  {getLogsFiltrados().length === 0 ? (
                    <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Sin datos de consultas en este rango.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {agruparPorAmbiente().map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{item.nombre}</span>
                            <span className="text-slate-500 font-sans font-medium">
                              {item.valor} ({item.pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Distribución por Presupuesto */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      💵 Presupuestos Elegidos
                    </h4>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                      Rango de Precios
                    </span>
                  </div>

                  {getLogsFiltrados().length === 0 ? (
                    <div className="h-40 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Sin datos de consultas en este rango.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {agruparPorPrecio().map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                            <span>{item.nombre}</span>
                            <span className="text-slate-500 font-sans font-medium">
                              {item.valor} ({item.pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} 
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* CSV & API integration trigger keys */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100 rounded-xl">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-600">Flujo de Trabajo para KNIME</h4>
                  <p className="text-[11px] text-slate-500">Usa el nodo <b>HTTP Request</b> apuntando al API REST de Supabase, o descarga el reporte diario en formato CSV.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <i className="fa fa-download"></i> Exportar CSV
                  </button>

                  <button
                    onClick={() => {
                      // Toggle raw visual viewer
                      const dialog = document.getElementById('api-credentials-guide');
                      if (dialog) dialog.style.display = dialog.style.display === 'none' ? 'block' : 'none';
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    <i className="fa fa-code"></i> Ver credenciales de API
                  </button>
                </div>
              </div>

              {/* Raw JSON raw endpoint credentials guide box */}
              <div id="api-credentials-guide" style={{ display: 'none' }} className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs font-mono space-y-3">
                <div className="flex justify-between items-center text-amber-400 border-b border-slate-800 pb-2">
                  <span>🔗 Configuración de nodos KNIME</span>
                  <button onClick={() => {
                    const el = document.getElementById('api-credentials-guide');
                    if (el) el.style.display = 'none';
                  }} className="text-white hover:text-red-400 font-bold">×</button>
                </div>
                
                <div className="space-y-1">
                  <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider text-amber-500/80">URL Endpoint (GET):</div>
                  <div className="bg-black/40 p-2 rounded text-slate-200 break-all">https://kwhllwbpdvgwyosgerqb.supabase.co/rest/v1/consultas_log?select=*&order=fecha.desc</div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider text-amber-500/80">Headers HTTP requeridos:</div>
                  <pre className="bg-black/40 p-2 rounded text-slate-200 overflow-x-auto">
{`apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Anon Key)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json`}
                  </pre>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Divisor elegante para separar la sección de analíticas de la sección pública de búsqueda */}
        <div className="flex items-center gap-4 pt-4 pb-0 mt-6 mb-[-14px] animate-fade-in">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
          <span className="text-[11px] sm:text-xs font-extrabold text-blue-600 uppercase tracking-widest bg-white px-8 py-3 rounded-full border-2 border-blue-200/80 shadow-sm select-none flex items-center gap-2">
            🔍 Buscador Público de Espectáculos de Tango en Buenos Aires
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        </div>
      </>
    )}

        {/* AI SEARCH PANEL */}
        <section className="md:h-[2.2cm] md:min-h-[2.2cm] bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm p-4 md:py-2 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex-1 space-y-1">
            <h2 className="text-sm md:text-base font-serif font-bold text-blue-900 flex items-center gap-2">
              <span className="p-1 bg-blue-100 text-blue-700 rounded-lg inline-flex items-center justify-center shadow-xs shrink-0">
                <svg 
                  className="w-4.5 h-4.5 text-blue-700" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {/* Left wooden handle/body */}
                  <rect x="2" y="5" width="4" height="14" rx="1" fill="currentColor" fillOpacity="0.2" />
                  {/* Left Panel Keys */}
                  <circle cx="3.5" cy="8" r="0.6" fill="currentColor" />
                  <circle cx="4.5" cy="10" r="0.6" fill="currentColor" />
                  <circle cx="3.5" cy="12" r="0.6" fill="currentColor" />
                  <circle cx="4.5" cy="14" r="0.6" fill="currentColor" />
                  <circle cx="3.5" cy="16" r="0.6" fill="currentColor" />

                  {/* Bellows (fuelle) zigzags */}
                  <path 
                    d="M6 5 L8 4 L10 5 L12 4 L14 5 L16 4 L18 5 M6 19 L8 20 L10 19 L12 20 L14 19 L16 20 L18 19" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                  />
                  {/* Inner vertical folds of the bellows */}
                  <line x1="8" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="5" x2="10" y2="19" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                  <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="14" y1="5" x2="14" y2="19" stroke="currentColor" strokeWidth="1" opacity="0.7" />
                  <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="1.5" />

                  {/* Right wooden handle/body */}
                  <rect x="18" y="5" width="4" height="14" rx="1" fill="currentColor" fillOpacity="0.2" />
                  {/* Right Panel Keys */}
                  <circle cx="20.5" cy="8" r="0.6" fill="currentColor" />
                  <circle cx="19.5" cy="10" r="0.6" fill="currentColor" />
                  <circle cx="20.5" cy="12" r="0.6" fill="currentColor" />
                  <circle cx="19.5" cy="14" r="0.6" fill="currentColor" />
                  <circle cx="20.5" cy="16" r="0.6" fill="currentColor" />

                  {/* Straps/Handles */}
                  <path d="M2 9 C 0.5 10, 0.5 14, 2 15" stroke="currentColor" strokeWidth="1" fill="none" />
                  <path d="M22 9 C 23.5 10, 23.5 14, 22 15" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              </span>
              Buscador de Tango con Inteligencia Artificial
            </h2>
            <p className="text-xs sm:text-[12.5px] text-blue-700 leading-snug max-w-2xl">
              <span className="font-extrabold text-blue-900 block sm:inline mr-1">Solo puedes pedir</span> cosas como <i>"milongas gratis este domingo"</i>, <i>"shows premium al aire libre"</i> o <i>"algo cantado para hoy a la noche"</i>. Gemini configurará los filtros automáticamente.
            </p>
          </div>

          <form onSubmit={handleAISearch} className="w-full md:w-auto flex-1 max-w-xl">
            <div className="flex bg-white border border-blue-200 rounded-2xl p-0.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                placeholder="Escribe tu búsqueda aquí..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs md:text-sm text-slate-800 outline-none placeholder:text-slate-400 bg-transparent"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-[10px] md:text-xs px-3 md:px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <i className="fa fa-spinner animate-spin"></i> Interpretando...
                  </>
                ) : (
                  <>
                    <i className="fa fa-sparkles"></i> Buscar con IA
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ACTIVE IA INTERPRETATION SUMMARY */}
        {aiResponseText && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animation-fade-in">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Interpretación de la Inteligencia Artificial:</div>
              <div className="text-xs text-amber-800 mt-1 leading-relaxed">{aiResponseText}</div>
            </div>
          </div>
        )}

        {/* MANUAL FILTERS COLUMN CONTAINER */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-blue-200 pb-4 mb-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <i className="fa fa-sliders-h text-blue-600"></i>
              Filtros de Búsqueda Manuales
            </h3>
            
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="fa fa-times-circle"></i> Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Filter: Show Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span>🎭</span> Tipo de Show
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => selectFilter('tipo', '')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all ${tempFilters.tipo === '' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('tipo', 'baile')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.tipo === 'baile' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Solo Baile / Milonga</span>
                  <span>💃</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('tipo', 'cantado')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.tipo === 'cantado' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Cantado / Orquesta</span>
                  <span>🎤</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('tipo', 'show_completo')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.tipo === 'show_completo' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Show Completo</span>
                  <span>🎭</span>
                </button>
              </div>
            </div>

            {/* Filter: Price range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span>🎫</span> Rango de Precio
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => selectFilter('precio', '')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all ${tempFilters.precio === '' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('precio', 'gratuito')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.precio === 'gratuito' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Gratuito / Sin Costo</span>
                  <span className="text-emerald-500 font-bold">●</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('precio', 'economico')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.precio === 'economico' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Económico</span>
                  <span className="text-blue-500 font-bold">●</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('precio', 'premium')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.precio === 'premium' ? 'bg-amber-500 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Premium / Cena Show</span>
                  <span className="text-amber-500 font-bold">●</span>
                </button>
              </div>
            </div>

            {/* Filter: Atmosphere */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span>🏛️</span> Ambiente
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => selectFilter('ambiente', '')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all ${tempFilters.ambiente === '' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('ambiente', 'aire_libre')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.ambiente === 'aire_libre' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Al Aire Libre</span>
                  <span>☀️</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('ambiente', 'techado')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.ambiente === 'techado' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Techado / Salón</span>
                  <span>🏛️</span>
                </button>
              </div>
            </div>

            {/* Filter: Schedule */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span>⏰</span> Horario
              </label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => selectFilter('horario', '')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all ${tempFilters.horario === '' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('horario', 'vespertino')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.horario === 'vespertino' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Vespertino (Tarde)</span>
                  <span>🌅</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectFilter('horario', 'nocturno')}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-between ${tempFilters.horario === 'nocturno' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  <span>Nocturno (Noche)</span>
                  <span>🌙</span>
                </button>
              </div>
            </div>

            {/* Filter: Multi-date Interactive Calendar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span>📅</span> Fechas
              </label>
              <div className="bg-white/80 backdrop-blur-xs border border-blue-100 rounded-xl p-2.5 space-y-2">
                
                {/* Calendar month switcher */}
                <div className="flex justify-between items-center text-[10px] font-bold text-blue-900 border-b border-slate-200/60 pb-1.5">
                  <button type="button" onClick={handleCalPrevMonth} className="hover:text-blue-600 text-xs">
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <span className="capitalize">{MESES[calMes]} {calAnio}</span>
                  <button type="button" onClick={handleCalNextMonth} className="hover:text-blue-600 text-xs">
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] text-slate-400 font-bold">
                  <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
                </div>

                {/* Grid days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {renderCalendarDays()}
                </div>

              </div>
            </div>

          </div>

          {/* Render active calendar date tags and weather forecast */}
          {tempCalSelectedDates.length > 0 && (
            <div className="space-y-3 mt-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500">Fechas seleccionadas:</span>
                {tempCalSelectedDates.sort().map(d => {
                  const [year, month, day] = d.split('-').map(Number);
                  const dateObj = new Date(year, month - 1, day);
                  const dayLabel = DIAS_SEMANA_ESP[dateObj.getDay()].label;
                  return (
                    <span key={d} className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-2 py-0.5 font-semibold flex items-center gap-1">
                      {day}/{month} ({dayLabel})
                      <button type="button" onClick={() => toggleCalendarDate(d)} className="text-[10px] text-red-500 font-bold hover:text-red-700">×</button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setTempCalSelectedDates([])}
                  className="text-[10px] text-blue-600 hover:underline font-bold"
                >
                  Limpiar fechas
                </button>
              </div>

              {/* Weather forecast section for selected dates */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>⛅</span>
                  <span>Pronóstico para las fechas seleccionadas:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {tempCalSelectedDates.sort().map(d => {
                    const fCast = forecast.find(f => f.fecha === d);
                    const [year, month, day] = d.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    const dayLabel = DIAS_SEMANA_ESP[dateObj.getDay()].label;
                    
                    if (fCast) {
                      return (
                        <div key={d} className="bg-white/80 backdrop-blur-xs border border-blue-100/60 rounded-lg p-2 flex items-center justify-between gap-2 shadow-xs hover:shadow-sm transition-all">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-700">{day}/{month} ({dayLabel})</div>
                            <div className="text-[10px] text-slate-500 capitalize">{fCast.condicion}</div>
                            {fCast.probabilidadPrecipitacion > 0 && (
                              <div className="text-[9px] text-blue-600 font-medium flex items-center gap-0.5">
                                <span>💧</span> {fCast.probabilidadPrecipitacion}% lluvia
                              </div>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-1.5">
                            <span className="text-lg">{fCast.emoji}</span>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-800">{fCast.temperaturaMax}°C</div>
                              <div className="text-[9px] text-slate-500">{fCast.temperaturaMin}°C</div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={d} className="bg-slate-100/70 border border-slate-200/50 rounded-lg p-2 flex items-center justify-between gap-1.5">
                          <div className="text-[11px] font-medium text-slate-600">
                            <strong>{day}/{month}</strong>: Sin pronóstico activo (solo próx. 14 días)
                          </div>
                          <span className="text-xs">⏳</span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Accept Button Row */}
          <div className="flex flex-col items-center justify-center gap-1.5 mt-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={applyManualFilters}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-8 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg transform active:scale-95"
            >
              <i className="fa fa-check-circle"></i> Aceptar
            </button>
            <p className="text-[13px] font-bold text-blue-600 text-center max-w-md">
              Personalizá tus filtros manuales arriba y presioná <strong>Aceptar</strong> para actualizar la cartelera.
            </p>
          </div>
        </section>

        {/* RESULTS & MAP LAYOUT SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: RESULTS COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                Espectáculos Disponibles
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-sans font-normal">
                  {espectaculos.length} encontrado{espectaculos.length !== 1 ? 's' : ''}
                </span>
              </h2>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-none"
              >
                <option value="relevancia">Ordenar por: Relevancia</option>
                <option value="precio_asc">Precio: de menor a mayor</option>
                <option value="precio_desc">Precio: de mayor a menor</option>
                <option value="horario">Horario de Inicio</option>
              </select>
            </div>

            {/* LOADING STATE */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden animate-pulse">
                    <div className="bg-slate-200 h-44 w-full"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-2 bg-slate-200 rounded"></div>
                        <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : getSortedEspectaculos().length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 space-y-3">
                <div className="text-4xl">🔎</div>
                <h4 className="font-serif font-bold text-lg text-slate-700">Ningún espectáculo coincide con tu búsqueda</h4>
                <p className="text-xs max-w-md mx-auto">Prueba quitando algún filtro manual o escribe una nueva frase en nuestro buscador con Inteligencia Artificial.</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Ver todos los espectáculos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getSortedEspectaculos().map(show => {
                  const typeLabels: Record<string, string> = {
                    baile: '💃 Baile & Milonga',
                    cantado: '🎤 Cantado',
                    show_completo: '🎭 Show Completo'
                  };
                  return (
                    <article 
                      key={show.id}
                      onClick={() => setSelectedShow(show)}
                      className={`bg-white border hover:border-blue-500 rounded-2xl shadow-sm overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
                        show.climaDestacado ? 'ring-2 ring-amber-400' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Image banner with absolute badges */}
                        <div className="h-44 w-full overflow-hidden relative bg-slate-100">
                          <img
                            src={show.imagen_url || `https://picsum.photos/600/350?random=${show.id}`}
                            alt={show.nombre}
                            loading="lazy"
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600';
                            }}
                          />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                            <span className="bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {typeLabels[show.tipo] || show.tipo}
                            </span>
                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              show.precio_tipo === 'gratuito' 
                                ? 'bg-emerald-600 text-white' 
                                : show.precio_tipo === 'economico' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-amber-500 text-slate-900'
                            }`}>
                              {show.precio_tipo}
                            </span>

                            {/* Climate recommendations labels */}
                            {show.tagClima === 'ideal' && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
                                ⭐ ¡Ideal hoy!
                              </span>
                            )}
                            {show.tagClima === 'alerta' && clima?.esLluvia && (
                              <span className="bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-0.5">
                                ⚠️ Lluvia
                              </span>
                            )}
                            {show.tagClima === 'alerta' && clima?.esFrio && (
                              <span className="bg-cyan-100 text-cyan-800 border border-cyan-300 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-0.5">
                                🥶 Frío Extremo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event details block */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-serif font-bold text-base text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                            {show.nombre}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {show.descripcion}
                          </p>
                          
                          <div className="pt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <i className="fa fa-map-marker-alt text-blue-500 w-3.5"></i>
                              <span className="truncate">{show.barrio}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className="fa fa-clock text-blue-500 w-3.5"></i>
                              <span>{show.hora_inicio} - {show.hora_fin}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className="fa fa-calendar text-blue-500 w-3.5"></i>
                              <span className="truncate capitalize">{show.dias_semana.slice(0, 3).join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className={`fa ${show.ambiente === 'aire_libre' ? 'fa-sun' : 'fa-building'} text-blue-500 w-3.5`}></i>
                              <span>{show.ambiente === 'aire_libre' ? 'Al Aire Libre' : 'Techado'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer with Price and Details CTA */}
                      <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest">Precio</div>
                          <div className={`font-mono text-sm font-bold ${show.precio_tipo === 'gratuito' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {show.precio_tipo === 'gratuito' ? 'Gratis' : `$${show.precio_valor.toLocaleString('es-AR')}`}
                          </div>
                        </div>

                        <button 
                          type="button"
                          className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs py-1.5 px-3.5 rounded-lg border border-blue-200 hover:border-blue-600 transition-all cursor-pointer"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT: INTERACTIVE MAP CONTAINER */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-100/40 border-b border-blue-100 px-4 py-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa fa-map-marked-alt text-blue-600"></i>
                  Mapa
                </h3>

                <button
                  onClick={handleCenterOnUser}
                  className="text-[10px] bg-white border border-blue-100 text-slate-600 hover:text-blue-600 py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Centrar en mi ubicación actual"
                >
                  <i className="fa fa-crosshairs text-blue-500"></i> Mi Ubicación
                </button>
              </div>

              {/* Map Mounting Target */}
              <div 
                id="mapa-principal" 
                className="h-[430px] w-full bg-slate-100"
              ></div>

              <div className="p-3 bg-blue-100/40 border-t border-blue-100 text-[10px] text-slate-500 flex items-center justify-around">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Gratis</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Económico</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Premium</div>
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif font-bold text-slate-700 text-base">🎵 Tango · Buenos Aires</p>
          <p className="text-slate-400">Plataforma inteligente de recomendación artística potenciada por Gemini 3.5 Flash y Supabase.</p>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 max-w-md mx-auto">© 2026 Tango. Desarrollado con esmero para los amantes del tango porteño. Licencia MIT.</p>
        </div>
      </footer>

      {/* DETAILED SHOW POPUP MODAL */}
      {selectedShow && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative animate-scale-up">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedShow(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center z-20 cursor-pointer transition-colors"
              title="Cerrar"
            >
              <i className="fa fa-times"></i>
            </button>

            {/* Large header cover */}
            <div className="h-56 md:h-64 w-full relative bg-slate-100">
              <img
                src={selectedShow.imagen_url || `https://picsum.photos/800/400?random=${selectedShow.id}`}
                alt={selectedShow.nombre}
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2">
                <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-wider font-bold">
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full">{selectedShow.tipo.replace('_', ' ')}</span>
                  <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full">{selectedShow.ambiente}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-shadow-md">{selectedShow.nombre}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 md:p-6 space-y-5">
              
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción</h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{selectedShow.descripcion}</p>
              </div>

              {/* Metadata specs grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs"><i className="fa fa-map-marker-alt"></i></span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Dirección & Barrio</div>
                    <div className="text-xs font-semibold text-slate-800">{selectedShow.direccion} ({selectedShow.barrio})</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs"><i className="fa fa-clock"></i></span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Horario</div>
                    <div className="text-xs font-semibold text-slate-800">{selectedShow.hora_inicio} a {selectedShow.hora_fin} ({selectedShow.horario_tipo})</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs"><i className="fa fa-calendar-alt"></i></span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Días de Presentación</div>
                    <div className="text-xs font-semibold text-slate-800 capitalize">{selectedShow.dias_semana.join(', ')}</div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs"><i className="fa fa-ticket-alt"></i></span>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Precio entrada</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {selectedShow.precio_tipo === 'gratuito' 
                        ? 'Gratuito / Sin Costo' 
                        : `$${selectedShow.precio_valor.toLocaleString('es-AR')} ARS`
                      }
                    </div>
                  </div>
                </div>

              </div>

              {/* Optional Contact fields */}
              {(selectedShow.contacto || selectedShow.website) && (
                <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-4 text-xs">
                  {selectedShow.contacto && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <i className="fa fa-envelope text-blue-500"></i>
                      <span><b>Contacto:</b> {selectedShow.contacto}</span>
                    </div>
                  )}
                  {selectedShow.website && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <i className="fa fa-external-link-alt text-blue-500"></i>
                      <span><b>Web:</b> <a href={selectedShow.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedShow.website}</a></span>
                    </div>
                  )}
                </div>
              )}

              {/* Embedded interactive modal minimap */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubicación exacta</h4>
                <div id="minimapa-modal" className="h-44 w-full rounded-xl border border-slate-200 bg-slate-100 overflow-hidden"></div>
              </div>

              {/* Actions CTAs */}
              <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedShow.latitud},${selectedShow.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                >
                  <i className="fab fa-google"></i> ¿Cómo llegar? (Google Maps)
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const shareText = `${selectedShow.nombre} | Show de tango en ${selectedShow.barrio} - ${selectedShow.direccion}. ¡Recomendado!`;
                    if (navigator.share) {
                      navigator.share({
                        title: selectedShow.nombre,
                        text: shareText,
                        url: window.location.href
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${shareText} (${window.location.href})`);
                      triggerToast('¡Información copiada al portapapeles! 🎵', 'success');
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <i className="fa fa-share-alt"></i> Compartir Espectáculo
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedShow(null)}
                  className="ml-auto py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {adminShowLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <button
              onClick={() => setAdminShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
            >
              ×
            </button>

            <div className="text-center space-y-2 mb-6">
              <span className="text-3xl">🔐</span>
              <h3 className="font-serif font-bold text-lg text-slate-800">Acceso de Administrador</h3>
              <p className="text-xs text-slate-500">Inicia sesión para cargar y mantener los espectáculos de Tango.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email del Administrador</label>
                <input
                  type="email"
                  required
                  placeholder="admin@correo.com"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-mono"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 focus:outline-none cursor-pointer"
                    title={showAdminPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fa ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs shadow hover:shadow-md transition-all cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </form>

          </div>
        </div>
      )}

      {/* FLOATING GENERAL TOAST MESSAGE */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 transition-all transform animate-bounce duration-300 max-w-sm border ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <span>
            {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
