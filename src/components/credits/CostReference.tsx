const costs = [
  { amount: "1 cr", label: "Garment Analysis" },
  { amount: "5 cr", label: "Photo Generation" },
  { amount: "15 cr", label: "Multi-angle Set" },
] as const;

export function CostReference() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {costs.map((cost) => (
        <div
          key={cost.label}
          className="flex flex-col gap-1 rounded-[10px] border border-[#27272A] bg-[#18181B] px-4 py-3.5 h-[80px]"
        >
          <span className="font-heading text-[20px] font-bold text-[#FAFAFA]">
            {cost.amount}
          </span>
          <span className="text-[11px] text-[#71717A]">{cost.label}</span>
        </div>
      ))}
    </div>
  );
}
