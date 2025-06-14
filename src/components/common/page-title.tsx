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
    <div className={cn("mb-8", className)}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-primary">{icon}</span>}
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

export default PageTitle;
