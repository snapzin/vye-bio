import { createContext, useContext, useState, ReactNode } from 'react';
import { Profile } from '@/hooks/useProfile';

interface PreviewData extends Partial<Profile> {
  display_name?: string;
  bio?: string;
  location?: string;
  background_color?: string;
  background_url?: string;
  background_type?: 'solid' | 'image';
  banner_url?: string;
  avatar_shape?: string;
  music_title?: string;
  music_artist?: string;
  music_url?: string;
  music_image_url?: string;
  music_player_style?: string;
}

interface PreviewContextType {
  previewData: PreviewData | null;
  setPreviewData: (data: PreviewData | null | ((prev: PreviewData | null) => PreviewData | null)) => void;
  previewUserId: string | null;
  setPreviewUserId: (userId: string | null) => void;
  refreshKey: number;
  refreshPreview: () => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PreviewContext.Provider value={{ previewData, setPreviewData, previewUserId, setPreviewUserId, refreshKey, refreshPreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}

