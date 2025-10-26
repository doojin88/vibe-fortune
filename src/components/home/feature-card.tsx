import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 rounded-full bg-indigo-100 p-4">
          <Icon className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
