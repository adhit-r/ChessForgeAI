import React from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, icon, className }) => {
  return (
    <div className={cn("mb-6 md:mb-8 animate-fade-in", className)}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-primary opacity-80">{icon}</span>}
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
};

export default PageTitle;
