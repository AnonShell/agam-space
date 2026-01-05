import { CrossTabBroadcastService } from './broadcast.service';
import { resetAllState } from '../session.service';
import { toast } from 'sonner';

const MESSAGE_TYPES = {
  LOGOUT: 'cross-tab:logout',
};

let isLoggingOut = false;

export const LogoutSync = {
  init() {
    CrossTabBroadcastService.on(MESSAGE_TYPES.LOGOUT, () => {
      if (isLoggingOut) {
        return;
      }

      isLoggingOut = true;

      toast.info('Logged out in another tab', {
        duration: 2000,
      });

      setTimeout(() => {
        resetAllState();
        window.location.href = '/login';
      }, 3000);
    });
  },

  broadcastLogout() {
    if (isLoggingOut) {
      return;
    }

    isLoggingOut = true;
    CrossTabBroadcastService.broadcast(MESSAGE_TYPES.LOGOUT);
  },

  reset() {
    isLoggingOut = false;
  },
};
