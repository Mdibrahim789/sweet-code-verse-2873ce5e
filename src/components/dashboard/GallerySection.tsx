import { useState, useRef } from 'react';
import { useGallery, useGalleryLikes, GalleryImage } from '@/hooks/useGallery';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Trash2, X, ImagePlus, ChevronLeft, ChevronRight, Image as ImageIcon, Heart } from 'lucide-react';
import { EditModeToggle } from './EditModeToggle';
import { toast } from 'sonner';

export const GallerySection = () => {
  const { images, isLoading, addImage, deleteImage } = useGallery();
  const { allLikes, toggleLike } = useGalleryLikes();
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission('gallery');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLikeCount = (imageId: string) => allLikes.filter(l => l.image_id === imageId).length;
  const isLikedByUser = (imageId: string) => user ? allLikes.some(l => l.image_id === imageId && l.user_id === user.id) : false;

  const handleLike = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like photos');
      return;
    }
    toggleLike.mutate({ imageId, userId: user.id, isLiked: isLikedByUser(imageId) });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;
    
    await addImage.mutateAsync({ title, description, file: selectedFile });
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setPreview(null);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setPreview(null);
    setShowAddForm(false);
  };

  const openImageViewer = (image: GalleryImage, index: number) => {
    setViewImage(image);
    setCurrentIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
      setViewImage(images[newIndex]);
    } else {
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      setViewImage(images[newIndex]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-primary">Loading gallery...</div>
      </div>
    );
  }

  return (
    <section className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title mb-0 border-b-0 pb-0">
          <ImageIcon className="inline-block w-7 h-7 mr-2 text-primary" />
          Gallery
        </h1>
        <div className="flex items-center gap-2">
          {canEdit && (
            <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
          )}
          {canEdit && isEditMode && (
            <Button onClick={() => setShowAddForm(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Photo
            </Button>
          )}
        </div>
      </div>

      {/* Add Photo Form */}
      {showAddForm && canEdit && isEditMode && (
        <div className="admin-form mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Upload New Photo</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div 
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Click to select an image</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP supported</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <Input
              placeholder="Photo Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!selectedFile || !title.trim() || addImage.isPending}>
                {addImage.isPending ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos in gallery yet</p>
          {canEdit && isEditMode && (
            <Button onClick={() => setShowAddForm(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Add First Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const likeCount = getLikeCount(image.id);
            const isLiked = isLikedByUser(image.id);
            
            return (
              <div 
                key={image.id} 
                className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-border cursor-pointer hover:border-primary transition-all duration-300"
                onClick={() => openImageViewer(image, index)}
              >
                <img 
                  src={image.image_url} 
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm truncate">{image.title}</p>
                  </div>
                </div>
                
                {/* Like button - always visible */}
                <button
                  onClick={(e) => handleLike(e, image.id)}
                  className={`absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    isLiked 
                      ? 'bg-destructive/90 text-white' 
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount > 0 && <span>{likeCount}</span>}
                </button>
                
                {canEdit && isEditMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteImage.mutate(image.id); }}
                    className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Viewer Modal */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
          <button 
            onClick={() => setViewImage(null)}
            className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/50 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </button>
          
          {viewImage && (
            <div className="relative">
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/50 rounded-full p-2"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/50 rounded-full p-2"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              <img 
                src={viewImage.image_url} 
                alt={viewImage.title}
                className="w-full max-h-[80vh] object-contain"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{viewImage.title}</h3>
                    {viewImage.description && (
                      <p className="text-white/70 text-sm mt-1">{viewImage.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleLike(e, viewImage.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      isLikedByUser(viewImage.id) 
                        ? 'bg-destructive text-white' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLikedByUser(viewImage.id) ? 'fill-current' : ''}`} />
                    {getLikeCount(viewImage.id) > 0 && <span>{getLikeCount(viewImage.id)}</span>}
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-2">
                  {currentIndex + 1} / {images.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
