import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PlayerCardProps {
    name: string;
    avatarUrl: string;
}

const PlayerCard = ({ name, avatarUrl }: PlayerCardProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
        <div className="flex items-center gap-3 w-full cursor-default">
            <Image
            src={avatarUrl}
            alt={`${name}'s avatar`}
            width={40}
            height={40}
            className="rounded-full border-2 border-primary/60"
            />
            <span className="font-semibold text-base sm:text-lg truncate w-full">{name}</span>
        </div>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
    </Tooltip>
);

export default PlayerCard;
