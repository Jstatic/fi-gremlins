type HSL = {
    h: number;
    s: number;
    l: number;
};

export function hslToRgb(h: number, s: number, l: number): RGB {
  h = (h % 360 + 360) % 360; // Ensure hue is within 0-359
  s = Math.max(0, Math.min(100, s)) / 100; // Ensure saturation is within 0-1
  l = Math.max(0, Math.min(100, l)) / 100; // Ensure lightness is within 0-1

  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;

  let r: number, g: number, b: number;
  if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
  } else {
      r = c; g = 0; b = x;
  }

  r = Math.max((r + m), 0);
  g = Math.max((g + m), 0);
  b = Math.max((b + m), 0);
  return { r, g, b };
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
    // r /= 255;
    // g /= 255;
    // b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h: number, s: number, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        // @ts-ignore
        h /= 6; 
    }
    // @ts-ignore
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return { h, s, l };
}

export function changeColor(color:any, increment:number) {
    let hsl = rgbToHsl(color.r,color.g,color.b)
    hsl.h = (hsl.h + increment * 2) % 360;
    hsl.s = Math.min(Math.max(hsl.s + increment * 1, 0), 100);
    hsl.l = Math.min(Math.max(hsl.l + increment * 2, 0), 100);
    if (hsl.h < 0) hsl.h = 360;
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgb;
  }
