'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Star, Trash2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { ModernButton } from '@/components/ui/modern-button';
import { cn } from '@/lib/utils';

interface EquipmentImage {
    id: string;
    image_url: string;
    thumbnail_url?: string;
    caption?: string;
    is_primary: boolean;
    display_order: number;
}

interface ImageGalleryProps {
    images: EquipmentImage[];
    equipmentId: string;
    editable?: boolean;
    onDelete?: (imageId: string) => void;
    onSetPrimary?: (imageId: string) => void;
    className?: string;
}

export function ImageGallery({
    images,
    equipmentId,
    editable = false,
    onDelete,
    onSetPrimary,
    className,
}: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (lightboxOpen) {
            setZoomLevel(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [selectedIndex, lightboxOpen]);

    if (!images || images.length === 0) {
        return (
            <div className={cn('aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300', className)}>
                <div className="text-center text-gray-400">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200/50 mb-4">
                        <div className="text-5xl">📷</div>
                    </div>
                    <p className="font-medium">Tidak ada gambar</p>
                    <p className="text-sm text-gray-400 mt-1">Upload foto pertama untuk peralatan ini</p>
                </div>
            </div>
        );
    }

    const currentImage = images[selectedIndex];

    const handlePrevious = () => {
        setSelectedIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setSelectedIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
        if (zoomLevel <= 1.5) {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleDownload = async (imageUrl: string, imageName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = imageName || `equipment-image-${selectedIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) return;

        try {
            const response = await fetch(`/api/equipment/${equipmentId}/images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_id: imageId }),
            });

            if (response.ok && onDelete) {
                onDelete(imageId);
                if (selectedIndex >= images.length - 1) {
                    setSelectedIndex(Math.max(0, images.length - 2));
                }
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleSetPrimary = async (imageId: string) => {
        try {
            const response = await fetch(`/api/equipment/${equipmentId}/images/${imageId}/primary`, {
                method: 'PATCH',
            });

            if (response.ok && onSetPrimary) {
                onSetPrimary(imageId);
            }
        } catch (error) {
            console.error('Error setting primary:', error);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Main Image */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden group border-2 border-gray-200">
                <img
                    src={currentImage.image_url}
                    alt={currentImage.caption || 'Gambar peralatan'}
                    className="w-full h-full object-contain cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => setLightboxOpen(true)}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                )}

                {/* Primary Badge */}
                {currentImage.is_primary && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg">
                        <Star className="h-4 w-4 fill-current" />
                        Gambar Utama
                    </div>
                )}

                {/* Action Buttons Row */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => handleDownload(currentImage.image_url, `equipment-${equipmentId}-image-${selectedIndex + 1}`)}
                        className="p-2.5 bg-blue-500/90 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                        title="Download"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setLightboxOpen(true)}
                        className="p-2.5 bg-purple-500/90 hover:bg-purple-600 text-white rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
                        title="Fullscreen"
                    >
                        <Maximize2 className="h-5 w-5" />
                    </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm">
                    {selectedIndex + 1} / {images.length}
                </div>

                {/* Editable Actions */}
                {editable && (
                    <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!currentImage.is_primary && (
                            <ModernButton
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetPrimary(currentImage.id)}
                                className="bg-white/90 hover:bg-white shadow-lg"
                            >
                                <Star className="h-4 w-4 mr-1" />
                                Jadikan Utama
                            </ModernButton>
                        )}
                        <ModernButton
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(currentImage.id)}
                            className="shadow-lg"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                        </ModernButton>
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                'relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-200',
                                selectedIndex === index
                                    ? 'border-[#ff007a] ring-4 ring-[#ff007a]/20 scale-105'
                                    : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                            )}
                        >
                            <img
                                src={image.thumbnail_url || image.image_url}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {image.is_primary && (
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-yellow-500 to-yellow-500/90 text-white text-xs text-center py-1 font-semibold">
                                    <Star className="h-3 w-3 inline mr-1 fill-current" />
                                    Utama
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Caption */}
            {currentImage.caption && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-700 italic text-center">{currentImage.caption}</p>
                </div>
            )}

            {/* Enhanced Lightbox with Zoom */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-6 right-6 p-3 text-white hover:bg-white/10 rounded-full transition-all z-50"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {/* Zoom Controls */}
                    <div className="absolute top-6 left-6 flex gap-2 z-50">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            disabled={zoomLevel <= 1}
                        >
                            <ZoomOut className="h-6 w-6" />
                        </button>
                        <div className="px-4 py-3 bg-white/10 text-white rounded-full font-medium min-w-[80px] text-center">
                            {Math.round(zoomLevel * 100)}%
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                            disabled={zoomLevel >= 3}
                        >
                            <ZoomIn className="h-6 w-6" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(currentImage.image_url, `equipment-${equipmentId}-image-${selectedIndex + 1}`); }}
                            className="p-3 bg-blue-500/80 hover:bg-blue-600 text-white rounded-full transition-all"
                        >
                            <Download className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); handlePrevious(); }}
                                className="absolute left-6 p-4 text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <ChevronLeft className="h-10 w-10" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-6 p-4 text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <ChevronRight className="h-10 w-10" />
                            </button>
                        </>
                    )}

                    {/* Zoomable Image */}
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            ref={imageRef}
                            src={currentImage.image_url}
                            alt={currentImage.caption || 'Gambar peralatan'}
                            className={cn(
                                "max-w-full max-h-[90vh] object-contain transition-transform",
                                zoomLevel > 1 && "cursor-move"
                            )}
                            style={{
                                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            draggable={false}
                        />
                    </div>

                    {/* Image Info */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-center bg-black/50 px-6 py-3 rounded-xl backdrop-blur-sm">
                        <p className="text-lg font-semibold">{selectedIndex + 1} / {images.length}</p>
                        {currentImage.caption && (
                            <p className="text-sm text-gray-300 mt-1">{currentImage.caption}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
