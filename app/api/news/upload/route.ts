import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // If JSON with base64 payload
    if (contentType.includes('application/json')) {
      const { dataUrl, filename } = await req.json();

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'Image data URL is required' }, { status: 400 });
      }

      // Check size limit (max 5MB)
      if (dataUrl.length > 7 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'Image size exceeds 5MB limit' }, { status: 400 });
      }

      // In serverless environment, base64 data URLs are portable and persist directly in database records
      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: filename || 'uploaded-photo.jpg'
      });
    }

    // If multipart/form-data with file
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('photo') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No photo file provided' }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'Image size exceeds 5MB limit' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mime = file.type || 'image/jpeg';
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: file.name
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err) {
    console.error('Error uploading photo:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
