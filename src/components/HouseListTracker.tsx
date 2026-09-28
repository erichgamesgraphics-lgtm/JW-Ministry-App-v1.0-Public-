import React, { useState } from 'react';
import {
  Home,
  CheckCircle2,
  Clock,
  UserCheck,
  BookOpen,
  Heart,
  XCircle,
  Ban,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Map,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { HouseItem, HouseStatusType } from '../types.ts';

interface HouseListTrackerProps {
  noteId: string;
  houses: HouseItem[];
  territoryName?: string;
  onUpdateTerritoryName?: (name: string) => void;
  address?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  onUpdateLocation?: (loc: {
    address?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
  }) => void;
}

export const HouseListTracker: React.FC<HouseListTrackerProps> = ({
  noteId,
  houses = [],
  territoryName = '',
  onUpdateTerritoryName,
  address = '',
  locationName = '',
  latitude,
  longitude,
  googleMapsUrl = '',
  onUpdateLocation,
}) => {
  const {
    t,
    addHouseToNote,
    updateHouseInNote,
    deleteHouseFromNote,
    reorderHousesInNote,
  } = useMinistry();

  const [newHouseNumber, setNewHouseNumber] = useState('');
  const [newHouseLabel, setNewHouseLabel] = useState('');
  const [showMapEditor, setShowMapEditor] = useState(false);

  // Local inputs for territory location
  const [addressInput, setAddressInput] = useState(address || locationName || '');
  const [latInput, setLatInput] = useState(latitude !== undefined ? String(latitude) : '');
  const [lngInput, setLngInput] = useState(longitude !== undefined ? String(longitude) : '');
  const [mapZoom, setMapZoom] = useState(15);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // House location editor toggle per house
  const [editingHouseLocId, setEditingHouseLocId] = useState<string | null>(null);

  // Status mapping
  const statusOptions: Array<{
    id: HouseStatusType;
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }> = [
    { id: 'NOT_VISITED', label: t.notes.notVisited, icon: Home, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'VISITED', label: t.notes.visited, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950/60' },
    { id: 'NO_ONE_HOME', label: t.notes.noOneHome, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/60' },
    { id: 'RETURN_VISIT', label: t.notes.returnVisit, icon: UserCheck, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-950/60' },
    { id: 'BIBLE_STUDY', label: t.notes.bibleStudy, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-950/60' },
    { id: 'INTERESTED', label: t.notes.interested, icon: Heart, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-950/60' },
    { id: 'NOT_INTERESTED', label: t.notes.notInterested, icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-950/60' },
    { id: 'DO_NOT_CALL', label: t.notes.doNotCall, icon: Ban, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/60' },
  ];

  // Progress Calculation
  const visitedCount = houses.filter(
    h => h.status !== 'NOT_VISITED' && h.status !== 'NO_ONE_HOME'
  ).length;
  const totalCount = houses.length;
  const visitedPercent = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  // Build optimal Google Maps URL
  const computeMapsUrl = (addrStr?: string, latNum?: number, lngNum?: number, customUrl?: string): string => {
    if (customUrl && customUrl.trim().startsWith('http')) return customUrl.trim();
    if (latNum !== undefined && lngNum !== undefined && !isNaN(latNum) && !isNaN(lngNum)) {
      return `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
    }
    if (addrStr && addrStr.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrStr.trim())}`;
    }
    return 'https://www.google.com/maps';
  };

  const activeTerritoryMapsUrl = computeMapsUrl(address || locationName, latitude, longitude, googleMapsUrl);
  const activeQueryStr = (address || locationName || (latitude && longitude ? `${latitude},${longitude}` : '')).trim();

  // Save location to parent Note
  const handleSaveLocation = () => {
    const parsedLat = latInput ? parseFloat(latInput) : undefined;
    const parsedLng = lngInput ? parseFloat(lngInput) : undefined;
    const computedUrl = computeMapsUrl(addressInput, parsedLat, parsedLng);

    if (onUpdateLocation) {
      onUpdateLocation({
        address: addressInput.trim(),
        locationName: addressInput.trim(),
        latitude: !isNaN(parsedLat!) ? parsedLat : undefined,
        longitude: !isNaN(parsedLng!) ? parsedLng : undefined,
        googleMapsUrl: computedUrl,
      });
    }
    setLocationStatus('Location saved successfully!');
    setTimeout(() => setLocationStatus(null), 3000);
    setShowMapEditor(false);
  };

  // Request browser geolocation on explicit user tap
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('Getting current location...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        if (!addressInput) {
          setAddressInput(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setLocationStatus('Current location set!');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      err => {
        console.warn('Geolocation error:', err);
        setLocationStatus('Location access denied or unavailable.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleOpenGoogleMaps = (urlToOpen: string) => {
    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
  };

  const handleAddHouse = (e: React.FormEvent) => {
    e.preventDefault();
    const num = newHouseNumber.trim() || `${houses.length + 1}`;
    addHouseToNote(noteId, {
      number: num,
      label: newHouseLabel.trim(),
      status: 'NOT_VISITED',
    });
    setNewHouseNumber('');
    setNewHouseLabel('');
  };

  const handleMoveHouse = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= houses.length) return;
    const reordered = [...houses];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderHousesInNote(noteId, reordered);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 sm:p-5 shadow-xs">
      {/* Territory Header & Progress */}
      <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <input
              type="text"
              value={territoryName}
              onChange={e => onUpdateTerritoryName && onUpdateTerritoryName(e.target.value)}
              placeholder={t.notes.territoryName}
              className="w-full text-base font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-hidden py-1"
            />
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
            {t.notes.progressVisited(visitedCount, totalCount, visitedPercent)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${visitedPercent}%` }}
          />
        </div>
      </div>

      {/* Territory Map Section */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Map className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>Territory Map Location</span>
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {activeQueryStr ? activeQueryStr : 'No address set yet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {activeQueryStr && (
              <button
                type="button"
                onClick={() => handleOpenGoogleMaps(activeTerritoryMapsUrl)}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Open in Google Maps"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Google Maps</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMapEditor(!showMapEditor)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
              <span>{showMapEditor ? 'Close' : address ? 'Edit Location' : '+ Add Location'}</span>
            </button>
          </div>
        </div>

        {/* Status notification toast */}
        {locationStatus && (
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
            {locationStatus}
          </p>
        )}

        {/* Address & Coordinates Input Drawer */}
        {showMapEditor && (
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Address or Place Name
              </label>
              <input
                type="text"
                value={addressInput}
                onChange={e => setAddressInput(e.target.value)}
                placeholder="e.g. Main Street 12, Yerevan"
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Latitude (Optional)
                </label>
                <input
                  type="text"
                  value={latInput}
                  onChange={e => setLatInput(e.target.value)}
                  placeholder="e.g. 40.1872"
                  className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Longitude (Optional)
                </label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={e => setLngInput(e.target.value)}
                  placeholder="e.g. 44.5152"
                  className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="py-1.5 px-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Use My Current Location</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLocation}
                className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Territory Location
              </button>
            </div>
          </div>
        )}

        {/* Embedded Interactive Map Viewer when address or query is available */}
        {activeQueryStr && !showMapEditor && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs group">
            <iframe
              title={`Map view for ${activeQueryStr}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(activeQueryStr)}&t=&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-44 sm:h-52 border-none rounded-2xl"
              loading="lazy"
            />

            {/* Map Floating Controls Overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
              <button
                type="button"
                onClick={() => setMapZoom(prev => Math.min(20, prev + 1))}
                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom(prev => Math.max(1, prev - 1))}
                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom(15)}
                className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Recenter Map"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add House Bar */}
      <form onSubmit={handleAddHouse} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={newHouseNumber}
          onChange={e => setNewHouseNumber(e.target.value)}
          placeholder={t.notes.houseNumber}
          className="w-24 text-xs font-bold p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
        />
        <input
          type="text"
          value={newHouseLabel}
          onChange={e => setNewHouseLabel(e.target.value)}
          placeholder={t.notes.houseLabel}
          className="flex-1 min-w-[140px] text-xs font-semibold p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{t.notes.addHouse}</span>
        </button>
      </form>

      {/* House List Items */}
      <div className="space-y-3 pt-2">
        {houses.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6 italic">
            No houses added yet. Type a house number above to begin tracking.
          </p>
        ) : (
          houses.map((house, index) => {
            const currentStatusObj = statusOptions.find(s => s.id === house.status) || statusOptions[0];
            const StatusIcon = currentStatusObj.icon;
            const houseMapUrl = computeMapsUrl(house.address || house.locationName, house.latitude, house.longitude, house.googleMapsUrl);

            return (
              <div
                key={house.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-2.5 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs">
                      {house.number}
                    </span>
                    {house.label && (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {house.label}
                      </span>
                    )}

                    {/* Optional House Map Badge */}
                    {(house.address || house.locationName) && (
                      <button
                        type="button"
                        onClick={() => handleOpenGoogleMaps(houseMapUrl)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold hover:underline cursor-pointer"
                        title="Open house location in Google Maps"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>Map</span>
                      </button>
                    )}
                  </div>

                  {/* House Location & Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingHouseLocId(editingHouseLocId === house.id ? null : house.id)}
                      className={`p-1 rounded-lg cursor-pointer ${
                        house.address || house.locationName ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Set House Address / Location"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveHouse(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveHouse(index, 'down')}
                      disabled={index === houses.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHouseFromNote(noteId, house.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                      title="Delete House"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* House Location Drawer */}
                {editingHouseLocId === house.id && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      value={house.address || house.locationName || ''}
                      onChange={e => updateHouseInNote(noteId, house.id, {
                        address: e.target.value,
                        locationName: e.target.value,
                        googleMapsUrl: computeMapsUrl(e.target.value),
                      })}
                      placeholder="Enter house address (e.g. Main Street 12)..."
                      className="w-full text-xs text-slate-900 dark:text-white bg-transparent border-none focus:outline-hidden"
                    />
                    {(house.address || house.locationName) && (
                      <button
                        type="button"
                        onClick={() => handleOpenGoogleMaps(houseMapUrl)}
                        className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        Open
                      </button>
                    )}
                  </div>
                )}

                {/* Status Options Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map(opt => {
                    const isSelected = house.status === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateHouseInNote(noteId, house.id, { status: opt.id })}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? `${opt.bgColor} ${opt.color} border-slate-300 dark:border-slate-700 shadow-2xs`
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Individual House Note Input */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <Edit3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={house.notes || ''}
                    onChange={e => updateHouseInNote(noteId, house.id, { notes: e.target.value })}
                    placeholder={t.notes.houseNotes}
                    className="w-full text-xs text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-hidden"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
