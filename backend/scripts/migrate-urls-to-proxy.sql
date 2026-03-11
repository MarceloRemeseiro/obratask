-- Migración: Actualizar URLs de archivos de MinIO público a proxy
-- Ejecutar con: psql -h HOST -U USER -d DATABASE -f migrate-urls-to-proxy.sql

-- Preview de cambios (sin modificar)
SELECT id, url, 
       REPLACE(url, 'https://minio.jordi.streamingpro.es/obratask/', '/api/files/') as new_url
FROM archivo 
WHERE url LIKE 'https://minio.jordi.streamingpro.es/obratask/%';

-- Actualizar URLs
UPDATE archivo 
SET url = REPLACE(url, 'https://minio.jordi.streamingpro.es/obratask/', '/api/files/')
WHERE url LIKE 'https://minio.jordi.streamingpro.es/obratask/%';

-- Verificar resultado
SELECT COUNT(*) as archivos_actualizados FROM archivo WHERE url LIKE '/api/files/%';
