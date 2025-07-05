import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircle } from "lucide-react"; // Use Lucide icon

interface PlayerCardProps {
    name: string;
    avatarUrl: string;
    highlight?: boolean;
}

const PlayerCard = ({ name, avatarUrl, highlight = false }: PlayerCardProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
        <div
            className={`flex items-center gap-3 w-full cursor-default relative ${
                highlight ? "ring-2 ring-primary/70 bg-primary/10" : ""
            }`}
        >
            <Image
            src={avatarUrl}
            alt={`${name}'s avatar`}
            width={40}
            height={40}
            className="rounded-full border-2 border-primary/60"
            />
            <span className="font-semibold text-base sm:text-lg truncate w-full">{name}</span>
            {highlight && (
                <span className="absolute -top-2 -right-2 bg-primary text-black rounded-full p-1 shadow">
                    <MessageCircle size={20} />
                </span>
            )}
        </div>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
    </Tooltip>
);

export default PlayerCard;
