// Tarih formatı yardımcıları — dd/mm/yyyy

// SQLite datetime → dd/mm/yyyy HH:MM
export function formatTarih(tarih: string): string {
  if (!tarih) return '-'
  // SQLite: "2026-08-05 14:30:00" veya "2026-08-05"
  const parts = tarih.split(' ')
  const datePart = parts[0]
  const timePart = parts[1] || ''
  const [yil, ay, gun] = datePart.split('-')
  if (!yil || !ay || !gun) return tarih
  let result = `${gun}/${ay}/${yil}`
  if (timePart) {
    const [saat, dakika] = timePart.split(':')
    result += ` ${saat}:${dakika}`
  }
  return result
}

// Sadece tarih — dd/mm/yyyy (saat olmadan)
export function formatTarihKisa(tarih: string): string {
  if (!tarih) return '-'
  const parts = tarih.split(' ')
  const datePart = parts[0]
  const [yil, ay, gun] = datePart.split('-')
  if (!yil || !ay || !gun) return tarih
  return `${gun}/${ay}/${yil}`
}

// ISO date (yyyy-mm-dd) → dd/mm/yyyy (date input değerleri için)
export function isoToTr(iso: string): string {
  if (!iso) return ''
  const [yil, ay, gun] = iso.split('-')
  if (!yil || !ay || !gun) return iso
  return `${gun}/${ay}/${yil}`
}

// dd/mm/yyyy → yyyy-mm-dd (date input'a geri çevirmek için)
export function trToIso(tr: string): string {
  if (!tr) return ''
  const [gun, ay, yil] = tr.split('/')
  if (!gun || !ay || !yil) return tr
  return `${yil}-${ay}-${gun}`
}