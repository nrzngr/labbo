import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET /api/equipment/[id]/images - Get all images for equipment
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createClient();

        const { data: images, error } = await supabase
            .from('equipment_images')
            .select('*')
            .eq('equipment_id', id)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching images:', error);
            return NextResponse.json({ error: 'Gagal mengambil gambar' }, { status: 500 });
        }

        return NextResponse.json({ images });
    } catch (error) {
        console.error('Error in images API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST /api/equipment/[id]/images - Upload images
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: equipmentId } = await params;
        const cookieStore = await cookies();
        const supabase = createClient();

        const sessionCookie = cookieStore.get('session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.user?.id;
        const userRole = session.user?.role;

        if (!userId) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        if (!['admin', 'lab_staff'].includes(userRole)) {
            return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 403 });
        }

        // Get form data
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const isPrimary = formData.get('is_primary') === 'true';
        const caption = formData.get('caption') as string | null;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
        }

        const uploadedImages: { image_url: string;[key: string]: unknown }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                continue;
            }

            // Generate unique filename
            const ext = file.name.split('.').pop();
            const filename = `${equipmentId}/${Date.now()}-${i}.${ext}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('equipment-images')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('equipment-images')
                .getPublicUrl(filename);

            // If this is set as primary, unset other primary images
            if (isPrimary && i === 0) {
                await supabase
                    .from('equipment_images')
                    .update({ is_primary: false })
                    .eq('equipment_id', equipmentId);
            }

            // Get current max display order
            const { data: maxOrderData } = await supabase
                .from('equipment_images')
                .select('display_order')
                .eq('equipment_id', equipmentId)
                .order('display_order', { ascending: false })
                .limit(1)
                .single();

            const nextOrder = (maxOrderData?.display_order || 0) + 1;

            // Save to database
            const { data: imageRecord, error: dbError } = await supabase
                .from('equipment_images')
                .insert({
                    equipment_id: equipmentId,
                    image_url: urlData.publicUrl,
                    caption: caption,
                    is_primary: isPrimary && i === 0,
                    display_order: nextOrder + i,
                    uploaded_by: userId,
                })
                .select()
                .single();

            if (!dbError && imageRecord) {
                uploadedImages.push(imageRecord);
            }
        }

        if (uploadedImages.length === 0) {
            return NextResponse.json({ error: 'Gagal mengunggah gambar' }, { status: 500 });
        }

        // Update equipment's main image_url if this is primary
        if (isPrimary && uploadedImages.length > 0) {
            await supabase
                .from('equipment')
                .update({ image_url: uploadedImages[0].image_url })
                .eq('id', equipmentId);
        }

        return NextResponse.json({
            message: `${uploadedImages.length} gambar berhasil diunggah`,
            images: uploadedImages,
        });
    } catch (error) {
        console.error('Error in upload API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE /api/equipment/[id]/images - Delete image (with imageId in body)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: equipmentId } = await params;
        const cookieStore = await cookies();
        const supabase = createClient();

        const sessionCookie = cookieStore.get('session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        const userId = session.user?.id;
        const userRole = session.user?.role;

        if (!['admin', 'lab_staff'].includes(userRole)) {
            return NextResponse.json({ error: 'Tidak memiliki izin' }, { status: 403 });
        }

        const body = await request.json();
        const { image_id } = body;

        if (!image_id) {
            return NextResponse.json({ error: 'ID gambar diperlukan' }, { status: 400 });
        }

        // Get image record first
        const { data: image } = await supabase
            .from('equipment_images')
            .select('*')
            .eq('id', image_id)
            .eq('equipment_id', equipmentId)
            .single();

        if (!image) {
            return NextResponse.json({ error: 'Gambar tidak ditemukan' }, { status: 404 });
        }

        // Delete from storage
        const imagePath = image.image_url.split('/equipment-images/')[1];
        if (imagePath) {
            await supabase.storage.from('equipment-images').remove([imagePath]);
        }

        // Delete from database
        const { error } = await supabase
            .from('equipment_images')
            .delete()
            .eq('id', image_id);

        if (error) {
            console.error('Error deleting image:', error);
            return NextResponse.json({ error: 'Gagal menghapus gambar' }, { status: 500 });
        }

        // If deleted image was primary, set another image as primary
        if (image.is_primary) {
            const { data: nextImage } = await supabase
                .from('equipment_images')
                .select('id, image_url')
                .eq('equipment_id', equipmentId)
                .order('display_order')
                .limit(1)
                .single();

            if (nextImage) {
                await supabase
                    .from('equipment_images')
                    .update({ is_primary: true })
                    .eq('id', nextImage.id);

                await supabase
                    .from('equipment')
                    .update({ image_url: nextImage.image_url })
                    .eq('id', equipmentId);
            } else {
                await supabase
                    .from('equipment')
                    .update({ image_url: null })
                    .eq('id', equipmentId);
            }
        }

        return NextResponse.json({ success: true, message: 'Gambar berhasil dihapus' });
    } catch (error) {
        console.error('Error in delete API:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
