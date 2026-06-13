"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Navigation, MapPin } from "lucide-react";
import styles from "./DeliveryMap.module.css";

interface DeliveryMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  originName?: string;
  destinationName?: string;
}

export default function DeliveryMap({
  origin,
  destination,
  originName = "Store",
  destinationName = "Customer",
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string; duration: string } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    // Helper to calculate mock distance/time for Leaflet fallback
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      const durationMin = Math.ceil(d * 2.5); // Assume average rider speed 24 km/h (2.5 mins per km)
      return {
        distance: d.toFixed(1) + " km",
        duration: durationMin + " mins",
      };
    };

    if (apiKey && apiKey.trim() !== "") {
      // -------------------------------------------------------------
      // GOOGLE MAPS IMPLEMENTATION
      // -------------------------------------------------------------
      const scriptId = "google-maps-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      const initGoogleMap = () => {
        if (!mapContainerRef.current || !isMounted) return;

        try {
          const google = (window as any).google;
          const map = new google.maps.Map(mapContainerRef.current, {
            center: origin,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          });

          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#FF6B35",
              strokeOpacity: 0.8,
              strokeWeight: 5,
            },
          });

          // Custom markers
          const storeIcon = {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: "#FF6B35",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 6,
          };

          const customerIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#00B4D8",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
          };

          new google.maps.Marker({
            position: origin,
            map: map,
            title: originName,
            icon: storeIcon,
          });

          new google.maps.Marker({
            position: destination,
            map: map,
            title: destinationName,
            icon: customerIcon,
          });

          directionsService.route(
            {
              origin: origin,
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
              if (status === google.maps.DirectionsStatus.OK && isMounted) {
                directionsRenderer.setDirections(result);
                const leg = result.routes[0].legs[0];
                setDistanceInfo({
                  distance: leg.distance.text,
                  duration: leg.duration.text,
                });
                setLoading(false);
              } else {
                // Fallback to straight line if directions fail
                if (isMounted) {
                  const line = new google.maps.Polyline({
                    path: [origin, destination],
                    geodesic: true,
                    strokeColor: "#FF6B35",
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                  });
                  line.setMap(map);
                  const info = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
                  setDistanceInfo(info);
                  setLoading(false);
                }
              }
            }
          );
        } catch (err) {
          console.error("Google maps initialization error:", err);
          if (isMounted) {
            setError("Failed to initialize Google Maps");
            setLoading(false);
          }
        }
      };

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if ((window as any).google) {
            initGoogleMap();
          }
        };
        script.onerror = () => {
          if (isMounted) {
            setError("Google Maps script failed to load");
            setLoading(false);
          }
        };
        document.head.appendChild(script);
      } else if ((window as any).google) {
        initGoogleMap();
      }
    } else {
      // -------------------------------------------------------------
      // LEAFLET OPENSTREETMAP FALLBACK (No API Key Required)
      // -------------------------------------------------------------
      const loadLeaflet = async () => {
        if (!isMounted) return;

        // Add Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Add Leaflet JS
        const scriptId = "leaflet-js";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initLeafletMap = () => {
          if (!mapContainerRef.current || !isMounted) return;

          try {
            const L = (window as any).L;
            if (!L) return;

            // Clear previous map instance if any
            const container = mapContainerRef.current;
            (container as any)._leaflet_id = null;
            container.innerHTML = "";

            const map = L.map(container, {
              zoomControl: true,
              attributionControl: false,
            }).setView([origin.lat, origin.lng], 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
            }).addTo(map);

            // Custom icon styling for Leaflet markers
            const storeMarkerHtml = `
              <div style="background-color: #FF6B35; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <span style="font-size: 14px;">🏪</span>
              </div>
            `;

            const customerMarkerHtml = `
              <div style="background-color: #00B4D8; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                <span style="font-size: 14px;">📍</span>
              </div>
            `;

            const storeIcon = L.divIcon({
              html: storeMarkerHtml,
              className: "",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            const customerIcon = L.divIcon({
              html: customerMarkerHtml,
              className: "",
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            L.marker([origin.lat, origin.lng], { icon: storeIcon }).addTo(map).bindPopup(originName);
            L.marker([destination.lat, destination.lng], { icon: customerIcon }).addTo(map).bindPopup(destinationName);

            // Draw route line
            const routePoints = [
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ];
            L.polyline(routePoints, {
              color: "#FF6B35",
              weight: 4,
              opacity: 0.8,
              dashArray: "8, 8",
            }).addTo(map);

            // Fit bounds
            map.fitBounds(L.latLngBounds([origin.lat, origin.lng], [destination.lat, destination.lng]), {
              padding: [50, 50],
            });

            const info = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
            setDistanceInfo(info);
            setLoading(false);
          } catch (err) {
            console.error("Leaflet init error:", err);
            setError("Failed to load map view");
            setLoading(false);
          }
        };

        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => {
            initLeafletMap();
          };
          script.onerror = () => {
            setError("Leaflet script failed to load");
            setLoading(false);
          };
          document.head.appendChild(script);
        } else {
          // Wait briefly for Leaflet script to register fully
          const checkL = setInterval(() => {
            if ((window as any).L) {
              clearInterval(checkL);
              initLeafletMap();
            }
          }, 100);
        }
      };

      loadLeaflet();
    }

    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, apiKey]);

  return (
    <div className={styles.mapWrapper}>
      {loading && (
        <div className={styles.overlay}>
          <Loader2 className={styles.spinner} />
          <span>Loading live routing...</span>
        </div>
      )}

      {error && (
        <div className={styles.overlayError}>
          <span>{error}</span>
        </div>
      )}

      <div ref={mapContainerRef} className={styles.mapContainer} />

      {distanceInfo && (
        <div className={styles.infoBadge}>
          <div className={styles.badgeItem}>
            <Navigation size={12} className={styles.icon} />
            <span>{distanceInfo.distance}</span>
          </div>
          <div className={styles.badgeItem}>
            <MapPin size={12} className={styles.iconBlue} />
            <span>Est. {distanceInfo.duration}</span>
          </div>
        </div>
      )}
    </div>
  );
}
