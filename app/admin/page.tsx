import type { Metadata } from 'next';
import AdminDashboard from './AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin — Panel de Encuestas',
  description: 'Administra tus encuestas, comparte QR y consulta analíticas.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
