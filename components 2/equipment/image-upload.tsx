'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Star } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    equipmentId: string;
    onUploadComplete?: (images: UploadedImage[]) => void;
    maxFiles?: number;
    className?: string;
}

interface UploadedImage {
    id: string;
    image_url: string;
    caption: string | null;
    is_primary: boolean;
}

export function ImageUpload({
    equipmentId,
    onUploadComplete,
    maxFiles = 5,
    className
}: ImageUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = useCallback((newFiles: FileList | null) => {
        if (!newFiles) return;

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        Array.from(newFiles).forEach(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Hanya file gambar yang diperbolehkan');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Ukuran file maksimal 5MB');
                return;
            }

            if (files.length + validFiles.length < maxFiles) {
                validFiles.push(file);
                newPreviews.push(URL.createObjectURL(file));
            }
        });

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setPreviews(prev => [...prev, ...newPreviews]);
            setError(null);
        }
    }, [files.length, maxFiles]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('is_primary', 'true');

            const response = await fetch(`/api/equipment/${equipmentId}/images`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal mengunggah gambar');
            }

            const data = await response.json();

            // Clear files after successful upload
            previews.forEach(url => URL.revokeObjectURL(url));
            setFiles([]);
            setPreviews([]);

            if (onUploadComplete) {
                onUploadComplete(data.images);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                    files.length >= maxFiles && 'opacity-50 pointer-events-none'
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={files.length >= maxFiles || uploading}
                />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">
                    {dragActive ? 'Lepaskan file di sini' : 'Seret & lepas gambar di sini'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    atau klik untuk memilih file
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    Maks. {maxFiles} gambar, ukuran maks. 5MB per gambar
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Preview Grid */}
            {previews.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            {files.length} gambar dipilih
                        </p>
                        <ModernButton
                            onClick={uploadFiles}
                            disabled={uploading}
                            size="sm"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Mengunggah...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Unggah Gambar
                                </>
                            )}
                        </ModernButton>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {previews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                            >
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                        Utama
                                    </div>
                                )}
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                    <p className="text-white text-xs truncate">{files[index]?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
