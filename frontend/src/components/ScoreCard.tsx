import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  label: string;
  score: number;
}

export const ScoreCard = ({ label, score }: ScoreCardProps) => {
  return (
    <Card className="score-story-card border-[3px] border-foreground bg-card p-5 shadow-[6px_6px_0_0_#090909]">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">
            {label.replace(/_/g, " ")}
          </span>
          <span className="text-3xl font-black tracking-[-.07em] text-foreground">
            {score.toFixed(1)}%
          </span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </Card>
  );
};
