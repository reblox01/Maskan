export const mockDashboardStats = {
  admin: [
    { title: 'Total biens', value: 2847, change: '+23%', trend: 'up' as const },
    { title: 'Utilisateurs', value: 15420, change: '+18%', trend: 'up' as const },
    { title: 'Vues ce mois', value: '847K', change: '+42%', trend: 'up' as const },
    { title: 'Revenus', value: '1 245 000 DH', change: '+31%', trend: 'up' as const },
  ],
  agent: [
    { title: 'Mes biens', value: 156, change: '+12', trend: 'up' as const },
    { title: 'Vues totales', value: '48.2K', change: '+34%', trend: 'up' as const },
    { title: 'Demandes', value: 342, change: '+28', trend: 'up' as const },
    { title: 'Vendus', value: 67, change: '+8', trend: 'up' as const },
  ],
  client: [
    { title: 'Biens sauvegardés', value: 45, trend: 'neutral' as const },
    { title: 'Recherches', value: 128, trend: 'neutral' as const },
    { title: 'Alertes actives', value: 8, trend: 'neutral' as const },
  ],
}

export const mockRecentActivity = [
  { text: 'Nouveau bien ajouté: Villa de luxe à Marrakech', time: 'Il y a 15min', type: 'property' },
  { text: 'Karim a envoyé une demande de visite', time: 'Il y a 30min', type: 'request' },
  { text: 'Bien vendu: Penthouse à Casablanca — 4 500 000 DH', time: 'Il y a 1h', type: 'sale' },
  { text: 'Nouvelle inscription: Fatima Z.', time: 'Il y a 2h', type: 'user' },
  { text: 'Appartement F3 à Rabat réservé', time: 'Il y a 3h', type: 'property' },
]

export const mockChartStats = {
  totalViews: '847.2K',
  totalContacts: '12 450',
  activeProperties: 2847,
  conversionRate: '4.8%',
  chartData: [
    { month: 'Jan', views: 85000, contacts: 3200 },
    { month: 'Fév', views: 92000, contacts: 3800 },
    { month: 'Mar', views: 105000, contacts: 4100 },
    { month: 'Avr', views: 98000, contacts: 3900 },
    { month: 'Mai', views: 120000, contacts: 4800 },
    { month: 'Juin', views: 135000, contacts: 5200 },
    { month: 'Juil', views: 148000, contacts: 5600 },
    { month: 'Août', views: 165000, contacts: 6100 },
  ],
  topProperties: [
    { title: 'Villa Palmeraie Marrakech', views: 12420, contacts: 345 },
    { title: 'Penthouse Californie Casa', views: 9840, contacts: 278 },
    { title: 'Riad Médina Fès', views: 8320, contacts: 234 },
    { title: 'Appartement Agdal Rabat', views: 7150, contacts: 198 },
    { title: 'Villa Tanger Marina', views: 6480, contacts: 167 },
  ],
}

export const mockUsers = [
  { id: '1', email: 'admin@maskan.ma', username: 'admin', phone: '+212 661 000 001', role: 'admin' as const, is_verified: true, is_active: true, developer_mode: true, created_at: '2024-01-01' },
  { id: '2', email: 'ahmed@agency.ma', username: 'ahmed_immo', phone: '+212 661 234 567', role: 'agent' as const, is_verified: true, is_active: true, developer_mode: false, created_at: '2024-02-15' },
  { id: '3', email: 'youssef@gmail.com', username: 'youssef', phone: '+212 662 345 678', role: 'client' as const, is_verified: false, is_active: true, developer_mode: false, created_at: '2024-06-20' },
  { id: '4', email: 'fatima@outlook.com', username: 'fatima_b', phone: '+212 663 456 789', role: 'client' as const, is_verified: false, is_active: true, developer_mode: false, created_at: '2024-08-10' },
  { id: '5', email: 'karim@immo.ma', username: 'karim_immo', phone: '+212 664 567 890', role: 'agent' as const, is_verified: true, is_active: true, developer_mode: false, created_at: '2024-03-05' },
  { id: '6', email: 'sara@pro.ma', username: 'sara_pro', phone: '+212 665 678 901', role: 'agent' as const, is_verified: true, is_active: false, developer_mode: false, created_at: '2024-04-12' },
  { id: '7', email: 'omar@gmail.com', username: 'omar_m', phone: '+212 666 789 012', role: 'client' as const, is_verified: true, is_active: true, developer_mode: false, created_at: '2024-07-22' },
]

export const mockAgentApplications = [
  { id: '101', user: mockUsers[2], status: 'pending' as const, created_at: '2024-12-15T10:30:00Z', reviewed_at: null },
  { id: '102', user: mockUsers[3], status: 'pending' as const, created_at: '2024-12-14T14:20:00Z', reviewed_at: null },
  { id: '103', user: mockUsers[6], status: 'approved' as const, created_at: '2024-11-20T09:00:00Z', reviewed_at: '2024-11-22T11:00:00Z' },
]
