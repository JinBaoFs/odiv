import {NextResponse} from 'next/server';
import {defaultPalette, themePalettes} from '@/config/theme';

export async function GET() {
  return NextResponse.json({defaultPalette, palettes: themePalettes});
}
