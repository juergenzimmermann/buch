export function generateISBN() {
    const praefix = '978'; // oder '979'
    const gruppe = '3'; // Deutsche Publikationen
    const verlag = String(Math.floor(Math.random() * 900) + 100); // 3 Ziffern
    const titel = String(Math.floor(Math.random() * 100_000)).padStart(5, '0'); // 5 Ziffern

    // Pruefsumme
    let sum = 0;
    const ean13 = `${praefix}${gruppe}${verlag}${titel}`;
    for (let i = 0; i < ean13.length; i++) {
        const digit = parseInt(ean13[i] ?? '0', 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const pruefziffer = (10 - (sum % 10)) % 10;

    // Format: 978-3-824-40481-0
    return `${praefix}-${gruppe}-${verlag}-${titel}-${pruefziffer}`;
}
