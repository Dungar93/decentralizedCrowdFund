import { useState } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  score: number;
}

export default function RiskScoreBadge({ score, ...props }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  let colorClass = "bg-green-100 text-green-800";
  let label = "Low Risk";

  if (score >= 60) {
    colorClass = "bg-red-100 text-red-800";
    label = "High Risk";
  } else if (score >= 30) {
    colorClass = "bg-orange-100 text-orange-800";
    label = "Medium Risk";
  }

  return (
    <div className="relative inline-block" {...props}>
      <div
        className={`${colorClass} px-4 py-2 rounded-md font-medium text-lg cursor-default hover:opacity-80 transition`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {label} ({score}/100)
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded whitespace-nowrap">
          Fraud risk score: {score}/100
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}
