import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured, STORAGE_BUCKET } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured on the server. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) to .env.local.",
        },
        { status: 503 }
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Could not initialize Supabase client." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = (formData.get("sessionId") as string) || "general";
    const attachmentType = (formData.get("type") as string) || "document";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data." },
        { status: 400 }
      );
    }

    // Sanitize file name & generate unique path in bucket
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${sessionId}/${Date.now()}-${sanitizedName}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage bucket 'chat-uploads'
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        {
          error: `Storage upload failed: ${uploadError.message}. Make sure the bucket '${STORAGE_BUCKET}' exists in your Supabase project.`,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      storagePath,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      type: attachmentType,
    });
  } catch (err: unknown) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during file upload to Supabase." },
      { status: 500 }
    );
  }
}
