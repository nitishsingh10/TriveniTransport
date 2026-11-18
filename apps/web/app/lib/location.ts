export interface LocationBias {
  lat: number;
  lng: number;
}

let browserLocationRequest: Promise<LocationBias | null> | null = null;

export function getBrowserLocation(): Promise<LocationBias | null> {
  if (browserLocationRequest) return browserLocationRequest;
  browserLocationRequest = new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 },
    );
  });
  return browserLocationRequest;
}
