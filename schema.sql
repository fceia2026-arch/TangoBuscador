-- ==========================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - SUPABASE
-- Proyecto: TangoBA (Buscador inteligente de tango)
-- ==========================================

-- 1. Tabla de Espectáculos
CREATE TABLE IF NOT EXISTS espectaculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('baile', 'cantado', 'show_completo')),
    precio_tipo VARCHAR(50) NOT NULL CHECK (precio_tipo IN ('gratuito', 'economico', 'premium')),
    precio_valor NUMERIC DEFAULT 0,
    ambiente VARCHAR(50) NOT NULL CHECK (ambiente IN ('aire_libre', 'techado')),
    horario_tipo VARCHAR(50) NOT NULL CHECK (horario_tipo IN ('vespertino', 'nocturno')),
    hora_inicio VARCHAR(10) NOT NULL,
    hora_fin VARCHAR(10) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    barrio VARCHAR(100) NOT NULL,
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    imagen_url TEXT,
    dias_semana TEXT[] NOT NULL DEFAULT '{}',
    contacto VARCHAR(150),
    website TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Consultas/Búsquedas Log (Para analítica y KNIME)
CREATE TABLE IF NOT EXISTS consultas_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    filtro_tipo VARCHAR(50),
    filtro_precio VARCHAR(50),
    filtro_ambiente VARCHAR(50),
    filtro_horario VARCHAR(50),
    filtro_dia VARCHAR(50),
    resultados_count INTEGER DEFAULT 0,
    clima_condicion TEXT,
    clima_temp NUMERIC,
    uso_gemini BOOLEAN DEFAULT false,
    session_id VARCHAR(100) NOT NULL
);

-- 3. Índices para Optimización de Consultas
CREATE INDEX IF NOT EXISTS idx_espectaculos_activo ON espectaculos(activo);
CREATE INDEX IF NOT EXISTS idx_consultas_log_fecha ON consultas_log(fecha);

-- 4. Habilitar Seguridad de Fila (RLS - Row Level Security)
ALTER TABLE espectaculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas_log ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de Acceso para Clientes Públicos (Anon)
DROP POLICY IF EXISTS "Permitir lectura pública de espectáculos" ON espectaculos;
CREATE POLICY "Permitir lectura pública de espectáculos" ON espectaculos 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anonimos en espectáculos" ON espectaculos;
CREATE POLICY "Permitir todo a usuarios anonimos en espectáculos" ON espectaculos 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserción pública de consultas_log" ON consultas_log;
CREATE POLICY "Permitir inserción pública de consultas_log" ON consultas_log 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura pública de consultas_log" ON consultas_log;
CREATE POLICY "Permitir lectura pública de consultas_log" ON consultas_log 
    FOR SELECT USING (true);

-- 6. Insertar Datos de Prueba (Seed Data)
-- Este bloque inserta los espectáculos por defecto si la tabla está vacía.
INSERT INTO espectaculos (nombre, descripcion, tipo, precio_tipo, precio_valor, ambiente, horario_tipo, hora_inicio, hora_fin, direccion, barrio, latitud, longitud, imagen_url, dias_semana, website, activo)
VALUES
('Milonga del Indio', 'La milonga más tradicional de San Telmo en plaza histórica. Pista al aire libre e histórica de madera cuando llueve.', 'baile', 'economico', 500, 'techado', 'nocturno', '22:00', '03:00', 'Humberto Primo 462, San Telmo', 'San Telmo', -34.6218, -58.3730, 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=600&q=80', ARRAY['viernes', 'sabado'], 'https://www.facebook.com/milongadelindiosantelmo', true),

('Tango en Plaza Dorrego', 'El show más icónico de Buenos Aires, bailado por profesionales en el corazón de la feria histórica. Todos los domingos.', 'show_completo', 'gratuito', 0, 'aire_libre', 'vespertino', '17:00', '20:00', 'Plaza Dorrego s/n, San Telmo', 'San Telmo', -34.6231, -58.3695, 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80', ARRAY['domingo'], 'https://turismo.buenosaires.gob.ar', true),

('Orquesta Típica Ciudad Baile', 'Concierto de tango de gran orquesta clásica con cantantes en vivo. Gran acústica y ambiente de época.', 'cantado', 'economico', 1200, 'techado', 'nocturno', '21:00', '23:30', 'Av. Corrientes 1234, Centro', 'Centro', -34.6037, -58.3816, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80', ARRAY['jueves', 'sabado'], NULL, true),

('Café de los Angelitos', 'La experiencia de tango más lujosa e histórica. Cena show de tres pasos con orquesta en vivo, bailarines de nivel internacional y vestuarios espectaculares.', 'show_completo', 'premium', 18000, 'techado', 'nocturno', '20:00', '23:00', 'Av. Rivadavia 2100, Balvanera', 'Balvanera', -34.6089, -58.3925, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80', ARRAY['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'], 'https://www.cafedelosangelitos.com', true),

('Tango Callejero en Caminito', 'Espectáculo al aire libre gratuito en el pasaje más colorido de La Boca. Bailarines y cantantes se presentan de forma continua.', 'baile', 'gratuito', 0, 'aire_libre', 'vespertino', '14:00', '19:00', 'Caminito s/n, La Boca', 'La Boca', -34.6345, -58.3631, 'https://images.unsplash.com/photo-1551524164-687a55dd1126?auto=format&fit=crop&w=600&q=80', ARRAY['sabado', 'domingo'], NULL, true),

('La Viruta Tango Club', 'Mítica escuela y milonga de trasnoche en Palermo Soho. Ideal para aprender los primeros pasos y bailar hasta el amanecer.', 'baile', 'economico', 1500, 'techado', 'nocturno', '23:00', '05:00', 'Armenia 1366, Palermo', 'Palermo', -34.5869, -58.4291, 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=600&q=80', ARRAY['miercoles', 'viernes', 'sabado', 'domingo'], 'https://www.lavirutatango.com', true),

('Anfiteatro Parque Centenario', 'Ciclos de conciertos y espectáculos de tango gratuitos bajo las estrellas, organizados por el Gobierno de la Ciudad.', 'show_completo', 'gratuito', 0, 'aire_libre', 'vespertino', '16:00', '19:00', 'Av. Ángel Gallardo 490, Caballito', 'Caballito', -34.6063, -58.4388, 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80', ARRAY['domingo'], 'https://www.buenosaires.gob.ar/agendacultural', true),

('Centro Cultural Torquato Tasso', 'Famoso reducto de tango tradicional en San Telmo. Cuenta con shows íntimos de cantantes de culto y milongas tradicionales excelentes.', 'baile', 'economico', 800, 'techado', 'nocturno', '20:00', '02:00', 'Defensa 1575, San Telmo', 'San Telmo', -34.6264, -58.3706, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', ARRAY['sabado'], 'https://www.torquatotasso.com.ar', true)
ON CONFLICT DO NOTHING;
