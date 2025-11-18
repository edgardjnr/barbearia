import React, { useState, ReactNode } from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from '@/components/ui/context-menu';
import { useLongPress } from '@/hooks/useLongPress';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileContextMenuProps {
  children: ReactNode;
  content: ReactNode;
  onItemClick: () => void;
  onTriggerClick?: () => void;
}

export const MobileContextMenu: React.FC<MobileContextMenuProps> = ({
  children,
  content,
  onItemClick,
  onTriggerClick
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();

  const longPressEvents = useLongPress({
    onLongPress: () => {
      if (isMobile) {
        setShowMobileMenu(true);
      }
    },
    onClick: onTriggerClick,
    delay: 1000
  });

  const handleMobileMenuClick = () => {
    setShowMobileMenu(false);
    onItemClick();
  };

  const handleContextMenuOpenChange = (open: boolean) => {
    if (!open) {
      setShowMobileMenu(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <div {...longPressEvents} className="relative">
          {children}
        </div>
        
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-lg shadow-lg p-2 min-w-48">
              <div 
                onClick={handleMobileMenuClick}
                className="flex items-center px-3 py-2 text-sm hover:bg-muted rounded-md cursor-pointer"
              >
                {content}
              </div>
              <div 
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center px-3 py-2 text-sm hover:bg-muted rounded-md cursor-pointer text-muted-foreground"
              >
                Cancelar
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <ContextMenu onOpenChange={handleContextMenuOpenChange}>
      <ContextMenuTrigger onClick={onTriggerClick}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onItemClick}>
          {content}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};