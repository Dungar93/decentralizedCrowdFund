// src/components/ui/RiskScoreBadge.tsx
import {
  Tooltip, // This is the Root/namespace in v3
  TooltipTrigger,
  TooltipContent,
  Badge,
  type BadgeProps,
} from "@chakra-ui/react";

interface Props extends BadgeProps {
  score: number;
}

export default function RiskScoreBadge({ score, ...props }: Props) {
  let colorScheme = "green";
  let label = "Low Risk";

  if (score >= 60) {
    colorScheme = "red";
    label = "High Risk";
  } else if (score >= 30) {
    colorScheme = "orange";
    label = "Medium Risk";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          colorScheme={colorScheme}
          fontSize="lg"
          px={4}
          py={2}
          borderRadius="md"
          cursor="default"
          fontWeight="medium"
          {...props}
        >
          {label} ({score}/100)
        </Badge>
      </TooltipTrigger>

      <TooltipContent>Fraud risk score: {score}/100</TooltipContent>
    </Tooltip>
  );
}
