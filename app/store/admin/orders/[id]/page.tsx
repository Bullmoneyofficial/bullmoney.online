import { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/shop/admin/AdminOrderDetail';

export const metadata: Metadata = {
  title: 'Order Details | Admin | Bullmoney Store',
  description: 'View and manage order details',
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  
  return <AdminOrderDetail orderId={id} />;
}
