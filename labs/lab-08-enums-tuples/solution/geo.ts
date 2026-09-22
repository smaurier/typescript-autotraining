// geo.ts — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN.

// readonly labeled tuple :
// - [lat, lng] : arité fixée à 2, ordre garanti ;
// - labels lat/lng : visibles dans l'IDE et les messages d'erreur ;
// - readonly : une coordonnée enregistrée ne se mute pas.
export type LatLng = readonly [lat: number, lng: number];

export function distanceKm(a: LatLng, b: LatLng): number {
  const [latA, lngA] = a; // destructuring typé (number, number)
  const [latB, lngB] = b;
  const R = 6371; // rayon terrestre (km)
  const dLat = ((latB - latA) * Math.PI) / 180;
  const dLng = ((lngB - lngA) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latA * Math.PI) / 180) * Math.cos((latB * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Helper VARIADIC : le rest générique ...etapes: T préserve l'arité.
// Le retour [origine: LatLng, ...T] connaît le nombre EXACT d'étapes,
// contrairement à LatLng[] qui aurait effacé cette information.
export function itineraire<T extends readonly LatLng[]>(origine: LatLng, ...etapes: T): [origine: LatLng, ...T] {
  return [origine, ...etapes];
}
