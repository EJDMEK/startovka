import {NextRequest, NextResponse} from 'next/server';

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is required', {status: 400});
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, {status: response.status});
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Crucially, allow cross-origin access
    headers.set('Access-Control-Allow-Origin', '*');


    return new NextResponse(imageBuffer, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error fetching image.', {status: 500});
  }
}
