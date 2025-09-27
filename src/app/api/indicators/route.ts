import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Path to indicators directory
    const indicatorsPath = path.join(process.cwd(), 'src', 'indicators');
    
    // Check if indicators directory exists
    if (!fs.existsSync(indicatorsPath)) {
      return NextResponse.json([]);
    }

    // Read all indicator directories
    const indicatorDirs = fs.readdirSync(indicatorsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const indicators: any[] = [];

    // Load meta.json from each indicator directory
    for (const dir of indicatorDirs) {
      const metaPath = path.join(indicatorsPath, dir, 'meta.json');
      
      if (fs.existsSync(metaPath)) {
        try {
          const metaContent = fs.readFileSync(metaPath, 'utf8');
          const meta = JSON.parse(metaContent);
          indicators.push(meta);
        } catch (error) {
          console.error(`Error loading meta.json for ${dir}:`, error);
        }
      }
    }

    return NextResponse.json(indicators);
  } catch (error) {
    console.error('Error in /api/indicators:', error);
    return NextResponse.json({ error: 'Failed to load indicators' }, { status: 500 });
  }
}