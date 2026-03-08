import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const { user } = useAuth();
  const { firstName, initials, avatarUrl, updateAvatar, updateDisplayName } = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await updateAvatar(file);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      await updateDisplayName(name.trim());
      toast.success('Name updated');
      setEditingName(false);
    } catch {
      toast.error('Failed to update name');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 max-h-[70vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-semibold text-foreground">Profile</h2>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary/30">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={firstName} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-display font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </motion.button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Name */}
              {editingName ? (
                <div className="flex items-center gap-2 w-full max-w-xs">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    className="flex-1 bg-muted/50 rounded-2xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 ring-primary/40"
                    placeholder="Your name"
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleSaveName} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setName(firstName); setEditingName(true); }}
                  className="text-xl font-display font-bold text-foreground"
                >
                  {firstName}
                </motion.button>
              )}

              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
