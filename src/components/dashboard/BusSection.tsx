import { useState, useMemo, useEffect } from 'react';
import { Bus, MapPin, Clock, ChevronDown, ChevronUp, Plus, Trash2, Upload, Settings, Calendar, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useGuest } from '@/contexts/GuestContext';
import { EditModeToggle } from './EditModeToggle';
import { BusScheduleSkeleton } from './SectionSkeletons';
import { 
  useBusLocations, 
  useBusSchedules, 
  useAddBusLocation, 
  useDeleteBusLocation,
  useAddBusSchedule,
  useBulkAddBusSchedules,
  useDeleteBusSchedule,
  useUpdateBusSchedule,
  useClearBusSchedules,
  useUpdateUserBusLocation,
  BusSchedule
} from '@/hooks/useBus';

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const BENGALI_DAYS_MAP: Record<string, string> = {
  'শনিবার': 'Saturday',
  'রবিবার': 'Sunday',
  'রোববার': 'Sunday',
  'সোমবার': 'Monday',
  'মঙ্গলবার': 'Tuesday',
  'বুধবার': 'Wednesday',
  'বৃহস্পতিবার': 'Thursday',
  'শুক্রবার': 'Friday',
};

// Clean outer punctuation (hyphens, dashes, colons) and whitespace
const stripPunctuation = (str: string): string => {
  return str.replace(/^[\s\u2014\-:]+/, '').replace(/[\s\u2014\-:]+$/, '').trim();
};

// Normalize location name: strip outer hyphens, colons, dashes, and extra spaces
const normalizeLocationName = (name: string): string => {
  return stripPunctuation(name)
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const isLocationExactMatch = (loc1: string, loc2: string): boolean => {
  return normalizeLocationName(loc1) === normalizeLocationName(loc2);
};

// Check if a line is a header (title, day, or divider) and optionally return detected day
const checkHeaderOrDay = (line: string): { isHeader: boolean; detectedDay?: string } => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===') || trimmed.startsWith('___')) {
    return { isHeader: true };
  }
  
  const clean = stripPunctuation(trimmed);
  if (!clean) return { isHeader: true };

  const lower = clean.toLowerCase();
  if (
    clean.includes('বাস সিডিউল') ||
    clean.includes('বাস শিডিউল') ||
    clean.includes('বাস রুট') ||
    lower.includes('bus schedule') ||
    lower.includes('schedule')
  ) {
    return { isHeader: true };
  }

  // Direction headers
  if (
    clean.includes('আপ টাইম') ||
    clean.includes('ডাউন টাইম') ||
    lower.includes('up time') ||
    lower.includes('down time')
  ) {
    return { isHeader: true };
  }

  // Check Bengali days
  for (const [bnDay, enDay] of Object.entries(BENGALI_DAYS_MAP)) {
    if (clean.includes(bnDay)) {
      return { isHeader: true, detectedDay: enDay };
    }
  }

  // Check English days
  for (const day of DAYS) {
    if (lower === day.toLowerCase() || lower.startsWith(day.toLowerCase())) {
      return { isHeader: true, detectedDay: day };
    }
  }

  return { isHeader: false };
};

