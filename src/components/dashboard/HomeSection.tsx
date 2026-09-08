import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Laptop, Trash2, Vote, TrendingUp, Image as ImageIcon, ChevronLeft, ChevronRight, Bus, Clock, ChevronUp, ChevronDown, Pencil, GripVertical } from 'lucide-react';
import { useRoutines, useAddRoutine, useUpdateRoutine, useDeleteRoutine, useReorderRoutines, Routine } from '@/hooks/useRoutines';
import { useNotices } from '@/hooks/useNotices';
import { usePolls, usePollVotes, useVote } from '@/hooks/usePolls';
import { useGallery } from '@/hooks/useGallery';
import { useBusLocations, useBusSchedules } from '@/hooks/useBus';
import { ExamCountdown } from './ExamCountdown';
import { HomeSectionSkeleton } from './SectionSkeletons';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Mini Poll Card for Dashboard
const MiniPollCard = ({ poll, onNavigate }: { poll: any; onNavigate: () => void }) => {
  const { user } = useAuth();
  const { data: votes = [] } = usePollVotes(poll.id);
  const vote = useVote();
  
  const totalVotes = votes.length;
  const userVote = votes.find(v => v.user_id === user?.id);

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    try {
      await vote.mutateAsync({ pollId: poll.id, optionIndex });
      toast.success('Vote recorded!');
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const getVoteCount = (index: number) => votes.filter(v => v.option_index === index).length;
  const getPercentage = (index: number) => totalVotes > 0 ? Math.round((getVoteCount(index) / totalVotes) * 100) : 0;

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Vote className="w-4 h-4 text-accent" />
            Active Poll
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigate} className="text-xs text-muted-foreground">
            View All →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-medium text-foreground mb-3">{poll.question}</p>
        <div className="space-y-2">
          {poll.options.map((option: string, index: number) => {
            const percentage = getPercentage(index);
            const isSelected = userVote?.option_index === index;
            return (
              <button
                key={index}
                onClick={() => handleVote(index)}
                disabled={vote.isPending}
                className={`w-full text-left p-2 rounded-lg border transition-all relative overflow-hidden ${
                  isSelected 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div 
                  className="absolute inset-0 bg-accent/20 transition-all" 
                  style={{ width: `${percentage}%` }} 
                />
                <div className="relative flex justify-between items-center">
                  <span className="text-sm">{option}</span>
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
};

// Gallery Carousel Component
const GalleryCarousel = ({ images, onNavigate }: { images: any[]; onNavigate: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const displayImages = images.slice(0, 5);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (displayImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displayImages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [displayImages.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % displayImages.length);

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (displayImages.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gallery
        </h2>
        <Button variant="ghost" size="sm" onClick={onNavigate} className="text-xs text-muted-foreground">
          View All →
        </Button>
      </div>
      
      <div 
        className="relative rounded-2xl overflow-hidden bg-card border border-border cursor-pointer group touch-pan-y"
        onClick={onNavigate}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Main Image */}
        <div className="aspect-[16/9] relative overflow-hidden">
          {displayImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-105'
              }`}
            >
              <img 
                src={image.image_url} 
                alt={image.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <p className="text-white font-semibold text-lg md:text-xl">{image.title}</p>
                {image.description && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-1">{image.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Dot indicators */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Bus Schedule Preview Component
const BusSchedulePreview = ({ onNavigate }: { onNavigate: () => void }) => {
  const { profile } = useAuth();
  const { data: locations = [] } = useBusLocations();
  
  // Get today's day name in English
  const getTodayDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };
  
  const todayDay = getTodayDay();
  const userLocationId = (profile as any)?.bus_pickup_location;
  const userLocation = locations.find(l => l.id === userLocationId);
  
  const { data: schedules = [] } = useBusSchedules(undefined, todayDay);
  
  const userSchedules = useMemo(() => {
    if (!userLocationId) return { up: [], down: [] };
    const filtered = schedules.filter(s => s.location_id === userLocationId);
    return {
      up: filtered.filter(s => s.direction === 'up').slice(0, 2),
      down: filtered.filter(s => s.direction === 'down').slice(0, 2)
    };
  }, [schedules, userLocationId]);

  const hasSchedules = userSchedules.up.length > 0 || userSchedules.down.length > 0;

  return (
    <Card 
      className="border-primary/30 bg-gradient-to-br from-card to-primary/5 cursor-pointer hover:shadow-lg transition-all"
      onClick={onNavigate}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bus className="w-4 h-4 text-primary" />
            Today's Bus ({todayDay})
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            View All →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!userLocationId ? (
          <p className="text-sm text-muted-foreground">
            Set your pickup location to view bus schedule 🚌
          </p>
        ) : !hasSchedules ? (
          <p className="text-sm text-muted-foreground">
            No buses scheduled for {userLocation?.name} today
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              📍 {userLocation?.name}
            </p>
            
            {/* Up schedules */}
            {userSchedules.up.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <ChevronUp className="w-3 h-3" /> Up
                </div>
                <div className="flex flex-wrap gap-2">
                  {userSchedules.up.map(s => (
                    <Badge key={s.id} variant="outline" className="bg-primary/10 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {s.time} - BUS {s.bus_number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Down schedules */}
            {userSchedules.down.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                  <ChevronDown className="w-3 h-3" /> Down
                </div>
                <div className="flex flex-wrap gap-2">
                  {userSchedules.down.map(s => (
                    <Badge key={s.id} variant="outline" className="bg-destructive/10 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {s.time} - BUS {s.bus_number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const HomeSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGuestMode } = useGuest();
  const isGuest = isGuestMode && !user;
  
  const { hasPermission } = useAuth();

  const { data: routines = [], isLoading: routinesLoading } = useRoutines();
  const { data: notices = [], isLoading: noticesLoading } = useNotices();
  const { data: polls = [], isLoading: pollsLoading } = usePolls();
  const { images: galleryImages, isLoading: galleryLoading } = useGallery();
  const addRoutine = useAddRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();
  const reorderRoutines = useReorderRoutines();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [draggedItem, setDraggedItem] = useState<Routine | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    type: '',
    day: '',
    time: '',
    subject: '',
    teacher: '',
    room: ''
  });

  const [formData, setFormData] = useState({
    type: 'Offline',
    day: '',
    time: '',
    subject: '',
    teacher: '',
    room: ''
  });

  const canEdit = hasPermission('routine');
  const offlineRoutines = routines.filter(r => r.type === 'Offline');
  const onlineRoutines = routines.filter(r => r.type === 'Online');
  const latestNotice = notices[0];
  const latestPoll = polls[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.day || !formData.subject) {
      toast.error('Day and Subject are required');
      return;
    }
    
    try {
      await addRoutine.mutateAsync(formData);
      setFormData({ type: 'Offline', day: '', time: '', subject: '', teacher: '', room: '' });
      toast.success('Routine added successfully');
    } catch (error) {
      toast.error('Failed to add routine');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this class?')) {
      try {
        await deleteRoutine.mutateAsync(id);
        toast.success('Deleted successfully');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setEditForm({
      type: routine.type,
      day: routine.day,
      time: routine.time,
      subject: routine.subject,
      teacher: routine.teacher || '',
      room: routine.room || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoutine || !editForm.day || !editForm.subject) {
      toast.error('Day and Subject are required');
      return;
    }
    
    try {
      await updateRoutine.mutateAsync({
        id: editingRoutine.id,
        ...editForm
      });
      setEditingRoutine(null);
      toast.success('Routine updated successfully');
    } catch (error) {
      toast.error('Failed to update routine');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, routine: Routine) => {
    setDraggedItem(routine);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, routineId: string) => {
    e.preventDefault();
    setDragOverId(routineId);
  };

  const handleDrop = async (e: React.DragEvent, targetRoutine: Routine, routinesList: Routine[]) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetRoutine.id) {
      setDraggedItem(null);
      setDragOverId(null);
      return;
    }
    
    const newOrder = [...routinesList];
    const draggedIndex = newOrder.findIndex(r => r.id === draggedItem.id);
    const targetIndex = newOrder.findIndex(r => r.id === targetRoutine.id);
    
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    const updates = newOrder.map((r, index) => ({
      id: r.id,
      display_order: index + 1
    }));
    
    try {
      await reorderRoutines.mutateAsync(updates);
      toast.success('Routine reordered');
    } catch (error) {
      toast.error('Failed to reorder');
    }
    
    setDraggedItem(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverId(null);
  };

  // Encrypted placeholder for guest mode
  const EncryptedCard = ({ label }: { label: string }) => (
    <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/30 p-5 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-2xl opacity-50">🔒</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-mono text-muted-foreground/50 tracking-widest">******</p>
          <p className="text-xs text-muted-foreground mt-2">Login required to view</p>
        </div>
      </div>
    </div>
  );

  const isLoading = routinesLoading || noticesLoading || pollsLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-up space-y-6">
        <HomeSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">



      {/* 1. Latest Notice - First (encrypted for guests) */}
      {isGuest ? (
        <EncryptedCard label="Latest Notice" />
      ) : latestNotice && (
        <div 
          onClick={() => navigate('/notices')}
          className="bg-gradient-to-r from-accent/20 to-primary/10 border-2 border-accent/40 p-5 rounded-xl cursor-pointer hover:from-accent/30 hover:to-primary/20 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">📢</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Latest Notice</p>
              <h3 className="text-lg font-bold text-foreground">{latestNotice.title}</h3>
              {latestNotice.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{latestNotice.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">📅 {latestNotice.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Exam Countdown */}
      <ExamCountdown />

      {/* 3. Bus Schedule Preview */}
      <BusSchedulePreview onNavigate={() => navigate('/bus')} />

      {/* 3. Class Routines */}
      <div>
        <h2 className="section-title flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Class Routine
        </h2>

        {/* Add Routine Form */}
        {canEdit && (
          <form onSubmit={handleSubmit} className="admin-form space-y-3 mb-4">
            <h3 className="font-semibold text-lg mb-3">Add Class Routine</h3>
            
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Offline">🏢 Offline Class (Campus)</SelectItem>
                <SelectItem value="Online">💻 Online Class</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.day} onValueChange={(v) => setFormData({ ...formData, day: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Time (e.g. 10:00 AM)" 
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <Input 
              placeholder="Subject Name" 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Teacher (optional)" 
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              />
              <Input 
                placeholder="Room (optional)" 
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={addRoutine.isPending}>
              {addRoutine.isPending ? 'Adding...' : 'Add to Routine'}
            </Button>
          </form>
        )}

        {/* Offline Classes */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-foreground">
            <Building className="w-5 h-5 text-primary" />
            <span>Offline Classes</span>
            <Badge variant="secondary" className="ml-2">{offlineRoutines.length}</Badge>
          </div>
          
          {offlineRoutines.length === 0 ? (
            <p className="text-muted-foreground text-sm">No offline classes scheduled</p>
          ) : (<>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canEdit && <TableHead className="w-10"></TableHead>}
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    {canEdit && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offlineRoutines.map((routine) => (
                    <TableRow 
                      key={routine.id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, routine)}
                      onDragOver={(e) => handleDragOver(e, routine.id)}
                      onDrop={(e) => handleDrop(e, routine, offlineRoutines)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        dragOverId === routine.id && 'bg-primary/10 border-t-2 border-primary',
                        draggedItem?.id === routine.id && 'opacity-50'
                      )}
                    >
                      {canEdit && (
                        <TableCell className="w-10 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{routine.day}</TableCell>
                      <TableCell>{routine.time}</TableCell>
                      <TableCell>{routine.subject}</TableCell>
                      <TableCell>{routine.teacher || '-'}</TableCell>
                      <TableCell>{routine.room || '-'}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => openEditModal(routine)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(routine.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {offlineRoutines.map((routine) => (
                <Card key={routine.id} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-medium">{routine.day}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {routine.time}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-base">{routine.subject}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {routine.teacher && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground/70">Teacher:</span> {routine.teacher}
                        </span>
                      )}
                      {routine.room && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-foreground/70">Room:</span> {routine.room}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 justify-end pt-2 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          onClick={() => openEditModal(routine)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(routine.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>)}
        </div>

        {/* Online Classes */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-lg font-semibold text-foreground">
            <Laptop className="w-5 h-5 text-accent" />
            <span>Online Classes</span>
            <Badge variant="secondary" className="ml-2">{onlineRoutines.length}</Badge>
          </div>
          
          {onlineRoutines.length === 0 ? (
            <p className="text-muted-foreground text-sm">No online classes scheduled</p>
          ) : (<>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canEdit && <TableHead className="w-10"></TableHead>}
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    {canEdit && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onlineRoutines.map((routine) => (
                    <TableRow 
                      key={routine.id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, routine)}
                      onDragOver={(e) => handleDragOver(e, routine.id)}
                      onDrop={(e) => handleDrop(e, routine, onlineRoutines)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        dragOverId === routine.id && 'bg-primary/10 border-t-2 border-primary',
                        draggedItem?.id === routine.id && 'opacity-50'
                      )}
                    >
                      {canEdit && (
                        <TableCell className="w-10 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{routine.day}</TableCell>
                      <TableCell>{routine.time}</TableCell>
                      <TableCell>{routine.subject}</TableCell>
                      <TableCell>{routine.teacher || '-'}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => openEditModal(routine)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(routine.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {onlineRoutines.map((routine) => (
                <Card key={routine.id} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-medium">{routine.day}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {routine.time}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-base">{routine.subject}</p>
                    {routine.teacher && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">Teacher:</span> {routine.teacher}
                      </div>
                    )}
                    {canEdit && (
                      <div className="flex gap-1 justify-end pt-2 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          onClick={() => openEditModal(routine)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(routine.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>)}
        </div>
      </div>

      {/* 4. Recent Activity - Poll */}
      {isGuest ? (
        <EncryptedCard label="Active Poll" />
      ) : latestPoll && (
        <MiniPollCard poll={latestPoll} onNavigate={() => navigate('/polls')} />
      )}

      {/* 5. Gallery Carousel */}
      {galleryImages.length > 0 && (
        <GalleryCarousel images={galleryImages} onNavigate={() => navigate('/gallery')} />
      )}

      {/* Edit Routine Modal */}
      <Dialog open={!!editingRoutine} onOpenChange={(open) => !open && setEditingRoutine(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Routine</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Offline">🏢 Offline Class (Campus)</SelectItem>
                <SelectItem value="Online">💻 Online Class</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Select value={editForm.day} onValueChange={(v) => setEditForm({ ...editForm, day: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Time (e.g. 10:00 AM)" 
                value={editForm.time}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              />
            </div>

            <Input 
              placeholder="Subject Name" 
              value={editForm.subject}
              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Teacher (optional)" 
                value={editForm.teacher}
                onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })}
              />
              <Input 
                placeholder="Room (optional)" 
                value={editForm.room}
                onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingRoutine(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRoutine.isPending}>
                {updateRoutine.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
