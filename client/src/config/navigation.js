import { Bell, BookOpen, CircleCheck, Code, LayoutDashboard, Puzzle, Settings, User, Users } from 'lucide-react';

// Sidebar sections. Add an item here and a matching <Route> in App.jsx.
export const NAV_SECTIONS = [
  {
    id: 'prep',
    label: 'Prep',
    items: [
      // FUTURE: Dashboard becomes the full profile — streaks, heatmap, topic strength.
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/prep', label: 'Prep Hub', icon: BookOpen },
      // FUTURE: Practice submenu — random unsolved problem, timed drills, weak-topic picker.
      { to: '/practice', label: 'Practice', icon: Code, hasSubmenu: true },
      // FUTURE: Community — per-problem discussion threads and shared notes.
      { to: '/community', label: 'Community', icon: Users },
    ],
  },
  {
    id: 'spaces',
    label: 'My Spaces',
    items: [
      // FUTURE: user-created spaces (custom collections, revision queue) listed here.
      { to: '/my-spaces', label: 'Completed', icon: CircleCheck },
    ],
  },
];

// User menu above the avatar. Items without `to` are placeholders for now.
export const USER_MENU = [
  { label: 'Profile', icon: User, to: '/dashboard' },
  { label: 'Notifications', icon: Bell }, // FUTURE: revision reminders
  { label: 'Account', icon: Settings, hasSubmenu: true }, // FUTURE: change password, delete account
  { label: 'Troubleshooting', icon: Puzzle }, // FUTURE: resync progress, clear local UI state
];
