import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, FileText, ExternalLink } from 'lucide-react';

type Tool = {
  name: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
};

const TOOLS: Tool[] = [
  {
    name: 'UU Top Page',
    description:
      'Generate print-ready assignment & lab report cover pages with the official Uttara University templates. Fill your details, live preview, and download A4 PDF.',
    url: 'https://uutoppage.pro.bd/',
    icon: FileText,
    tag: 'Cover Page Generator',
  },
];

export const ToolsSection = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="w-7 h-7 text-primary" />
          Tools
        </h1>
        <p className="text-muted-foreground mt-1">
          Handy utilities curated for Uttara University students.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.url}
              className="border-border/50 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-[10px] font-medium">
                        {tool.tag}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    External
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <Button asChild className="w-full" size="sm">
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Tool
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        More tools coming soon. Have a suggestion? Reach out to your CR.
      </p>
    </div>
  );
};
