export type AuthBootstrapPhase =
  | 'starting'
  | 'checking-session'
  | 'refreshing-session'
  | 'loading-profile'
  | 'redirecting'
  | 'ready';

export type LoadingMessage = {
  label: string;
  description: string;
};

export const AUTH_LOADING_MESSAGES: Record<AuthBootstrapPhase, LoadingMessage> = {
  starting: {
    label: 'Loading your workspace',
    description: 'Getting things ready…',
  },
  'checking-session': {
    label: 'Loading your workspace',
    description: 'Checking your session…',
  },
  'refreshing-session': {
    label: 'Restoring your session',
    description: 'Refreshing secure credentials…',
  },
  'loading-profile': {
    label: 'Loading your profile',
    description: 'Syncing your account settings…',
  },
  redirecting: {
    label: 'One moment',
    description: 'Redirecting you…',
  },
  ready: {
    label: 'Loading your workspace',
    description: 'Almost there…',
  },
};

export function getRouteLoadingMessage(pathname: string): LoadingMessage {
  if (pathname.startsWith('/admin')) {
    return {
      label: 'Loading admin workspace',
      description: 'Fetching reports and settings…',
    };
  }
  if (pathname.startsWith('/instructor')) {
    return {
      label: 'Loading instructor dashboard',
      description: 'Preparing courses and analytics…',
    };
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return {
      label: 'Loading your dashboard',
      description: 'Fetching courses, progress, and activity…',
    };
  }
  if (pathname.startsWith('/my-courses')) {
    return {
      label: 'Loading your courses',
      description: 'Pulling enrollment and progress…',
    };
  }
  if (pathname.startsWith('/courses')) {
    return {
      label: 'Loading course catalog',
      description: 'Browsing available courses…',
    };
  }
  if (pathname.startsWith('/assessment')) {
    return {
      label: 'Loading assessment',
      description: 'Preparing your skill check…',
    };
  }
  if (pathname.startsWith('/assessments')) {
    return {
      label: 'Loading assessments',
      description: 'Preparing skill checks and practice paths…',
    };
  }
  if (pathname.startsWith('/pricing')) {
    return {
      label: 'Loading pricing',
      description: 'Comparing plans and features…',
    };
  }
  if (pathname.startsWith('/notifications')) {
    return {
      label: 'Loading notifications',
      description: 'Fetching your latest updates…',
    };
  }
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return {
      label: 'Loading sign-in',
      description: 'Preparing authentication…',
    };
  }
  return {
    label: 'Loading LabPath',
    description: 'Getting things ready for you…',
  };
}
