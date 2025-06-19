import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ClueProps {
    clue: string;
}

const Clue = ({ clue }: ClueProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
        <span className="text-sm sm:text-base font-medium bg-muted px-2 py-1 rounded-md truncate w-full">
            {clue}
        </span>
        </TooltipTrigger>
        <TooltipContent>{clue}</TooltipContent>
    </Tooltip>
);

export default Clue;