export const BusSection = () => {
  const { user, profile, isMaster, hasPermission, refreshProfile } = useAuth();
  const canManageBus = hasPermission('bus');
  const [isEditMode, setIsEditMode] = useState(false);
  const { isGuestMode } = useGuest();
  const isGuest = isGuestMode && !user;
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Friday');
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [newSchedule, setNewSchedule] = useState<{
    location_id: string;
    day: string;
    direction: 'up' | 'down';
    time: string;
    bus_number: string;
  }>({
    location_id: '',
    day: 'Friday',
    direction: 'up',
    time: '',
    bus_number: ''
  });

  const { data: locations = [], isLoading: locationsLoading } = useBusLocations();
  const { data: schedules = [], isLoading: schedulesLoading } = useBusSchedules(undefined, selectedDay);
  
  const addLocation = useAddBusLocation();
  const deleteLocation = useDeleteBusLocation();
  const addSchedule = useAddBusSchedule();
  const bulkAddSchedules = useBulkAddBusSchedules();
  const deleteSchedule = useDeleteBusSchedule();
  const updateSchedule = useUpdateBusSchedule();
  const clearSchedules = useClearBusSchedules();
  const updateUserLocation = useUpdateUserBusLocation();

  // Sync local state with profile on load
  useEffect(() => {
    if (profile && !locationInitialized) {
      const profileLocationId = (profile as any)?.bus_pickup_location;
      setSelectedLocationId(profileLocationId || null);
      setLocationInitialized(true);
    }
  }, [profile, locationInitialized]);

  // Use local state for immediate UI updates
  const activeLocationId = selectedLocationId;
  const activeLocation = locations.find(l => l.id === activeLocationId);

  // Filter schedules for active location
  const userSchedules = useMemo(() => {
    if (!activeLocationId) return [];
    return schedules.filter(s => s.location_id === activeLocationId);
  }, [schedules, activeLocationId]);

  // Group schedules by direction
  const groupedSchedules = useMemo(() => {
    const targetSchedules = activeLocationId ? userSchedules : schedules;
    const upSchedules = targetSchedules.filter(s => s.direction === 'up');
    const downSchedules = targetSchedules.filter(s => s.direction === 'down');
    return { up: upSchedules, down: downSchedules };
  }, [activeLocationId, userSchedules, schedules]);

  // Group all schedules by location for admin view
  const schedulesByLocation = useMemo(() => {
    const grouped: Record<string, { up: BusSchedule[], down: BusSchedule[] }> = {};
    schedules.forEach(s => {
      if (!grouped[s.location_id]) {
        grouped[s.location_id] = { up: [], down: [] };
      }
      grouped[s.location_id][s.direction].push(s);
    });
    return grouped;
  }, [schedules]);

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      addLocation.mutate(newLocation.trim());
      setNewLocation('');
    }
  };

  const handleAddSchedule = () => {
    if (newSchedule.location_id && newSchedule.time && newSchedule.bus_number) {
      addSchedule.mutate(newSchedule);
      setNewSchedule({ ...newSchedule, time: '', bus_number: '' });
    }
  };

  // Extract locations from bulk text that don't exist yet
  const extractNewLocations = (text: string, currentLocations: typeof locations): string[] => {
    const lines = text.split('\n');
    const foundLocations: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const headerCheck = checkHeaderOrDay(trimmed);
      if (headerCheck.isHeader) continue;
      
      // Check if this is a location line (ends with - or : or doesn't have time/bus patterns)
      const isTimeOrBus = trimmed.match(/\d{1,2}[:.]\d{2}\s*(?:AM|PM)/i) || trimmed.match(/BUS\s+/i);
      const isLocationLine = trimmed.endsWith('-') || trimmed.endsWith(':') || !isTimeOrBus;
      
      if (isLocationLine) {
        const locationName = stripPunctuation(trimmed);
        if (locationName && !foundLocations.some(f => isLocationExactMatch(f, locationName))) {
          foundLocations.push(locationName);
        }
      }
    }
    
    // Filter out locations that already exist in DB using EXACT match
    return foundLocations.filter(name => 
      !currentLocations.some(l => isLocationExactMatch(l.name, name))
    );
  };

  const parseBulkText = (text: string, day: string, currentLocations: typeof locations): Omit<BusSchedule, 'id' | 'created_at' | 'created_by' | 'bus_locations'>[] => {
    const lines = text.split('\n');
    const schedules: Omit<BusSchedule, 'id' | 'created_at' | 'created_by' | 'bus_locations'>[] = [];
    let currentLocation = '';
    let currentDirection: 'up' | 'down' = 'up';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for direction markers
      if (trimmed.includes('আপ টাইম') || trimmed.toLowerCase().includes('up time')) {
        currentDirection = 'up';
        continue;
      }
      if (trimmed.includes('ডাউন টাইম') || trimmed.toLowerCase().includes('down time')) {
        currentDirection = 'down';
        continue;
      }

      // Skip title / day headers
      const headerCheck = checkHeaderOrDay(trimmed);
      if (headerCheck.isHeader) continue;

      // Check if this is a location line
      const isTimeOrBus = trimmed.match(/\d{1,2}[:.]\d{2}\s*(?:AM|PM)/i) || trimmed.match(/BUS\s+/i);
      const isLocationLine = trimmed.endsWith('-') || trimmed.endsWith(':') || !isTimeOrBus;
      
      if (isLocationLine) {
        currentLocation = stripPunctuation(trimmed);
        continue;
      }

      // Parse schedule line (e.g., "06:15 AM BUS 41" or "08:30 AM BUS DD")
      const timeMatch = trimmed.match(/(\d{1,2}[:.]\d{2}\s*(?:AM|PM))/i);
      const busMatch = trimmed.match(/BUS\s+(\S+)/i);

      if (timeMatch && busMatch && currentLocation) {
        // Use EXACT normalized match so "শিববাড়ি ডুয়েট" does NOT merge into "শিববাড়ি"
        const location = currentLocations.find(l => isLocationExactMatch(l.name, currentLocation));

        if (location) {
          schedules.push({
            location_id: location.id,
            day,
            direction: currentDirection,
            time: timeMatch[1].replace('.', ':').toUpperCase(),
            bus_number: busMatch[1]
          });
        }
      }
    }

    return schedules;
  };

  const [importStatus, setImportStatus] = useState<string>('');

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;

    setIsImporting(true);
    try {
      // Auto-detect day if mentioned in text (e.g. "শুক্রবার :" -> "Friday")
      let targetDay = selectedDay;
      for (const line of bulkText.split('\n')) {
        const check = checkHeaderOrDay(line);
        if (check.detectedDay) {
          targetDay = check.detectedDay;
          setSelectedDay(targetDay);
          break;
        }
      }

      // Step 1: Find locations that need to be created
      const newLocationNames = extractNewLocations(bulkText, locations);
      const allLocations = [...locations];
      
      if (newLocationNames.length > 0) {
        setImportStatus(`Creating ${newLocationNames.length} new location(s)...`);
        
        for (const name of newLocationNames) {
          const created = await addLocation.mutateAsync(name);
          if (created) {
            allLocations.push(created as BusLocation);
          }
        }
      }

      // Step 2: Parse bulk text with complete list of locations (including newly created ones)
      const parsed = parseBulkText(bulkText, targetDay, allLocations);
      if (parsed.length > 0) {
        setImportStatus(`Importing ${parsed.length} schedules for ${targetDay}...`);
        await bulkAddSchedules.mutateAsync(parsed);
        setBulkText('');
        setShowBulkImport(false);
        setImportStatus('');
      } else {
        setImportStatus('No valid schedules found. Please check the text format.');
      }
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const ScheduleCard = ({ schedule }: { schedule: BusSchedule }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTime, setEditTime] = useState(schedule.time);
    const [editBusNumber, setEditBusNumber] = useState(schedule.bus_number);

    const handleSave = () => {
      if (editTime.trim() && editBusNumber.trim()) {
        updateSchedule.mutate({
          id: schedule.id,
          time: editTime.trim(),
          bus_number: editBusNumber.trim()
        }, {
          onSuccess: () => setIsEditing(false)
        });
      }
    };

    const handleCancel = () => {
      setEditTime(schedule.time);
      setEditBusNumber(schedule.bus_number);
      setIsEditing(false);
    };

    if (isEditing && canManageBus) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border-2 border-primary/30">
          <Input 
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            placeholder="Time (e.g., 7:00 AM)"
            className="w-28 h-8 text-sm"
          />
          <Input 
            value={editBusNumber}
            onChange={(e) => setEditBusNumber(e.target.value)}
            placeholder="Bus #"
            className="w-16 h-8 text-sm"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary hover:text-primary/80"
            onClick={handleSave}
            disabled={updateSchedule.isPending}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground"
            onClick={handleCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{schedule.time}</span>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <Bus className="w-3 h-3 mr-1" />
            BUS {schedule.bus_number}
          </Badge>
        </div>
        {canManageBus && isEditMode && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive"
              onClick={() => deleteSchedule.mutate(schedule.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (locationsLoading) {
    return (
      <div className="animate-fade-up">
        <BusScheduleSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bus Schedule</h2>
          <p className="text-muted-foreground">View your bus timings</p>
          {schedules.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last updated: {new Date(Math.max(...schedules.map(s => new Date(s.created_at).getTime()))).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
        {canManageBus && (
          <div className="flex gap-2">
            <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
            <Dialog open={showLocationSettings} onOpenChange={setShowLocationSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Locations
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby="locations-dialog-description">
                <DialogHeader>
                  <DialogTitle>Manage Bus Locations</DialogTitle>
                  <DialogDescription id="locations-dialog-description">Add or remove bus pickup locations</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="New location name" 
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                    <Button onClick={handleAddLocation} disabled={addLocation.isPending}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{loc.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteLocation.mutate(loc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="bulk-import-description">
                <DialogHeader>
                  <DialogTitle>Bulk Import Schedules</DialogTitle>
                  <DialogDescription id="bulk-import-description">Paste schedule text to import multiple entries at once</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea 
                    placeholder={`Paste bus schedule in this format:

আপ টাইম :
ভালুকা -
6:15 AM BUS 41
6:30 AM BUS 36
মাওনা -
6:30 AM BUS 32
---
ডাউন টাইম :
ভালুকা -
6:10 PM BUS 36`}
                    className="min-h-[300px] font-mono text-sm"
                    value={bulkText}
                    onChange={(e) => { setBulkText(e.target.value); setImportStatus(''); }}
                  />
                  {importStatus && (
                    <p className="text-sm text-primary font-medium">{importStatus}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Format:</strong> Locations auto-created if missing. "আপ টাইম" = Up, "ডাউন টাইম" = Down</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkImport} 
                      disabled={isImporting || bulkAddSchedules.isPending || addLocation.isPending || !bulkText.trim()}
                    >
                      {isImporting ? 'Processing...' : 'Import Schedules'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => clearSchedules.mutate(undefined)}
                      disabled={clearSchedules.isPending}
                    >
                      Clear All Schedules
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* User Location Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Your Pickup Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={activeLocationId || 'all'} 
            onValueChange={(value) => {
              const newLocationId = value === 'all' ? null : value;
              // Update local state immediately for responsive UI
              setSelectedLocationId(newLocationId);
              // Also persist to database
              if (user) {
                updateUserLocation.mutate({ 
                  userId: user.id, 
                  locationId: newLocationId 
                }, {
                  onSuccess: () => {
                    refreshProfile();
                  }
                });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🚌 All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeLocation ? (
            <p className="text-sm text-muted-foreground mt-2">
              Your location: <span className="font-medium text-primary">{activeLocation.name}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Viewing all location schedules
            </p>
          )}
        </CardContent>
      </Card>

      {/* Day Selector */}
      <div className="flex gap-2 flex-wrap">
        {DAYS.map(day => (
          <Button
            key={day}
            variant={selectedDay === day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </Button>
        ))}
      </div>

      {/* Schedule Display */}
      {schedulesLoading ? (
        <div className="animate-pulse text-muted-foreground">Loading schedules...</div>
      ) : activeLocationId ? (
        // Show user's location schedules
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChevronUp className="w-5 h-5 text-primary" />
                Up Time ({activeLocation?.name})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupedSchedules.up.length > 0 ? (
                groupedSchedules.up.map(s => <ScheduleCard key={s.id} schedule={s} />)
              ) : (
                <p className="text-muted-foreground text-sm">No schedules available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChevronDown className="w-5 h-5 text-destructive" />
                Down Time ({activeLocation?.name})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupedSchedules.down.length > 0 ? (
                groupedSchedules.down.map(s => <ScheduleCard key={s.id} schedule={s} />)
              ) : (
                <p className="text-muted-foreground text-sm">No schedules available</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Show all locations for non-selected users or admins
        <Tabs defaultValue="up" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="up">
              <ChevronUp className="w-4 h-4 mr-2" />
              Up Time
            </TabsTrigger>
            <TabsTrigger value="down">
              <ChevronDown className="w-4 h-4 mr-2" />
              Down Time
            </TabsTrigger>
          </TabsList>

          {['up', 'down'].map(direction => (
            <TabsContent key={direction} value={direction} className="space-y-4">
              {locations.map(loc => {
                const locSchedules = schedulesByLocation[loc.id]?.[direction as 'up' | 'down'] || [];
                if (locSchedules.length === 0) return null;

                return (
                  <Card key={loc.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="w-4 h-4 text-primary" />
                        {loc.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {locSchedules.map(s => <ScheduleCard key={s.id} schedule={s} />)}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Admin: Add Schedule Form */}
      {canManageBus && isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Schedule Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select value={newSchedule.location_id} onValueChange={(v) => setNewSchedule({ ...newSchedule, location_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={newSchedule.day} onValueChange={(v) => setNewSchedule({ ...newSchedule, day: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={newSchedule.direction} onValueChange={(v) => setNewSchedule({ ...newSchedule, direction: v as 'up' | 'down' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">Up</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>

              <Input 
                placeholder="Time (e.g., 7:00 AM)"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
              />

              <div className="flex gap-2">
                <Input 
                  placeholder="Bus #"
                  value={newSchedule.bus_number}
                  onChange={(e) => setNewSchedule({ ...newSchedule, bus_number: e.target.value })}
                />
                <Button onClick={handleAddSchedule} disabled={addSchedule.isPending}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
