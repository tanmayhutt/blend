import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  label: string;
  score: number;
}

export const ScoreCard = ({ label, score }: ScoreCardProps) => {
  return (
    <Card className="border-border/80 bg-card p-5 shadow-none">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold capitalize text-muted-foreground">
            {label.replace(/_/g, " ")}
          </span>
          <span className="text-2xl font-black tracking-[-.05em] text-foreground">
            {score.toFixed(1)}%
          </span>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </Card>
  );
};
