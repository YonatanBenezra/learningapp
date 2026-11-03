export type MockSecondaryEmail = {
  id: string;
  email: string;
};

export type MockConnectedAccount = {
  id: string;
  provider: "google" | "github" | "discord" | "linkedin" | "microsoft";
  name: string;
  connected: boolean;
  email?: string;
};

export type MockSession = {
  id: string;
  browser: string;
  os: string;
  location: string;
  lastActive: string;
  current: boolean;
};

export type MockUserSettings = {
  username: string;
  timezone: string;
  fullName: string;
  website: string;
  country: string;
  city: string;
  callingCode: string;
  phone: string;
  avatarUrl: string | null;
  primaryEmail: string;
  secondaryEmails: MockSecondaryEmail[];
  social: {
    github: string;
    linkedin: string;
    x: string;
  };
  isc2MemberId: string;
  openToWork: boolean;
  jobTitle: string;
  yearsExperience: string;
};

export type MockSecuritySettings = {
  passwordLastChanged: string;
  twoFactorEnabled: boolean;
  connectedAccounts: MockConnectedAccount[];
  sessions: MockSession[];
  cookieConsent: "accepted" | "partial" | "none";
};

export type MockUser = {
  settings: MockUserSettings;
  security: MockSecuritySettings;
};

export const mockUser: MockUser = {
  settings: {
    username: "dev",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    fullName: "Jewel Mia",
    website: "",
    country: "Bangladesh",
    city: "Dhaka",
    callingCode: "+880",
    phone: "",
    avatarUrl: null,
    primaryEmail: "dev@gmail.com",
    secondaryEmails: [],
    social: {
      github: "",
      linkedin: "",
      x: "",
    },
    isc2MemberId: "",
    openToWork: false,
    jobTitle: "",
    yearsExperience: "0-2 years (Junior)",
  },
  security: {
    passwordLastChanged: "2025-08-12",
    twoFactorEnabled: false,
    connectedAccounts: [
      { id: "google", provider: "google", name: "Google", connected: true, email: "dev@gmail.com" },
      { id: "github", provider: "github", name: "GitHub", connected: false },
      { id: "discord", provider: "discord", name: "Discord", connected: false },
      { id: "linkedin", provider: "linkedin", name: "LinkedIn", connected: false },
      { id: "microsoft", provider: "microsoft", name: "Microsoft", connected: false },
    ],
    sessions: [
      {
        id: "s1",
        browser: "Chrome 131",
        os: "Linux",
        location: "Dhaka, BD",
        lastActive: "Active now",
        current: true,
      },
      {
        id: "s2",
        browser: "Firefox 132",
        os: "Windows 11",
        location: "Chittagong, BD",
        lastActive: "2 days ago",
        current: false,
      },
    ],
    cookieConsent: "accepted",
  },
};

export function delaySave(ms = 600): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
