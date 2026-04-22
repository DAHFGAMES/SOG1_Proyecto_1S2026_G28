/**
 * Mapeo SKU (default_code) -> ruta de imagen estática servida desde /public.
 *
 * Las imágenes viven en `public/products/` y fueron copiadas desde
 * `04-general/img/` durante el setup inicial.
 */

export const PRODUCT_IMAGES: Record<string, string> = {
  "EL-001": "/products/01-PCB.jpg",
  "EL-002": "/products/02-Arduino.png",
  "EL-003": "/products/03-Raspberry.jpg",
  "EL-004": "/products/04-Esp32.jpg",
  "EL-005": "/products/05-OledScreen.jpg",
  "EL-006": "/products/06-Ultrasonic.jpg",
  "EL-007": "/products/07-NEMA17.jpg",
  "EL-008": "/products/08-DriverA4988.jpg",
  "EL-009": "/products/09-rele5v4ch.jpeg",
  "EL-010": "/products/10-DHT22.jpg",
  "EL-011": "/products/11-LM2596.jpg",
  "EL-012": "/products/12-LiPoBattery2000mAh.jpg",
  "EL-013": "/products/13-TP4056.jpg",
  "EL-014": "/products/14-GPSNEO6M.jpg",
  "EL-015": "/products/15-OV2640.jpg",
  "EL-016": "/products/16-MAX7219.jpg",
  "EL-017": "/products/17-MQ2.jpg",
  "EL-018": "/products/18-SG90.jpg",
  "EL-019": "/products/19-RFIDRC522.jpg",
  "EL-020": "/products/20-ATX600W.jpg",
  "EL-021": "/products/21-DSO138.jpg",
  "EL-022": "/products/22-DT9205A.jpg",
  "EL-023": "/products/23-SolderingIron60W.jpg",
  "EL-024": "/products/24-LeadFreeSolder08mm.jpg",
  "EL-025": "/products/25-MX4ThermalPaste.jpg",
  "EL-026": "/products/26-Heatsink40x40x11.jpg",
  "EL-027": "/products/27-MCP2515.jpg",
  "EL-028": "/products/28-ACS712-30A.jpg",
  "EL-029": "/products/29-WS2812B-1m.jpg",
  "EL-030": "/products/30-ABSProjectBox115x90.jpg",
};

export function getProductImage(code: string | false | null | undefined): string {
  if (!code) return "/products/placeholder.svg";
  return PRODUCT_IMAGES[code] ?? "/products/placeholder.svg";
}
