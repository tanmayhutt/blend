import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  label: string;
  score: number;
}

export const ScoreCard = ({ label, score }: ScoreCardProps) => {
  return (
    <Card className="score-story-card border border-white/10 bg-white/[.035] p-5 shadow-none">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label.replace(/_/g, " ")}
          </span>
          <span className="text-3xl font-medium tracking-[-.07em] text-foreground">
            {score.toFixed(1)}%
          </span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </Card>
  );
};
