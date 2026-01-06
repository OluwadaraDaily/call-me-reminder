'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Phone, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Schedule Reminders',
    description:
      'Set up reminder calls with just a few clicks. Choose date, time, phone number, and your custom message.',
  },
  {
    icon: Phone,
    title: 'Automated Calls',
    description:
      'Our AI-powered voice system automatically calls your number at the scheduled time and speaks your reminder message.',
  },
  {
    icon: BarChart3,
    title: 'Track Status',
    description:
      'View your dashboard with all reminders sorted by date. Monitor scheduled, completed, and failed call statuses in real-time.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-black">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Everything you need to stay on top of your schedule
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Powerful reminder system with AI voice technology at your fingertips
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white"
              >
                <CardHeader>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-black shadow-lg">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-black">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-7 text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
