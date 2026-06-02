export const initialProjects = [
  {
    id: '1',
    title: 'App Launch',
    description: 'FlowOS mobile launch Q3',
    color: '#6C63FF',
    progress: 0.65,
    status: 'on_track',
    deadline: '2024-09-30',
    budget: 8000,
    budgetUsed: 5200,
    tasks: [
      { id: 't1', title: 'Design System', done: true, energy: 'high' },
      { id: 't2', title: 'Core Navigation', done: true, energy: 'high' },
      { id: 't3', title: 'Dashboard Screen', done: false, energy: 'high' },
      { id: 't4', title: 'Push Notifications', done: false, energy: 'medium' },
      { id: 't5', title: 'App Store Assets', done: false, energy: 'low' },
    ],
    goal: 'g1',
  },
  {
    id: '2',
    title: 'Personal Brand',
    description: 'Website + LinkedIn + Content',
    color: '#4ECDC4',
    progress: 0.3,
    status: 'at_risk',
    deadline: '2024-08-15',
    budget: 2000,
    budgetUsed: 400,
    tasks: [
      { id: 't6', title: 'Portfolio Website', done: false, energy: 'high' },
      { id: 't7', title: 'LinkedIn Optimization', done: true, energy: 'low' },
      { id: 't8', title: '10 Content Posts', done: false, energy: 'medium' },
    ],
    goal: 'g2',
  },
  {
    id: '3',
    title: 'Fitness Goal',
    description: 'Run 5km under 25min',
    color: '#FFD93D',
    progress: 0.8,
    status: 'on_track',
    deadline: '2024-07-31',
    budget: 500,
    budgetUsed: 320,
    tasks: [
      { id: 't9', title: 'Week 1-4 Training', done: true, energy: 'high' },
      { id: 't10', title: 'Week 5-8 Training', done: true, energy: 'high' },
      { id: 't11', title: 'Final Test Run', done: false, energy: 'high' },
    ],
    goal: 'g3',
  },
];

export const initialGoals = [
  { id: 'g1', title: 'Launch a SaaS Product', year: 2024, color: '#6C63FF' },
  { id: 'g2', title: 'Build a Personal Brand', year: 2024, color: '#4ECDC4' },
  { id: 'g3', title: 'Peak Physical Health', year: 2024, color: '#FFD93D' },
];

export const initialTodayTasks = [
  { id: 'today1', title: 'Dashboard Screen Layout', project: 'App Launch', energy: 'high', done: false, duration: 90 },
  { id: 'today2', title: 'Write 2 LinkedIn Posts', project: 'Personal Brand', energy: 'medium', done: false, duration: 45 },
  { id: 'today3', title: '5km Morning Run', project: 'Fitness Goal', energy: 'high', done: true, duration: 35 },
  { id: 'today4', title: 'Review App Store Copy', project: 'App Launch', energy: 'low', done: false, duration: 20 },
];
