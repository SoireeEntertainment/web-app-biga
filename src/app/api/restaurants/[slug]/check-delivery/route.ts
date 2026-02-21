import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "BigaPizzeria/1.0 (food ordering; contact via site)";

type NominatimResult = { lat: string; lon: string; display_name?: string }[];

/**
 * GET /api/restaurants/[slug]/check-delivery?address=Via+Roma+1&city=Candiolo&cap=10060
 * Verifica se l'indirizzo è nel raggio di consegna. Geocodifica con Nominatim e calcola la distanza.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const city = searchParams.get("city")?.trim();
  const cap = searchParams.get("cap")?.trim();

  if (!address || !city || !cap) {
    return NextResponse.json(
      { error: "Indirizzo, città e CAP sono obbligatori" },
      { status: 400 }
    );
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      deliveryEnabled: true,
      deliveryRadiusKm: true,
      restaurantLat: true,
      restaurantLng: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Ristorante non trovato" }, { status: 404 });
  }

  if (
    !restaurant.deliveryEnabled ||
    restaurant.deliveryRadiusKm == null ||
    restaurant.restaurantLat == null ||
    restaurant.restaurantLng == null
  ) {
    return NextResponse.json(
      { inRange: false, error: "Consegna non configurata per questo ristorante" },
      { status: 200 }
    );
  }

  const query = `${address}, ${cap} ${city}, Italy`;
  const encoded = encodeURIComponent(query);

  let lat: number;
  let lon: number;

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?q=${encoded}&format=json&limit=1`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { inRange: false, error: "Impossibile verificare l'indirizzo. Riprova." },
        { status: 200 }
      );
    }
    const data = (await res.json()) as NominatimResult;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          inRange: false,
          error: "Indirizzo non trovato. Controlla indirizzo, città e CAP.",
        },
        { status: 200 }
      );
    }
    lat = parseFloat(data[0].lat);
    lon = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json(
        { inRange: false, error: "Indirizzo non valido." },
        { status: 200 }
      );
    }
  } catch {
    return NextResponse.json(
      { inRange: false, error: "Errore durante la verifica dell'indirizzo. Riprova." },
      { status: 200 }
    );
  }

  const distanceKm = haversineKm(
    restaurant.restaurantLat,
    restaurant.restaurantLng,
    lat,
    lon
  );
  const inRange = distanceKm <= restaurant.deliveryRadiusKm;

  return NextResponse.json({
    inRange,
    deliveryLat: lat,
    deliveryLng: lon,
    distanceKm: Math.round(distanceKm * 10) / 10,
    radiusKm: restaurant.deliveryRadiusKm,
    ...(inRange
      ? {}
      : {
          error: `L'indirizzo è fuori dall'area di consegna (${distanceKm.toFixed(1)} km; raggio massimo ${restaurant.deliveryRadiusKm} km).`,
        }),
  });
}
