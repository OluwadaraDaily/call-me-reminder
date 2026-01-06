'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PhoneCall, Clock, CheckCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-32">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8 flex justify-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
              <PhoneCall className="h-8 w-8 text-black" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
              <Clock className="h-8 w-8 text-black" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-black sm:text-6xl md:text-7xl">
            Never Miss Important Calls
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
            Schedule automated reminder calls with AI-powered voice technology.
            Set it once, and we'll make sure you never forget.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-black hover:bg-gray-800">
                Get Started Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-black text-black hover:bg-gray-50">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-black" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-black" />
              <span>Free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-black" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
