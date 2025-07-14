import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IndividualClue } from "@/lib/types";

interface ClueProps {
    clue: IndividualClue;
}

const Clue = ({ clue }: ClueProps) => {
    const {text, timestamp} = clue;
    return (

        <Tooltip>
        <TooltipTrigger asChild>
        <span className="text-sm sm:text-base font-medium bg-muted px-2 py-1 rounded-md truncate w-full">
            {text}
        </span>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
    </Tooltip>
    )
};

export default Clue;
