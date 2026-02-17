import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  latitude?: number | string;
  longitude?: number | string;
  initialCity?: string;
  onChange: (lat: number, lng: number) => void;
}

const getCityCenter = (city?: string): [number, number] | null => {
  if (!city) return null;
  const normalized = city.toLowerCase();

  switch (normalized) {
    case 'алматы':
    case 'алмата':
      return [43.238949, 76.889709];
    case 'астана':
    case 'нур-султан':
      return [51.1605, 71.4704];
    case 'шымкент':
      return [42.3417, 69.5901];
    case 'караганда':
      return [49.806, 73.085];
    case 'актау':
      return [43.6481, 51.1722];
    case 'атырау':
      return [47.116, 51.883];
    case 'актобе':
      return [50.2839, 57.166];
    case 'костанай':
      return [53.214, 63.6246];
    case 'кокшетау':
      return [53.2833, 69.3833];
    case 'павлодар':
      return [52.2833, 76.9667];
    default:
      return null;
  }
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  initialCity,
  onChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const parseCoord = (value?: number | string): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    const initialLat = parseCoord(latitude);
    const initialLng = parseCoord(longitude);
    const hasInitial = initialLat !== undefined && initialLng !== undefined;

    const cityCenter = !hasInitial ? getCityCenter(initialCity) : null;
    const hasCityCenter = !!cityCenter;

    const center: [number, number] = hasInitial
      ? [initialLat as number, initialLng as number]
      : cityCenter ?? [51.1605, 71.4704]; // Астана по умолчанию, если город не известен

    const zoom = hasInitial ? 16 : hasCityCenter ? 13 : 7;

    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    if (hasInitial) {
      markerRef.current = L.marker(center).addTo(map);
    }

    const handleClick = (event: any) => {
      const { lat, lng } = event.latlng;
      const position: [number, number] = [lat, lng];

      if (!markerRef.current) {
        markerRef.current = L.marker(position).addTo(map);
      } else {
        markerRef.current.setLatLng(position);
      }

      onChange(lat, lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Синхронизация маркера, если координаты изменились извне
  useEffect(() => {
    if (!mapRef.current) return;

    const parseCoord = (value?: number | string): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);

    if (lat === undefined || lng === undefined) return;

    const position: [number, number] = [lat, lng];

    if (!markerRef.current) {
      markerRef.current = L.marker(position).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(position);
    }

    mapRef.current.setView(position, 15);
  }, [latitude, longitude]);

  return (
    <div className="mt-2">
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-md border border-border overflow-hidden"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Нажмите по карте, чтобы выбрать точку. Она будет сохранена как координаты магазина.
      </p>
    </div>
  );
};

