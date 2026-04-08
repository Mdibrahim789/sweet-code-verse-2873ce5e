import { Bell } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface SendNotificationCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const SendNotificationCheckbox = ({
  checked,
  onCheckedChange,
  disabled = false
}: SendNotificationCheckboxProps) => {
  const { isMaster } = useAuth();

  // Only show for Master Admin
  if (!isMaster()) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <Checkbox
        id="send-notification"
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        disabled={disabled}
      />
      <Label 
        htmlFor="send-notification" 
        className="flex items-center gap-2 cursor-pointer text-sm"
      >
        <Bell className="w-4 h-4 text-primary" />
        Send Push Notification to all
      </Label>
    </div>
  );
};
