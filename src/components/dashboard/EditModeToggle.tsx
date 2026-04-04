import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
}

export const EditModeToggle = ({ isEditMode, onToggle }: EditModeToggleProps) => (
  <Button
    variant={isEditMode ? "default" : "outline"}
    size="sm"
    onClick={onToggle}
  >
    <Pencil className="w-4 h-4 mr-2" />
    {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
  </Button>
);
